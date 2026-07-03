import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] ==========================================`);
  console.log(`[${timestamp}] [CLIENT-SIDE DIRECT PLAY] Redirecting URL: ${targetUrl ? targetUrl.slice(0, 60) + "..." : "NULL"}`);

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Pilihan 1: Langsung redirect HTTP 302 agar browser yang memproses handshake TLS murni
  return NextResponse.redirect(targetUrl, { status: 302 });
}