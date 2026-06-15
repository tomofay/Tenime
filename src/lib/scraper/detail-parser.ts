import * as cheerio from "cheerio";

export interface OtakudesuEpisodeLink {
  number: number;
  url: string;
  title: string;
  date: string;
}

export function parseAnimeDetail(html: string): {
  title: string;
  episodes: OtakudesuEpisodeLink[];
} {
  const $ = cheerio.load(html);
  let title = "";
  const episodes: OtakudesuEpisodeLink[] = [];

  $(".infozingle p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith("Judul:")) {
      title = text.replace("Judul:", "").trim();
    }
  });

  if (!title) {
    title = $("h1").first().text().trim() || "Unknown";
  }

  $(".episodelist ul li").each((_, el) => {
    const link = $(el).find("a").first();
    const url = link.attr("href");
    const epTitle = link.text().trim();
    const dateText = $(el).find(".zeebr, .episodedate").text().trim();

    if (!url) return;

    // Only accept /episode/ URLs — skip /lengkap/ (batch page, no iframe) and /anime/ (anime listing)
    if (!url.includes("/episode/")) return;

    const match = epTitle.match(/\b[Ee]pisode\s+(\d+)/i);
    if (!match) return; // skip OVAs, specials, and non-numeric entries

    const num = parseInt(match[1]);
    episodes.push({ number: num, url, title: epTitle, date: dateText });
  });

  // Reverse — Otakudesu lists newest first
  episodes.reverse();

  return { title, episodes };
}
