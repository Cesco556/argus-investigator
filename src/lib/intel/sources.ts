export type IntelSourceId = "fca" | "hmt" | "ofsi" | "global";

export type IntelSource = {
  id: IntelSourceId;
  label: string;
  jurisdiction: string;
  kind: "primary" | "aggregator";
  format: "rss" | "atom";
  url: string;
  description: string;
};

export const INTEL_SOURCES: IntelSource[] = [
  {
    id: "ofsi",
    label: "OFSI",
    jurisdiction: "UK",
    kind: "primary",
    format: "atom",
    url: "https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation.atom",
    description: "UK Office of Financial Sanctions Implementation — sanctions designations and general licences.",
  },
  {
    id: "hmt",
    label: "HM Treasury",
    jurisdiction: "UK",
    kind: "primary",
    format: "atom",
    url: "https://www.gov.uk/government/organisations/hm-treasury.atom",
    description: "Financial crime policy, AML/CTF regulation, and HMT press releases.",
  },
  {
    id: "fca",
    label: "FCA",
    jurisdiction: "UK",
    kind: "primary",
    format: "rss",
    url: "https://www.fca.org.uk/news/rss.xml",
    description: "UK Financial Conduct Authority — enforcement actions, thematic reviews, guidance.",
  },
  {
    id: "global",
    label: "Global",
    jurisdiction: "world",
    kind: "aggregator",
    format: "rss",
    url: "https://news.google.com/rss/search?q=OFAC+OR+FinCEN+OR+FATF+OR+%22anti-money+laundering%22+OR+%22money+laundering%22&hl=en-US&gl=US&ceid=US:en",
    description: "Curated aggregator for OFAC, FinCEN, FATF, and broader AML coverage.",
  },
];

export function getSource(id: string): IntelSource | undefined {
  return INTEL_SOURCES.find((s) => s.id === id);
}
