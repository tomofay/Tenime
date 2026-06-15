import { fetchWithRetry } from "./bypass";

async function getNonce(): Promise<string> {
  // Fetch any episode page to get a valid nonce
  const html = await fetchWithRetry(
    "https://otakudesu.blog/episode/tenslem-s4-episode-1-sub-indo/"
  );
  
  // Nonce is fetched via AJAX from the page's JS
  // The nonce endpoint is: POST admin-ajax.php with action=aa1208d27f29ca340c92c66d1926f13f
  const nonceRes = await fetch(
    "https://otakudesu.blog/wp-admin/admin-ajax.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://otakudesu.blog/",
      },
      body: "action=aa1208d27f29ca340c92c66d1926f13f",
    }
  );

  const { data } = await nonceRes.json();
  return data as string;
}

export interface MirrorResult {
  quality: string;
  name: string;
  embedHtml: string;
}

let cachedNonce: string | null = null;

export async function fetchMirrorEmbed(
  id: number,
  i: number,
  q: string
): Promise<string> {
  // Get or refresh nonce
  if (!cachedNonce) {
    cachedNonce = await getNonce();
  }

  const res = await fetch(
    "https://otakudesu.blog/wp-admin/admin-ajax.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
        Referer: "https://otakudesu.blog/",
      },
      body: new URLSearchParams({
        id: String(id),
        i: String(i),
        q,
        nonce: cachedNonce,
        action: "2a3505c93b0035d3f455df82bf976b84",
      }).toString(),
    }
  );

  const { data } = await res.json();

  // If nonce expired, retry once
  if (!data) {
    cachedNonce = await getNonce();
    const retryRes = await fetch(
      "https://otakudesu.blog/wp-admin/admin-ajax.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
          Referer: "https://otakudesu.blog/",
        },
        body: new URLSearchParams({
          id: String(id),
          i: String(i),
          q,
          nonce: cachedNonce,
          action: "2a3505c93b0035d3f455df82bf976b84",
        }).toString(),
      }
    );
    const retryData = await retryRes.json();
    return atob(retryData.data);
  }

  // Response is base64 encoded HTML for the iframe
  return atob(data);
}
