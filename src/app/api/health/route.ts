import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "tissue-shop",
    timestamp: new Date().toISOString(),
  });
}
