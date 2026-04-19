import { XMLParser } from "fast-xml-parser";
import { INTEL_SOURCES, type IntelSource, type IntelSourceId } from "./sources";

export type IntelItem = {
  id: string;
  source_id: IntelSourceId;
  source_label: string;
  jurisdiction: string;
  title: string;
  summary: string;
  url: string;
  published_at: string;
};

const REVALIDATE_SECONDS = 30 * 60;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
});

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(s: string, max = 220): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (x === undefined) return [];
  return Array.isArray(x) ? x : [x];
}

function extractText(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && "#text" in (x as Record<string, unknown>)) {
    return String((x as Record<string, unknown>)["#text"] ?? "");
  }
  return String(x);
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parsePubDate(raw: string): string {
  if (!raw) return "";
  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1.toISOString();

  // Fallback: "Friday, April 17, 2026 - 13:02" (FCA RSS format)
  const m = raw.match(
    /(\w+),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})\s*[\-—,]?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/i,
  );
  if (m) {
    const month = MONTH_NAMES[m[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(
        Date.UTC(
          Number(m[4]),
          month,
          Number(m[3]),
          Number(m[5]),
          Number(m[6]),
          Number(m[7] ?? 0),
        ),
      );
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return "";
}

function parseRss(xml: string, source: IntelSource): IntelItem[] {
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const items = asArray(doc.rss?.channel?.item) as Array<{
    title?: unknown;
    link?: unknown;
    description?: unknown;
    pubDate?: unknown;
    guid?: unknown;
  }>;
  return items.map((it, i) => {
    const title = extractText(it.title);
    const link = extractText(it.link);
    const description = stripHtml(extractText(it.description));
    const pub = extractText(it.pubDate);
    const id = extractText(it.guid) || link || `${source.id}-${i}`;
    return {
      id,
      source_id: source.id,
      source_label: source.label,
      jurisdiction: source.jurisdiction,
      title: stripHtml(title),
      summary: clamp(description),
      url: link,
      published_at: parsePubDate(pub),
    };
  });
}

function parseAtom(xml: string, source: IntelSource): IntelItem[] {
  const doc = parser.parse(xml) as {
    feed?: { entry?: unknown };
  };
  const entries = asArray(doc.feed?.entry) as Array<{
    title?: unknown;
    link?: unknown;
    summary?: unknown;
    content?: unknown;
    updated?: unknown;
    published?: unknown;
    id?: unknown;
  }>;
  return entries.map((e, i) => {
    const title = extractText(e.title);
    const links = asArray(e.link) as Array<{ "@_href"?: string; "@_rel"?: string } | string>;
    const hrefLink = links.find((l) => typeof l === "object" && (l["@_rel"] === "alternate" || !l["@_rel"]));
    const link =
      typeof hrefLink === "object" && hrefLink
        ? hrefLink["@_href"] ?? ""
        : typeof links[0] === "string"
          ? (links[0] as string)
          : "";
    const summary = stripHtml(extractText(e.summary) || extractText(e.content));
    const pub = extractText(e.updated) || extractText(e.published);
    const id = extractText(e.id) || link || `${source.id}-${i}`;
    return {
      id,
      source_id: source.id,
      source_label: source.label,
      jurisdiction: source.jurisdiction,
      title: stripHtml(title),
      summary: clamp(summary),
      url: link,
      published_at: parsePubDate(pub),
    };
  });
}

async function fetchSource(source: IntelSource, signal?: AbortSignal): Promise<IntelItem[]> {
  const res = await fetch(source.url, {
    signal,
    headers: { "user-agent": "ArgusIntel/0.1 (+https://argus.example)" },
    next: { revalidate: REVALIDATE_SECONDS, tags: [`intel:${source.id}`] },
  });
  if (!res.ok) throw new Error(`intel:${source.id} http_${res.status}`);
  const xml = await res.text();
  const items = source.format === "rss" ? parseRss(xml, source) : parseAtom(xml, source);
  return items.filter((i) => i.title && i.url);
}

export type IntelResult = {
  items: IntelItem[];
  sources: { id: IntelSourceId; label: string; ok: boolean; count: number; error?: string }[];
  fetched_at: string;
};

export async function fetchIntel(options: { sourceIds?: IntelSourceId[]; limit?: number } = {}): Promise<IntelResult> {
  const selected = options.sourceIds?.length
    ? INTEL_SOURCES.filter((s) => options.sourceIds!.includes(s.id))
    : INTEL_SOURCES;

  const results = await Promise.all(
    selected.map(async (source) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const items = await fetchSource(source, controller.signal);
        return { source, items, error: null as string | null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "fetch_error";
        return { source, items: [] as IntelItem[], error: msg };
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  // Fair-share merge: cap items per source so a high-volume aggregator
  // (Google News) cannot drown out primary regulator sources (OFSI/HMT/FCA).
  const limit = options.limit ?? Infinity;
  const activeSources = results.filter((r) => r.items.length).length || 1;
  const perSourceCap = options.sourceIds?.length === 1
    ? limit
    : Math.max(3, Math.ceil((Number.isFinite(limit) ? limit : 20) / activeSources));

  const sortByDateDesc = (a: IntelItem, b: IntelItem) =>
    (b.published_at || "").localeCompare(a.published_at || "");

  const capped = results.flatMap((r) =>
    [...r.items].sort(sortByDateDesc).slice(0, perSourceCap),
  );
  const merged = capped.sort(sortByDateDesc);
  const limited = Number.isFinite(limit) ? merged.slice(0, limit) : merged;

  return {
    items: limited,
    sources: results.map((r) => ({
      id: r.source.id,
      label: r.source.label,
      ok: r.error === null,
      count: r.items.length,
      error: r.error ?? undefined,
    })),
    fetched_at: new Date().toISOString(),
  };
}
