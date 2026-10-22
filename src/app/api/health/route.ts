import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "orderline",
      database: "connected",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database unreachable";

    return NextResponse.json(
      {
        ok: false,
        service: "orderline",
        database: "disconnected",
        error: message,
      },
      { status: 503 },
    );
  }
}
