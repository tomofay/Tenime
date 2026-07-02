export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    // Use Node.js native fetch — explicitly suppress compression
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://desustream.me/",
        "Range": request.headers.get("range") ?? "",
      },
      redirect: "follow",
    });

    if (!upstream.body) {
      return Response.json({ error: "Empty response" }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "video/mp4",
        "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
        "Content-Length": upstream.headers.get("content-length") || "",
        "Content-Range": upstream.headers.get("content-range") || "",
        "Cache-Control": "no-store, no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
