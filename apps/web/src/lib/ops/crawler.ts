import { assertSafeFetchUrl } from "@/lib/url-safety";

export type CrawlResult = {
  title: string | null;
  description: string | null;
  dateTime: string | null;
  image: string | null;
  duration: string | null;
  url: string | null;
  type: "free" | "paid";
  price: number | null;
};

export type ScholarshipCrawlResult = {
  title: string | null;
  description: string | null;
  institution: string | null;
  country: string | null;
  amount: string | null;
  eligibility: string | null;
  deadline: string | null;
  applyUrl: string | null;
};

function getMetaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property="${name}"[^>]+content="([^"]*)"[^>]*>`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${name}"[^>]*>`, "i"),
    new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"[^>]*>`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${name}"[^>]*>`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1]);
      if (data["@type"] === "Event" || data["@type"] === "BusinessEvent" || data["@type"] === "EducationEvent") {
        return data;
      }
      if (Array.isArray(data["@graph"])) {
        const event = data["@graph"].find(
          (item: Record<string, unknown>) =>
            item["@type"] === "Event" || item["@type"] === "BusinessEvent" || item["@type"] === "EducationEvent"
        );
        if (event) return event;
      }
    } catch {
      // skip malformed JSON-LD
    }
  }
  return null;
}

function extractTitle(html: string): string | null {
  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag?.[1]) return titleTag[1].replace(/\s+/g, " ").trim();

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return h1[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  return null;
}

function extractDescription(html: string): string | null {
  const ogDesc = getMetaContent(html, "og:description");
  if (ogDesc) return ogDesc;

  const metaDesc = getMetaContent(html, "description");
  if (metaDesc) return metaDesc;

  return null;
}

function extractImage(html: string, baseUrl: string): string | null {
  const ogImage = getMetaContent(html, "og:image");
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  const twitterImage = getMetaContent(html, "twitter:image");
  if (twitterImage) return resolveUrl(twitterImage, baseUrl);

  return null;
}

function resolveUrl(href: string, base: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function extractDateFromJsonLd(jsonLd: Record<string, unknown>): string | null {
  const startDate = jsonLd.startDate as string | undefined;
  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function extractDurationFromJsonLd(jsonLd: Record<string, unknown>): string | null {
  const duration = jsonLd.duration as string | undefined;
  if (duration) {
    const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
    if (m) {
      const hours = m[1] ? parseInt(m[1]) : 0;
      const mins = m[2] ? parseInt(m[2]) : 0;
      if (hours && mins) return `${hours} hr ${mins} min`;
      if (hours) return `${hours} hr`;
      if (mins) return `${mins} min`;
    }
    return duration;
  }
  return null;
}

function extractDateFromHtml(html: string): string | null {
  const datePatterns = [
    /datetime="([^"]+)"/i,
    /class="[^"]*date[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*event[^"]*date[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*time[^"]*"[^>]*>([^<]+)/i,
  ];
  for (const p of datePatterns) {
    const m = html.match(p);
    if (m?.[1]) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

function extractPriceFromJsonLd(jsonLd: Record<string, unknown>): { type: "free" | "paid"; price: number } | null {
  const offers = jsonLd.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  if (!offers) return null;

  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (!offer) return null;

  const price = offer.price as number | undefined;
  const currency = (offer.priceCurrency as string) || "USD";

  if (price !== undefined && price > 0) {
    return { type: "paid", price };
  }
  if (price === 0 || offer.availability?.toString().includes("Free")) {
    return { type: "free", price: 0 };
  }
  return null;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  await assertSafeFetchUrl(url);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "FlyBridgeBot/1.0 (seminar-crawler)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const jsonLd = extractJsonLd(html);

  let title = extractTitle(html);
  let description = extractDescription(html);
  let image = extractImage(html, url);
  let dateTime: string | null = null;
  let duration: string | null = null;
  let type: "free" | "paid" = "free";
  let price: number | null = null;

  if (jsonLd) {
    if (!title) title = jsonLd.name as string | null;
    if (!description) description = jsonLd.description as string | null;
    if (!image && jsonLd.image) {
      const img = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
      image = resolveUrl(img as string, url);
    }
    dateTime = extractDateFromJsonLd(jsonLd);
    duration = extractDurationFromJsonLd(jsonLd);
    const priceInfo = extractPriceFromJsonLd(jsonLd);
    if (priceInfo) {
      type = priceInfo.type;
      price = priceInfo.price;
    }
  }

  if (!dateTime) dateTime = extractDateFromHtml(html);

  return {
    title: title?.slice(0, 200) ?? null,
    description: description?.slice(0, 1000) ?? null,
    dateTime,
    image,
    duration,
    url,
    type,
    price,
  };
}

function extractTextContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessInstitution(html: string, title: string | null): string | null {
  const ogSite = getMetaContent(html, "og:site_name");
  if (ogSite) return ogSite;

  const patterns = [
    /(?:offered by|from|at|by)\s+([A-Z][\w\s&.]+(?:University|College|Institute|Foundation|Council|Government|Agency|Organization))/i,
    /([A-Z][\w\s&.]+(?:University|College|Institute|Foundation|Council|Government|Agency|Organization))/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim().slice(0, 150);
  }
  return null;
}

function guessCountry(html: string): string | null {
  const text = extractTextContent(html);
  const countries = [
    "United Kingdom", "UK", "United States", "USA", "Canada", "Australia",
    "Germany", "France", "Netherlands", "Sweden", "Switzerland", "Japan",
    "China", "India", "Brazil", "South Korea", "Singapore", "New Zealand",
    "Ireland", "Scotland", "Wales",
  ];
  for (const c of countries) {
    const re = new RegExp(`\\b${c}\\b`, "i");
    if (re.test(text)) return c;
  }
  return null;
}

function guessAmount(html: string): string | null {
  const text = extractTextContent(html);
  const amountPatterns = [
    /(?:up to|worth|value of|amount[:\s]+|scholarship[:\s]+)\s*[$£€]\s*[\d,]+(?:\.\d{2})?(?:\s*(?:per|a|\/)\s*(?:year|annum|month))?/i,
    /[$£€]\s*[\d,]+(?:\.\d{2})?(?:\s*(?:per|a|\/)\s*(?:year|annum|month))?/i,
    /(?:up to|worth|value of)\s+[\d,]+\s*(?:USD|GBP|EUR|CAD|AUD)?/i,
  ];
  for (const p of amountPatterns) {
    const m = text.match(p);
    if (m?.[0]) return m[0].trim().slice(0, 100);
  }
  return null;
}

function guessDeadline(html: string): string | null {
  const text = extractTextContent(html);
  const deadlinePatterns = [
    /(?:deadline|apply by|closing date|applications? close|last date)[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:deadline|apply by|closing date)[:\s]+([^\n.]{5,60})/i,
  ];
  for (const p of deadlinePatterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function guessEligibility(html: string): string | null {
  const text = extractTextContent(html);
  const eligibilityPatterns = [
    /(?:eligible|eligibility|who can apply|requirements?|criteria|open to)[:\s]+([^\n.]{10,200})/i,
    /(?:international students|domestic students|citizens|residents|graduates|undergraduates|masters?|phd|doctoral)[^.]*\./i,
  ];
  for (const p of eligibilityPatterns) {
    const m = text.match(p);
    if (m?.[1] || m?.[0]) return (m[1] || m[0]).trim().slice(0, 200);
  }
  return null;
}

export async function crawlUrlForScholarship(url: string): Promise<ScholarshipCrawlResult> {
  await assertSafeFetchUrl(url);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "FlyBridgeBot/1.0 (scholarship-crawler)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  let title = extractTitle(html);
  let description = extractDescription(html);

  // Try to extract from JSON-LD first
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    if (!title) title = jsonLd.name as string | null;
    if (!description) description = jsonLd.description as string | null;
  }

  const institution = guessInstitution(html, title);
  const country = guessCountry(html);
  const amount = guessAmount(html);
  const deadline = guessDeadline(html);
  const eligibility = guessEligibility(html);

  // For applyUrl, look for application links
  let applyUrl: string | null = null;
  const applyLinkPatterns = [
    /href="([^"]*)"[^>]*>\s*(?:apply|application|submit|register|sign up)/i,
    /<a[^>]+href="([^"]*apply[^"]*)"/i,
    /<a[^>]+href="([^"]*application[^"]*)"/i,
  ];
  for (const p of applyLinkPatterns) {
    const m = html.match(p);
    if (m?.[1]) {
      applyUrl = resolveUrl(m[1], url);
      break;
    }
  }

  return {
    title: title?.slice(0, 200) ?? null,
    description: description?.slice(0, 1000) ?? null,
    institution,
    country,
    amount,
    eligibility,
    deadline,
    applyUrl,
  };
}
