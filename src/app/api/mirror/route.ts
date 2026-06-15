import { NextResponse } from "next/server";
import { fetchMirrorEmbed } from "@/lib/scraper/mirror-fetcher";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const i = searchParams.get("i");
  const q = searchParams.get("q");

  if (!id || !i || !q) {
    return NextResponse.json(
      { error: "Missing id, i, or q parameter" },
      { status: 400 }
    );
  }

  try {
    const html = await fetchMirrorEmbed(Number(id), Number(i), q);

    // Parse the returned HTML to extract iframe src
    const $ = cheerio.load(html);
    const iframeSrc = $("iframe").first().attr("src");
    const embedUrl = iframeSrc || html;

    return NextResponse.json({ embedUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Mirror fetch error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
