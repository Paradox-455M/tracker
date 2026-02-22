import { google } from "googleapis";

export function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Gmail OAuth env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];
  return oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes, prompt: "consent" });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function asAuthedClient(tokens: Record<string, unknown>) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}


