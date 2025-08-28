import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/migrations";

export async function POST() {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: "Migrations completed" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: "Migration failed" },
      { status: 500 }
    );
  }
}
