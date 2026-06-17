import { fetchWithRetry } from "./bypass";

// ============================================================
// Phase 1: Resolve desustream redirects → real host URLs
// ============================================================

export async function resolveDesustreamRedirect(desustreamUrl: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(desustreamUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
          Accept: "text/html,application/xhtml+xml,*/*",
        },
        redirect: "manual",
      });

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get("location");
        if (location) return location;
      }

      const html = await res.text();
      const metaMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+;\s*url=([^"']+)["']/i);
      if (metaMatch) return metaMatch[1];

      const jsMatch = html.match(/window\.location\s*=\s*["']([^"']+)["']/)
        || html.match(/location\.href\s*=\s*["']([^"']+)["']/)
        || html.match(/location\.replace\(["']([^"']+)["']\)/);
      if (jsMatch) return jsMatch[1];

      return null;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

// ============================================================
// Phase 2: Mirror resolution & type detection
// ============================================================

export interface ResolvedMirror {
  name: string;
  type: "acefile" | "pixeldrain" | "gdrive" | "direct" | "unknown";
  url: string;
}

export async function resolveMirrors(
  mirrors: { name: string; url: string }[]
): Promise<ResolvedMirror[]> {
  const seen = new Set<string>();
  const resolved: ResolvedMirror[] = [];

  for (const m of mirrors) {
    try {
      const realUrl = m.url.includes("desustream") || m.url.includes("link.desustream")
        ? await resolveDesustreamRedirect(m.url)
        : m.url;

      if (!realUrl || seen.has(realUrl)) continue;
      seen.add(realUrl);

      const type = detectHost(realUrl, m.name);
      resolved.push({ name: m.name, type, url: realUrl });
    } catch { /* skip */ }
  }

  const typePriority: Record<ResolvedMirror["type"], number> = {
    acefile: 0,
    pixeldrain: 1,
    gdrive: 2,
    direct: 3,
    unknown: 4,
  };
  resolved.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

  return resolved;
}

function detectHost(url: string, name: string): ResolvedMirror["type"] {
  const u = url.toLowerCase();
  if (u.includes("acefile")) return "acefile";
  if (u.includes("pixeldrain") || u.includes("pdrain")) return "pixeldrain";
  if (u.includes("drive.google.com") || u.includes("googleapis.com/drive")) return "gdrive";
  if (u.includes("mega.nz") || u.includes("gofile.io") || u.includes("mediafire")) return "direct";
  if (name.toLowerCase().includes("acefile")) return "acefile";
  if (name.toLowerCase().includes("pdrain") || name.toLowerCase().includes("pixeldrain")) return "pixeldrain";
  return "unknown";
}

// ============================================================
// Acefile "Fast Download" button scraper
// ============================================================
// Acefile pages have a green button with id="no-login-dl"
// Clicking it triggers JS that fetches a direct download URL
// We replicate this by scraping the page for API tokens/params

interface AceFileResult {
  url: string;       // final download URL (GDrive or direct)
  type: "gdrive" | "direct";
  fileName?: string;
}

export async function scrapeAceFile(acefileUrl: string, format: "mp4" | "mkv" = "mp4"): Promise<AceFileResult | null> {
  // Method A: Extract GDrive file ID + API key from page source
  const gdriveResult = await tryGDriveExtract(acefileUrl);
  if (gdriveResult) return gdriveResult;

  // Method B: Try the "Fast Download" POST/GET based on page params
  const fastResult = await tryFastDownload(acefileUrl);
  if (fastResult) return fastResult;

  console.warn(`[acefile] ❌ Both methods failed for ${acefileUrl}`);
  return null;
}

async function tryGDriveExtract(acefileUrl: string): Promise<AceFileResult | null> {
  try {
    const html = await fetchWithRetry(acefileUrl);
    if (!html || html.length < 1000) return null;

    // Extract all base64 b64 segments
    const b64s = [...new Set(html.match(/[A-Za-z0-9+\/]{20,}={0,2}/g) || [])];
    const decoded: string[] = [];
    for (const b64 of b64s) {
      try { const d = Buffer.from(b64, "base64").toString("utf-8"); if (/^[\x20-\x7E]+$/.test(d)) decoded.push(d); } catch {}
    }

    // Find Google API key (appears in decoded base64 as &key=XXX)
    let apiKey = "";
    for (const d of decoded) {
      const keyMatch = d.match(/[?&]key=([A-Za-z0-9_-]{30,50})/);
      if (keyMatch) { apiKey = keyMatch[1]; break; }
    }

    // Find file ID (decoded base64: alphanumeric, 20-44 chars, no dots/slashes)
    let fileId = "";
    for (const b64 of b64s) {
      try {
        const d = Buffer.from(b64, "base64").toString("utf-8");
        if (/^[A-Za-z0-9_-]{20,44}$/.test(d) && !d.includes("//") && !d.includes(".")) { fileId = d; break; }
      } catch {}
    }

    if (!apiKey || !fileId) {
      console.warn(`[acefile:GDrive] Missing apiKey (${!!apiKey}) or fileId (${!!fileId}) from ${b64s.length} b64 tokens`);
      return null;
    }

    // Verify via Drive API
    const infoRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=json&fields=name,size,mimeType&key=${apiKey}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!infoRes.ok) return null;
    const info = await infoRes.json();
    if (!info.mimeType?.startsWith("video/")) return null;

    return {
      url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`,
      type: "gdrive",
      fileName: info.name,
    };
  } catch {
    return null;
  }
}

async function tryFastDownload(acefileUrl: string): Promise<AceFileResult | null> {
  try {
    const html = await fetchWithRetry(acefileUrl);
    if (!html || html.length < 1000) return null;

    // Acefile uses various patterns for Fast Download:
    // 1. POST to same URL with specific form data
    // 2. Redirect after clicking the button
    // 3. JavaScript generates a token then redirects

    // Extract the form action if any
    const formMatch = html.match(/<form[^>]+action=["']([^"']+)["'][^>]*method=["']([^"']+)["']/i);
    if (formMatch) {
      const action = new URL(formMatch[1], acefileUrl).toString();
      const method = formMatch[2].toUpperCase();

      // Collect hidden inputs
      const inputs: Record<string, string> = {};
      const inputRegex = /<input[^>]+name=["']([^"']+)["'][^>]+value=["']([^"']*)["']/gi;
      let match;
      while ((match = inputRegex.exec(html)) !== null) {
        inputs[match[1]] = match[2];
      }

      if (method === "POST") {
        const body = new URLSearchParams(inputs).toString();
        const res = await fetch(action, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
            Referer: acefileUrl,
          },
          body,
          redirect: "follow",
        });

        if (res.ok) {
          // Check if we got redirected to a video URL
          const finalUrl = res.url;
          if (finalUrl !== action && finalUrl !== acefileUrl) {
            if (finalUrl.includes("drive.google.com") || finalUrl.includes("googleapis.com")) {
              return { url: finalUrl, type: "gdrive" };
            }
            return { url: finalUrl, type: "direct" };
          }

          // Check Content-Type
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("video/")) {
            return { url: action, type: "direct" };
          }
        }
      }
    }

    // Try: lookup for data-url or data-download attributes on the button
    const btnMatch = html.match(/id=["']no-login-dl["'][^>]*data-(?:url|href|download)=["']([^"']+)["']/i)
      || html.match(/<button[^>]+id=["']no-login-dl["'][^>]*>/i);
    
    // Acefile may use a JS-generated link after page load
    // Try the no-login-dl link format: some acefile pages generate a direct URL
    const directMatch = html.match(/href=["'](https?:\/\/[^"']*acefile[^"']*(?:dl|download|stream)[^"']*)["']/i);
    if (directMatch) {
      const candidateUrl = directMatch[1];
      const headRes = await fetch(candidateUrl, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" }, redirect: "manual" });
      const location = headRes.headers.get("location");
      if (location) {
        if (location.includes("drive.google.com") || location.includes("googleapis.com")) {
          return { url: location, type: "gdrive" };
        }
        return { url: location, type: "direct" };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================
// PixelDrain download — scrape the Svelte page for download URL
// ============================================================

export async function downloadFromPixelDrain(url: string): Promise<ArrayBuffer> {
  // Step 1: Resolve desustream → real URL
  let realUrl = url;
  if (url.includes("desustream") || url.includes("link.desustream")) {
    const resolved = await resolveDesustreamRedirect(url);
    if (!resolved) throw new Error("PDrain: Failed to resolve desustream redirect");
    realUrl = resolved;
  }

  // Step 2: Extract file ID from URL
  const idMatch = realUrl.match(/(?:\/u\/|\/l\/|\/api\/file\/)([A-Za-z0-9]+)/);
  if (!idMatch) {
    // Not a pixeldrain URL pattern — try direct download
    return downloadFromUrl(realUrl);
  }

  const fileId = idMatch[1];

  // Step 3: Fetch the PixelDrain page and find the download URL
  // PD is a Svelte app — the download button is <button class="toolbar_button svelte-jngqwx">
  // The actual download URL may be embedded in:
  //   - <script> tag with window.__PD_DATA__
  //   - the /api/file/{id} endpoint
  //   - a data attribute on the button
  
  const pageRes = await fetch(`https://pixeldrain.com/u/${fileId}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0" },
  });
  const html = await pageRes.text();

  // Try to find download URL in script data
  let dlUrl = "";

  // Pattern 1: window.__PD_DATA__ or similar embedded data
  const dataMatch = html.match(/(?:window\.__PD_DATA__|__NEXT_DATA__|__NUXT__)\s*=\s*(\{[\s\S]*?\})\s*[\n;]/);
  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      const url = data?.props?.pageProps?.file?.download_url
        || data?.file?.download_url
        || data?.download_url
        || data?.downloadUrl;
      if (url) dlUrl = url;
    } catch {}
  }

  // Pattern 2: Direct download URL in href or data attributes
  if (!dlUrl) {
    const hrefMatch = html.match(/href=["'](\/api\/file\/[A-Za-z0-9]+\/(?:download|dl))["']/)
      || html.match(/href=["'](https?:\/\/[^"']*pixeldrain[^"']*\/api\/file\/[A-Za-z0-9]+\/(?:download|dl)[^"']*)["']/);
    if (hrefMatch) dlUrl = hrefMatch[1];
  }

  // Pattern 3: download_url in any script context
  if (!dlUrl) {
    const urlMatch = html.match(/["']download_url["']\s*:\s*["']([^"']+)["']/)
      || html.match(/["']url["']\s*:\s*["'](\/api\/file\/[^"']+)["']/);
    if (urlMatch) dlUrl = urlMatch[1];
  }

  // Step 4: Build the download URL
  if (dlUrl) {
    if (!dlUrl.startsWith("http")) dlUrl = `https://pixeldrain.com${dlUrl}`;
    if (!dlUrl.includes("?") && !dlUrl.includes("download")) dlUrl = `${dlUrl}?download`;
  } else {
    // Fallback: use the API directly
    dlUrl = `https://pixeldrain.com/api/file/${fileId}?download`;
  }

  console.log(`[pdrain] Downloading from ${dlUrl}`);

  // Step 5: Download
  const res = await fetch(dlUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
      Referer: `https://pixeldrain.com/u/${fileId}`,
    },
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`PDrain HTTP ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/html") || ct.includes("application/json")) {
    throw new Error(`PDrain returned ${ct}, not a file`);
  }

  return res.arrayBuffer();
}

// ============================================================
// Generic URL download with validation
// ============================================================

export async function downloadFromUrl(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  const cl = res.headers.get("content-length");

  if (ct.includes("text/html") || ct.includes("application/json")) {
    throw new Error(`Not a file: ${ct}`);
  }
  if (cl && parseInt(cl) < 500_000) {
    throw new Error(`File too small: ${cl} bytes`);
  }

  return res.arrayBuffer();
}

// ============================================================
// VidHide download
// ============================================================
// VidHide pages embed video via iframe → odvidhide.com → jwplayer with .m3u8
// .m3u8 is streaming-only, cannot be downloaded as a single file
// Falls back to trying other methods

export async function downloadFromVidHide(url: string): Promise<ArrayBuffer> {
  // VidHide serves HLS streaming (.m3u8) — not directly downloadable
  // This will always throw and cascade to next method
  throw new Error("VidHide: HLS streaming not supported for download");
}

// ============================================================
// Buffer validation
// ============================================================

export function isValidVideo(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 1_000_000) return false;
  const view = new Uint8Array(buffer);
  if (view[0] === 0x3C && (view[1] === 0x21 || view[1] === 0x68)) return false; // HTML
  if (view[0] === 0x7B || view[0] === 0x5B) return false; // JSON
  return true;
}
