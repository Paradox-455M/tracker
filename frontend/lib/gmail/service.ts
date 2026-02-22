import { google } from "googleapis";
import { asAuthedClient } from "./auth";
import { parseEmail } from "./parser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { fallbackCategoryFromKeywords } from "@/lib/ai/categorize";

function decodeBase64Url(data?: string | null): string {
  if (!data) return "";
  const buff = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return buff.toString("utf-8");
}

interface MimePart {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: MimePart[] | null;
}

/** Recursively walks a MIME tree to find the best plain-text body. */
function extractTextBody(parts: MimePart[]): string {
  // Prefer text/plain at any depth
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }
  for (const part of parts) {
    if (part.parts?.length) {
      const nested = extractTextBody(part.parts);
      if (nested) return nested;
    }
  }
  // Fall back to HTML (strip tags) when no plain text found
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      return decodeBase64Url(part.body.data)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

async function getDbClient() {
  try {
    return createAdminClient();
  } catch {
    // Fallback for local dev without SUPABASE_SERVICE_ROLE_KEY
    return await createServerClient();
  }
}

export async function fetchAndSyncEmailsForUser(authUserId: string) {
  const logs: string[] = [];
  const log = (m: string) => { try { console.log(m); } catch {} logs.push(m); };
  const supabase = await getDbClient();

  const { data: profile } = await supabase
    .from("users")
    .select("gmail_tokens, gmail_last_synced_at")
    .eq("auth_user_id", authUserId)
    .single();

  if (!profile?.gmail_tokens) {
    log(`[gmail] No gmail_tokens found for user ${authUserId}`);
    return { synced: 0, skipped: 0, logs };
  }

  const tokens = profile.gmail_tokens as Record<string, unknown>;
  const oauth2Client = asAuthedClient(tokens);
  const initialAccessToken = tokens.access_token as string | undefined;
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Always cover the full current month; extend back further if last sync was earlier.
  const lastSyncedAt = profile.gmail_last_synced_at as string | null;
  const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : null;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const effectiveAfter = lastSyncDate && lastSyncDate < monthStart ? lastSyncDate : monthStart;

  // Keep query tight: only hard financial terms (debited/credited/IMPS/NEFT/UPI/RTGS).
  // Generic words like "transaction", "refund", "charged" match too many newsletters.
  // -category:promotions and -category:social use Gmail's auto-classification to
  // eliminate marketing and social-media emails that contain financial amounts.
  const afterStr = effectiveAfter.toISOString().slice(0, 10).replace(/-/g, "/");
  const q = [
    "(debited OR credited OR IMPS OR NEFT OR UPI OR RTGS)",
    "in:inbox",
    "-category:promotions",
    "-category:social",
    `after:${afterStr}`,
  ].join(" ");

  const maxResults = 100; // per page
  const allMessages: Array<{ id?: string | null }> = [];
  let pageToken: string | undefined;
  do {
    const list = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults,
      ...(pageToken ? { pageToken } : {}),
    });
    allMessages.push(...(list.data.messages || []));
    pageToken = list.data.nextPageToken ?? undefined;
  } while (pageToken && allMessages.length < 500);

  const messages = allMessages;
  let synced = 0;
  let skipped = 0;
  log(`[gmail] Found ${messages.length} candidate messages for user ${authUserId} (since ${effectiveAfter.toISOString().slice(0, 10)})`);

  // Step 1: Fetch and parse all messages (N Gmail API calls — unavoidable)
  type ParsedItem = { messageId: string; amount: number; description: string; category: string; txDate: Date; type: string };
  const parsedItems: ParsedItem[] = [];

  for (const m of messages) {
    if (!m.id) continue;
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
    const msgPayload = full.data.payload;
    const headers = (msgPayload?.headers || []) as Array<{ name?: string; value?: string }>;
    const subject = headers.find((h) => (h.name || "").toLowerCase() === "subject")?.value;
    const from = headers.find((h) => (h.name || "").toLowerCase() === "from")?.value;
    const snippet = full.data.snippet || "";

    // Recursively extract text from nested multipart MIME structures
    let body = "";
    if (msgPayload?.parts?.length) {
      body = extractTextBody(msgPayload.parts as MimePart[]);
    } else {
      body = decodeBase64Url(msgPayload?.body?.data || "");
    }

    // Use Gmail's internalDate as a reliable date fallback when email body has no date
    const internalMs = full.data.internalDate ? Number(full.data.internalDate) : NaN;
    const receivedAt = !isNaN(internalMs) ? new Date(internalMs) : undefined;

    log(`[gmail] Processing ${m.id} from=${from || "?"} subject=${subject || "?"}`);
    const parsed = parseEmail({ from, subject, body, snippet, receivedAt });
    if (!parsed) {
      log(`[gmail] Skip ${m.id} – not transactional / parser null`);
      skipped++;
      continue;
    }

    // Upgrade category using the richer keyword map from categorize.ts
    let category = parsed.category as string;
    if (category !== "Transfer" && category !== "Income") {
      const better = fallbackCategoryFromKeywords(parsed.description);
      if (better) category = better;
    }

    log(`[gmail] Parsed ${m.id} amount=${parsed.amount} type=${parsed.type} desc="${parsed.description}" cat=${category}`);
    parsedItems.push({ messageId: m.id, ...parsed, category });
  }

  if (parsedItems.length === 0) {
    log(`[gmail] No parseable messages found`);
  } else {
    // Step 2: One batch query to find already-inserted message IDs
    const messageIds = parsedItems.map((p) => p.messageId);
    const { data: existingRows } = await supabase
      .from("expenses")
      .select("gmail_message_id")
      .eq("user_id", authUserId)
      .in("gmail_message_id", messageIds);

    const existingIds = new Set((existingRows || []).map((r: { gmail_message_id: string }) => r.gmail_message_id));
    const toInsert = parsedItems.filter((p) => !existingIds.has(p.messageId));
    skipped += parsedItems.length - toInsert.length;

    for (const p of parsedItems) {
      if (existingIds.has(p.messageId)) log(`[gmail] Skip ${p.messageId} – already inserted`);
    }

    // Step 3: One batch insert for all new items
    if (toInsert.length > 0) {
      const { error } = await supabase.from("expenses").insert(
        toInsert.map((p) => ({
          user_id: authUserId,
          amount: p.amount,
          description: p.description,
          category: p.category,
          final_category: p.category,
          tx_date: p.txDate.toISOString(),
          gmail_message_id: p.messageId,
        }))
      );
      if (error) {
        log(`[gmail] Batch insert error: ${error.message}`);
      } else {
        synced = toInsert.length;
        for (const p of toInsert) {
          log(`[gmail] Inserted ${p.messageId} amount=${p.amount} type=${p.type} desc=${p.description}`);
        }
      }
    }
  }

  // Persist refreshed access token if Google auto-refreshed it during this run
  const refreshedCredentials = oauth2Client.credentials;
  if (refreshedCredentials.access_token && refreshedCredentials.access_token !== initialAccessToken) {
    await supabase
      .from("users")
      .update({ gmail_tokens: refreshedCredentials })
      .eq("auth_user_id", authUserId);
    log(`[gmail] Access token refreshed and persisted`);
  }

  // Update last synced timestamp
  await supabase
    .from("users")
    .update({ gmail_last_synced_at: new Date().toISOString() })
    .eq("auth_user_id", authUserId);

  return { synced, skipped, logs };
}
