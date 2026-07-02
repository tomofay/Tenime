export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://desustream.me/",
        "Range": request.headers.get("range") ?? "",
      },
      redirect: "follow",
    });

    console.error(`[video-proxy] upstream status=${upstream.status} type=${upstream.headers.get("content-type")} len=${upstream.headers.get("content-length")} body=${!!upstream.body}`);

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      console.error(`[video-proxy] upstream error body: ${errBody.slice(0, 200)}`);
      return Response.json({ error: `Upstream returned ${upstream.status}`, detail: errBody.slice(0, 500) }, { status: 502 });
    }

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
    console.error(`[video-proxy] fetch failed: ${(e as Error).message}`, (e as Error).stack);
    return Response.json({ error: `Fetch failed: ${(e as Error).message}` }, { status: 502 });
  }
}
