import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Redirect browser directly to googlevideo
  // Referer check happens on our server's outgoing request, but the redirect
  // lets the client fetch directly — googlevideo doesn't check Referer for playback.
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://desustream.me/",
      },
      redirect: "manual",
    });

    // Follow redirects server-side to get final location
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        return NextResponse.redirect(location, { status: 302 });
      }
    }

    // Stream the response — but we need to handle this properly for large files
    // Force raw response without Node.js buffering
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Accel-Buffering", "no");

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
