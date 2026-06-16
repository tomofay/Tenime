const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export async function fetchWithRetry(
  url: string,
  retries = Number(process.env.SCRAPER_RETRY_COUNT) || 2
): Promise<string> {
  const requestTimeout = Number(process.env.SCRAPER_TIMEOUT_MS) || 25000;
  const totalTimeout = Number(process.env.SCRAPER_TOTAL_TIMEOUT_MS) || 45000;
  const startTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    if (Date.now() - startTime > totalTimeout) {
      throw new Error(`Total timeout exceeded for ${url}`);
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": randomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      if (
        html.includes("Checking your browser") ||
        html.includes("cf-browser-verify") ||
        html.includes("Just a moment") ||
        html.includes("jschl-answer")
      ) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return html;
    } catch (error) {
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}
