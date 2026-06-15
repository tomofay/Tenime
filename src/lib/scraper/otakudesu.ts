import { fetchWithRetry } from "./bypass";
import { extractEmbedUrl } from "./embed-extractor";

export async function fetchEpisodeStreamFromUrl(episodeUrl: string) {
  const html = await fetchWithRetry(episodeUrl);
  return extractEmbedUrl(html);
}
