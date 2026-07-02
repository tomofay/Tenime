import { SocksProxyAgent } from "socks-proxy-agent";

export const dynamic = "force-dynamic";

const SOCKS_PROXY = process.env.SOCKS_PROXY || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const reqHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
      Referer: "https://desustream.me/",
    };

    const range = request.headers.get("range");
    if (range) reqHeaders["Range"] = range;

    // Use SOCKS5 proxy if configured, otherwise direct connection (local dev)
    const fetchOpts: RequestInit = { headers: reqHeaders, redirect: "follow" };
    if (SOCKS_PROXY) {
      (fetchOpts as any).agent = new SocksProxyAgent(SOCKS_PROXY);
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
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
    return Response.json({ error: `Fetch failed: ${(e as Error).message}` }, { status: 502 });
  }
}
