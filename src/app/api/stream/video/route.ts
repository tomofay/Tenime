import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const reqHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
      Referer: "https://desustream.me/",
      Origin: "https://desustream.me",
    };

    // Forward Range header for seeking
    const range = request.headers.get("range");
    if (range) {
      reqHeaders["Range"] = range;
    }

    const res = await fetch(targetUrl, {
      headers: reqHeaders,
      redirect: "follow",
    });

    const responseHeaders = new Headers();

    // Copy all relevant headers from upstream
    const contentType = res.headers.get("content-type") || "video/mp4";
    responseHeaders.set("Content-Type", contentType);

    const cl = res.headers.get("content-length");
    if (cl) responseHeaders.set("Content-Length", cl);

    const cr = res.headers.get("content-range");
    if (cr) responseHeaders.set("Content-Range", cr);

    const ar = res.headers.get("accept-ranges") || "bytes";
    responseHeaders.set("Accept-Ranges", ar);

    responseHeaders.set("Cache-Control", "public, max-age=3600");
    responseHeaders.set("X-Accel-Buffering", "no");

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
