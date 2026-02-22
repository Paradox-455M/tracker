export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail/auth";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json(
      {
        error: "Gmail OAuth not configured",
        missing: [
          !process.env.GMAIL_CLIENT_ID && "GMAIL_CLIENT_ID",
          !process.env.GMAIL_CLIENT_SECRET && "GMAIL_CLIENT_SECRET",
          !process.env.GMAIL_REDIRECT_URI && "GMAIL_REDIRECT_URI",
        ].filter(Boolean),
      },
      { status: 500 }
    );
  }
}


