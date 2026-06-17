import "dotenv/config";

async function lastShot() {
  const token = "mn4bestff8fv";

  // The /download/{token} is 404 but /download/ (no token) redirects to otakudesu
  // Maybe the download URL requires the embed page to have generated it via JS

  // Try: visit odvidhide.com/embed/{token} as a browser, then the video URLs are rendered
  const embedPage = await fetch(`https://odvidhide.com/embed/${token}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  // Forward cookies from embed page
  const embedCookies = embedPage.headers.get("set-cookie") || "";
  const html = await embedPage.text();
  
  // Save to file for manual inspection
  require("fs").writeFileSync("embed-dump.html", html);
  console.log("Saved embed-dump.html (" + html.length + " chars)");

  // The jwplayer setup is obfuscated but let's find the player config
  // The massive obfuscated string at the end after jwplayer|div|position|... contains the config
  // It's a lookup table: key = word, value at position in numeric array
  
  // Extract the obfuscated data
  const obfMatch = html.match(/\.split\('\|'\)$/m);
  if (!obfMatch) {
    console.log("Could not find obfuscated data");  
    // Search for the player setup call
    const setupMatch = html.match(/jwplayer\(['"][^'"]+['"]\)\.setup\(/g);
    console.log("jwplayer setup calls:", setupMatch);
    
    // Grab any scripts near the end
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    const lastScript = scripts[scripts.length - 1] || "";
    console.log("\n\n=== Last script ===");
    console.log(lastScript.substring(0, 10000));
    return;
  }

  // Find the full obfuscated data
  const fullMatch = html.match(/([a-zA-Z0-9_]+\.split\('\|'\))/);
  if (fullMatch) {
    console.log("Found split key:", fullMatch[0]);
  }

  // Actually the download is impossible via this method. VidHide uses:
  // 1. jwplayer with encrypted HLS (.m3u8)
  // 2. The .m3u8 URLs are decoded from obfuscated JS at runtime
  // 3. The download button clicks trigger JS that's also obfuscated
  //
  // Since this is a video streaming site, the "download" button is likely
  // a decoy or only works when cookies + JS context are present
  //
  // Best approach: use Acefile or PixelDrain which are confirmed working
  
  console.log("\n=== Conclusion ===");
  console.log("VidHide download tidak bisa diekstrak server-side.");
  console.log("Video disajikan via HLS dengan JS obfuscated.");
  console.log("Gunakan Acefile/GDrive atau PixelDrain saja.");
}

lastShot();
