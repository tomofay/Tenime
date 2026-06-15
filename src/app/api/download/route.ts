import { NextResponse } from "next/server";
import { downloadEpisode, getDownloadStatus } from "@/lib/downloader";
import { extractAceFileData, getGoogleDriveDirectUrl } from "@/lib/scraper/acefile-extractor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get("malId");
  const episodeNumber = searchParams.get("ep");

  if (!malId || !episodeNumber) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const status = await getDownloadStatus(Number(malId), Number(episodeNumber));
    return NextResponse.json(status);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const { malId, episodeNumber, animeTitle = "", url, quality = "720p" } = await request.json();

    if (!malId || !episodeNumber || !url) {
      return NextResponse.json(
        { error: "Missing required fields: malId, episodeNumber, url" },
        { status: 400 }
      );
    }

    // Debug: test AceFile extraction
    const debug: string[] = [];
    debug.push(`Extracting from: ${url}`);
    const gd = await extractAceFileData(url);
    debug.push(`GD result: ${gd ? `ID=${gd.fileId}, API=${gd.apiKey.substring(0,12)}..., size=${gd.size}` : "NULL"}`);

    if (!gd) {
      return NextResponse.json({ success: false, error: "Could not extract Google Drive info from AceFile", debug }, { status: 500 });
    }

    const result = await downloadEpisode(malId, episodeNumber, animeTitle, url, quality);
    return NextResponse.json({ ...result, debug });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, debug: [msg] }, { status: 502 });
  }
}
