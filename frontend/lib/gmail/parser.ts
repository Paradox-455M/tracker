import { Category } from "@/lib/categories";

export type ParsedEmail = {
  amount: number;
  type: "expense" | "income" | "transfer";
  description: string;
  category: Category;
  txDate: Date;
};

// ── Date parsing ────────────────────────────────────────────────────────────

function parseDateFlexible(text: string): Date | null {
  // "15 Jan 2024" or "Jan 15, 2024"
  const spacePatterns = [
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s*(\d{2,4})\b/i,
  ];
  for (const re of spacePatterns) {
    const m = text.match(re);
    if (m) {
      const d = new Date(m[0]);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // "22-Feb-2026" or "22-Feb-26" — very common in ICICI, HDFC, Axis emails
  const hyphenRe = /\b(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*-(\d{2,4})\b/i;
  const hm = text.match(hyphenRe);
  if (hm) {
    const year = hm[3].length === 2 ? 2000 + Number(hm[3]) : Number(hm[3]);
    const d = new Date(`${hm[1]} ${hm[2]} ${year}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Numeric dd/mm/yyyy (Indian standard) then mm/dd/yyyy fallback
  const nm = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (nm) {
    const p1 = Number(nm[1]), p2 = Number(nm[2]);
    const year = nm[3].length === 2 ? 2000 + Number(nm[3]) : Number(nm[3]);
    if (p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      const d = new Date(year, p2 - 1, p1);
      if (!isNaN(d.getTime()) && d.getDate() === p1) return d;
    }
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
      const d = new Date(year, p1 - 1, p2);
      if (!isNaN(d.getTime()) && d.getDate() === p2) return d;
    }
  }
  return null;
}

// ── Amount extraction ───────────────────────────────────────────────────────
// Try to find the transaction amount near the actual debit/credit verb so we
// don't accidentally pick up "Available Balance: INR 25,000" instead of
// "debited INR 500". Priority: contextual match > first occurrence.

function extractAmount(source: string): number | null {
  const C = "(?:inr|rs\\.?|₹)\\s*";
  const N = "([\\d,]+(?:\\.\\d{1,2})?)";

  const patterns = [
    // "debited [with/by/of] INR X" — verb before amount (ICICI short SMS)
    new RegExp(`(?:debited|deducted|charged|spent)\\s+(?:with\\s+|by\\s+|of\\s+)?${C}${N}`, "i"),
    // "INR X debited/deducted/charged" — amount before verb (Axis, HDFC, SBI)
    new RegExp(`${C}${N}\\s+(?:debited|deducted|charged)`, "i"),
    // "credited [with] INR X"
    new RegExp(`(?:credited|received)\\s+(?:with\\s+)?${C}${N}`, "i"),
    // "INR X credited/received"
    new RegExp(`${C}${N}\\s+(?:credited|received)`, "i"),
    // "paid INR X" / "payment of INR X"
    new RegExp(`(?:paid|payment\\s+of)\\s+${C}${N}`, "i"),
    // "INR X paid"
    new RegExp(`${C}${N}\\s+paid`, "i"),
    // Absolute fallback: first currency+number in source
    new RegExp(`${C}${N}`, "i"),
  ];

  for (const re of patterns) {
    const m = source.match(re);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

// ── Description extraction ──────────────────────────────────────────────────
// Priority-ordered: most specific / reliable first, generic fallbacks last.

function extractDescription(source: string, subjectLine: string, snippet: string): string {
  const trim = (s: string) => s.replace(/\s+/g, " ").trim();

  // 1. UPI VPA — "To VPA: merchant@okaxis" / "VPA: name@upi"
  const vpa = source.match(/(?:to\s+)?VPA\s*[:\-]\s*([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i);
  if (vpa) return trim(vpa[1]);

  // 2. ICICI / Axis UPI reference: "UPI/P2P/123456/MERCHANTNAME"
  //    The merchant is the last segment; strip trailing timestamp/semicolons.
  const upiRef = source.match(/UPI\/P2[PM]\/\d+\/([A-Za-z0-9 &._-]{2,50})/i);
  if (upiRef) return trim(upiRef[1].split(/[;,\s]/)[0].replace(/[.,;:]+$/, ""));

  // 3. Explicit "Info:" field — ICICI, HDFC, Axis bank alerts
  //    Stops at common bank suffixes so we don't grab "UPI Ref: 123" etc.
  const info = source.match(
    /\binfo\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9 &_\/-]{1,40})(?=[,;.\s]*(?:UPI|Ref|NEFT|IMPS|RTGS|Date|Avail|Bal|A\/c|\n|$))/i
  );
  if (info) return trim(info[1]);

  // 4. Explicit "Merchant:" or "Merchant Name:" field
  const merchant = source.match(
    /\bmerchant(?:\s+name)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9 &._-]{1,50})(?=[,;.\s]|$)/i
  );
  if (merchant) return trim(merchant[1].replace(/[.,;:]+$/, ""));

  // 5. "paid to / sent to / transferred to NAME" (Google Pay, PhonePe, Paytm)
  //    Optional amount between "paid" and "to". Stops before "via/using/PhonePe/GPay" or punctuation.
  //    Note: `.` removed from char class so "IRCTC." terminates correctly.
  //    Lazy {1,48}? with lookahead so "Swiggy via Google Pay" stops at "Swiggy".
  const paidTo = source.match(
    /(?:paid|sent|transferred)\s+(?:(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d+)?\s+)?to\s+([A-Za-z0-9][A-Za-z0-9 &_-]{1,48}?)(?=\s+(?:via|using|by|on|through)|[.,\n;(]|$)/i
  );
  if (paidTo) return trim(paidTo[1]);

  // 5b. "purchase at MERCHANT" — Axis: "INR X debited from account on DATE for purchase at MERCHANT"
  //     Dedicated pattern so the generic amtVerbMerchant doesn't pick up the date instead.
  const purchaseAt = source.match(/\bpurchase\s+at\s+([A-Za-z][A-Za-z0-9._/-]{1,40})/i);
  if (purchaseAt) return trim(purchaseAt[1]);

  // 6. Amount-before-verb order: "INR 500 has been debited at MERCHANT"
  //    Prepositions restricted to \bat\b|\bto\b (avoids matching "on DATE" / "for purchase").
  //    Merchant must start with a letter to exclude date strings like "21-02-2026".
  const amtVerbMerchant = source.match(
    /(?:inr|rs\.?|₹)\s*[\d,]+(?:\.\d+)?\s+(?:[^\n]{0,40}?)(?:debited|charged|spent)\s+(?:[^\n]{0,30}?)\bat\b\s+([A-Za-z][A-Za-z0-9 &._@-]{2,50})/i
  );
  if (amtVerbMerchant) return trim(amtVerbMerchant[1]);

  // 7. Verb-before-amount order: "debited INR 500 at/to MERCHANT"
  //    Merchant must start with a letter (avoids capturing dates like "22-Feb-2026").
  //    Lazy {1,48}? with lookahead to stop before trailing "on DATE", "via ...", etc.
  const verbAmtMerchant = source.match(
    /(?:debited|spent|purchased?|charged)\s+(?:rs\.?|inr|₹)?\s*[\d,]+(?:\.\d+)?\s+(?:[^\n]{0,40}?)(?:at|on|to|in)\s+([A-Za-z][A-Za-z0-9 &._@-]{1,48}?)(?=\s+(?:on|via|at|from|by|for|dated?)|[.,\n;(]|$)/i
  );
  if (verbAmtMerchant) return trim(verbAmtMerchant[1]);

  // 8. "Trf to: NAME" / "Transfer to: NAME" — SBI, HDFC transfers
  const trfTo = source.match(
    /(?:trf|transfer)\s+to\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9 &._-]{2,50})(?:\s+A\/c|\s+Ref|[.,;\n]|$)/i
  );
  if (trfTo) return trim(trfTo[1]);

  // 9. Prepositional fallback — uppercase first char to limit noise
  const prep = source.match(/(?:at|to|by)\s+([A-Z][A-Za-z0-9][A-Za-z0-9 &._@-]{1,50})/);
  if (prep) return trim(prep[1]);

  return trim(subjectLine || snippet || "Transaction");
}

// ── Category inference ──────────────────────────────────────────────────────

function inferCategory(description: string): Category {
  const d = description.toLowerCase();
  if (/(splitwise)/.test(d)) return "Transfer";
  if (/(uber|ola|metro|train|bus|fuel|petrol|diesel|rapido)/.test(d)) return "Transportation";
  if (/(zomato|swiggy|restaurant|cafe|coffee|pizza|burger|food|blinkit|dunzo)/.test(d)) return "Food & Dining";
  if (/(amazon|flipkart|myntra|ajio|meesho|nykaa)/.test(d)) return "Shopping";
  if (/(netflix|spotify|prime|youtube|hotstar|zee5|jiocinema)/.test(d)) return "Subscriptions";
  if (/(rent|landlord|lease|pg|hostel)/.test(d)) return "Rent";
  if (/(doctor|hospital|clinic|pharmacy|medicine|gym|fitness)/.test(d)) return "Health";
  if (/(electricity|water|gas|wifi|broadband|internet|recharge|mobile bill)/.test(d)) return "Utilities";
  return "Other";
}

// ── Main entry point ────────────────────────────────────────────────────────

export function parseEmail({
  from,
  subject,
  body,
  snippet,
  receivedAt,
}: {
  from?: string;
  subject?: string;
  body: string;
  snippet?: string;
  receivedAt?: Date;
}): ParsedEmail | null {
  const source = `${subject || ""} \n ${body || ""} \n ${snippet || ""}`;
  const sender = (from || "").toLowerCase();
  const subjectLine = subject || "";

  // ── Hard spam filter (subject only) ────────────────────────────────────────
  // "security alert" intentionally excluded — ICICI/Axis use it for real debit alerts.
  if (/(newsletter|hiring|e-?statement|reward.*?point|otp\s+for|reset.*password|verify.*email|advance\s+tax|due\s+by|bill\s+is\s+due|digital\s+arrest)/i.test(subjectLine)) {
    return null;
  }

  // ── Splitwise ───────────────────────────────────────────────────────────────
  if (/splitwise/i.test(sender) || /splitwise/i.test(subjectLine)) {
    const amountRe = "(?:inr|rs\\.?|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)";
    const nameRe   = "([A-Za-z][A-Za-z\\s.'\\-]{1,40})";

    const paidYou  = source.match(new RegExp(`${nameRe}\\s+paid\\s+you\\s+${amountRe}`, "i"));
    const youPaid  = source.match(new RegExp(`you\\s+paid\\s+${nameRe}\\s+${amountRe}`, "i"));
    const youOwe   = source.match(new RegExp(`you\\s+owe\\s+${nameRe}\\s+${amountRe}`, "i"));
    const recorded = source.match(/recorded\s+a\s+payment\s+(?:of\s+)?(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:to|from)\s+([A-Za-z][A-Za-z\s.'-]{1,40})/i);

    if (paidYou) {
      const amount = parseFloat(paidYou[2].replace(/,/g, ""));
      if (!isNaN(amount)) {
        const when = parseDateFlexible(source) ?? receivedAt ?? null;
        if (!when) return null;
        return { amount, type: "income", description: `Splitwise - ${paidYou[1].trim()}`, category: "Transfer", txDate: when };
      }
    }
    if (youPaid) {
      const amount = parseFloat(youPaid[2].replace(/,/g, ""));
      if (!isNaN(amount)) {
        const when = parseDateFlexible(source) ?? receivedAt ?? null;
        if (!when) return null;
        return { amount, type: "expense", description: `Splitwise - ${youPaid[1].trim()}`, category: "Transfer", txDate: when };
      }
    }
    if (youOwe) {
      const amount = parseFloat(youOwe[2].replace(/,/g, ""));
      if (!isNaN(amount)) {
        const when = parseDateFlexible(source) ?? receivedAt ?? null;
        if (!when) return null;
        return { amount, type: "expense", description: `Splitwise - ${youOwe[1].trim()}`, category: "Transfer", txDate: when };
      }
    }
    if (recorded) {
      const amount = parseFloat(recorded[1].replace(/,/g, ""));
      const name   = recorded[2];
      if (!isNaN(amount)) {
        const when = parseDateFlexible(source) ?? receivedAt ?? null;
        if (!when) return null;
        return { amount, type: /from/i.test(recorded[0]) ? "income" : "expense", description: `Splitwise - ${name.trim()}`, category: "Transfer", txDate: when };
      }
    }
    return null;
  }

  // ── General bank / payment alert ────────────────────────────────────────────

  // Hard gate: must contain at least one definitive financial indicator.
  // "payment", "received", "transfer" are intentionally excluded — too common in non-
  // financial emails. "upi", "imps", "neft", "rtgs" are specific enough to trust alone.
  const isTransactional = /(debited|credited|imps|neft|upi|rtgs|pos\s+transaction|you\s+paid\b|money\s+sent|paid\s+to\b)/i.test(source);
  if (!isTransactional) return null;

  // Amount — prefer amount near the transaction verb to avoid picking up the balance
  const amount = extractAmount(source);
  if (amount === null) return null;

  // ── Transaction type ──────────────────────────────────────────────────────
  let type: ParsedEmail["type"] = "transfer";
  const isBankSender = /(idfc|icici|hdfc|axis|sbi|kotak|yesbank|indusind)/i.test(sender);

  if (/(debited|spent|purchase|charged|\bcharge\b|payment\s+made|pos\s+transaction|paid\s+to\b|you\s+paid|money\s+sent|payment\s+successful)/i.test(source)) {
    type = "expense";
  }
  // Explicit income signals override expense (e.g., a refund after a purchase)
  if (/(refund\s+(?:of|issued|credited)|cashback\s+credited|money\s+received|amount\s+received)/i.test(source)) {
    type = "income";
  } else if (/credited/i.test(source) && type !== "expense") {
    type = "income";
  }
  // Bank-sender UPI/IMPS/NEFT direction is the most reliable signal
  if (isBankSender && /(imps|neft|upi|rtgs)/i.test(source)) {
    if (/credited/i.test(source)) type = "income";
    if (/(debited|transfer\s+to)/i.test(source)) type = "expense";
  }

  // ── Description ─────────────────────────────────────────────────────────────
  const desc = extractDescription(source, subjectLine, snippet || "");

  // ── Date ────────────────────────────────────────────────────────────────────
  const when = parseDateFlexible(source) ?? receivedAt ?? null;
  if (!when) return null;

  // ── Category ────────────────────────────────────────────────────────────────
  const category = type === "income" ? "Income" : type === "transfer" ? "Transfer" : inferCategory(desc);

  return { amount, type, description: desc, category, txDate: when };
}
