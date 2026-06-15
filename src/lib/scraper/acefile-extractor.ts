// Debug version - dump what the fetch returns
export async function extractAceFileData(acefileUrl: string) {
  let html = "";
  try {
    const res = await fetch(acefileUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0" },
    });
    html = await res.text();
    
    if (!html || html.length < 1000) {
      throw new Error(`HTML too short: ${html.length} bytes`);
    }
  } catch (e: any) {
    throw new Error(`Fetch failed: ${e.message}`);
  }

  // Find all base64 tokens
  const b64s = [...new Set(html.match(/[A-Za-z0-9+\/]{20,}={0,2}/g) || [])];
  const decoded: string[] = [];

  for (const b64 of b64s) {
    try {
      const d = Buffer.from(b64, "base64").toString("utf-8");
      if (/^[\x20-\x7E]+$/.test(d)) decoded.push(d);
    } catch {}
  }

  // Find API key from decoded base64 URLs (inside URL params like &key=XXX)
  let apiKey = "";
  for (const d of decoded) {
    const keyMatch = d.match(/[?&]key=([A-Za-z0-9_-]{30,50})/);
    if (keyMatch) { apiKey = keyMatch[1]; break; }
  }

  // Find file ID (decoded base64 that's alphanumeric, 20-40 chars)
  let fileId = "";
  for (const b64 of b64s) {
    try {
      const d = Buffer.from(b64, "base64").toString("utf-8");
      if (/^[A-Za-z0-9_-]{20,40}$/.test(d) && !d.includes("//") && !d.includes(".")) {
        fileId = d;
        break;
      }
    } catch {}
  }

  if (!apiKey || !fileId) {
    throw new Error(`Parse failed: apiKey=${!!apiKey}, fileId=${!!fileId}, b64Count=${b64s.length}, htmlLen=${html.length}`);
  }

  // Verify via Google Drive API
  const infoRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=json&fields=name,size,mimeType&key=${apiKey}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );

  if (!infoRes.ok) throw new Error(`Drive API failed: HTTP ${infoRes.status}`);
  const info = await infoRes.json();
  if (info.mimeType !== "video/mp4") throw new Error(`Not video: ${info.mimeType}`);

  return { fileName: info.name, fileId, apiKey, size: info.size };
}

export function getGoogleDriveDirectUrl(fileId: string, apiKey: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
}
