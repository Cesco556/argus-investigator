export type Severity = "low" | "medium" | "high" | "critical";
export type TypologyId = "structuring" | "layering" | "smurfing" | "sanctions_nexus" | "round_tripping";

export type Transaction = {
  id: string;
  case_id: string;
  ts: string;
  branch: string;
  amount: number;
  currency: "GBP";
  method: "cash_deposit" | "wire" | "card";
  counterparty: string;
};

export type BeneficialOwner = {
  name: string;
  ownership: number;
  residence: string;
  pep: boolean;
};

export type Entity = {
  entity_id: string;
  legal_name: string;
  jurisdiction: string;
  incorporation_date: string;
  entity_type: string;
  beneficial_owners: BeneficialOwner[];
  business_description: string;
  annual_filings: number;
  risk_flags: string[];
  isolation_forest_score: number;
};

export type Case = {
  id: string;
  subject: string;
  subject_entity_id: string | null;
  typology: TypologyId;
  typology_label: string;
  severity: Severity;
  summary: string;
  created_at: string;
  sar_due_at: string;
  age_minutes: number;
  risk_score: number;
  risk_basis: string;
};

export type SanctionsHit = {
  subject: string;
  list: "OFAC_SDN" | "EU_consolidated" | "UN_consolidated" | "HMT_UK";
  match_score: number;
  matched_on: string;
};

export type TypologyPlaybook = {
  id: string;
  name: string;
  description: string;
  red_flags: string[];
  fatf_reference: string;
  sar_narrative_template: string;
};

export const ENTITIES: Record<string, Entity> = {
  "orion-holdings-llc": {
    entity_id: "orion-holdings-llc",
    legal_name: "Orion Holdings LLC",
    jurisdiction: "US-DE",
    incorporation_date: "2024-11-04",
    entity_type: "Delaware LLC",
    beneficial_owners: [
      { name: "Konstantin Reiner", ownership: 0.6, residence: "CY", pep: false },
      { name: "Marta Velásquez", ownership: 0.4, residence: "PA", pep: false },
    ],
    business_description: "Stated as 'general commercial activities' — generic, no operational footprint verified.",
    annual_filings: 0,
    risk_flags: ["newly_incorporated", "generic_business_description", "multi_jurisdiction_ownership"],
    isolation_forest_score: 0.92,
  },
  "helix-capital-partners": {
    entity_id: "helix-capital-partners",
    legal_name: "Helix Capital Partners Ltd",
    jurisdiction: "GB-ENG",
    incorporation_date: "2023-02-11",
    entity_type: "Private limited company",
    beneficial_owners: [
      { name: "Arthur Linwood", ownership: 1.0, residence: "GB", pep: false },
    ],
    business_description: "Stated as 'investment holding'. Routes funds through 4 associated entities.",
    annual_filings: 1,
    risk_flags: ["multi_hop_funnel", "shell_company_cluster"],
    isolation_forest_score: 0.87,
  },
  "ardent-logistics-group": {
    entity_id: "ardent-logistics-group",
    legal_name: "Ardent Logistics Group",
    jurisdiction: "GB-ENG",
    incorporation_date: "2022-08-03",
    entity_type: "Private limited company",
    beneficial_owners: [
      { name: "Chinedu Obi", ownership: 0.55, residence: "GB", pep: false },
      { name: "Layla Harding", ownership: 0.45, residence: "GB", pep: false },
    ],
    business_description: "Freight forwarding. 12 distinct originators depositing into a single operating account.",
    annual_filings: 2,
    risk_flags: ["smurfing_pattern"],
    isolation_forest_score: 0.71,
  },
  "meridian-trade-ltd": {
    entity_id: "meridian-trade-ltd",
    legal_name: "Meridian Trade Ltd",
    jurisdiction: "GB-ENG",
    incorporation_date: "2021-05-16",
    entity_type: "Private limited company",
    beneficial_owners: [
      { name: "Viktor Petrenko", ownership: 1.0, residence: "CY", pep: false },
    ],
    business_description: "Commodities trading. Flagged by OFAC SDN screening, confidence 0.87.",
    annual_filings: 3,
    risk_flags: ["sanctions_partial_match"],
    isolation_forest_score: 0.94,
  },
};

export const TRANSACTIONS: Transaction[] = [
  { id: "TX-09781", case_id: "ALT-20260419-0031", ts: "2026-04-17T09:14:00Z", branch: "Aberdeen · BR-02", amount: 9920, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09783", case_id: "ALT-20260419-0031", ts: "2026-04-17T11:38:00Z", branch: "Aberdeen · BR-02", amount: 9850, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09790", case_id: "ALT-20260419-0031", ts: "2026-04-17T15:02:00Z", branch: "Glasgow · BR-11", amount: 9900, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09812", case_id: "ALT-20260419-0031", ts: "2026-04-18T08:47:00Z", branch: "Glasgow · BR-11", amount: 9400, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09819", case_id: "ALT-20260419-0031", ts: "2026-04-18T12:11:00Z", branch: "Edinburgh · BR-05", amount: 9950, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09824", case_id: "ALT-20260419-0031", ts: "2026-04-18T14:30:00Z", branch: "Edinburgh · BR-05", amount: 9880, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09841", case_id: "ALT-20260419-0031", ts: "2026-04-19T09:22:00Z", branch: "Aberdeen · BR-02", amount: 9700, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09846", case_id: "ALT-20260419-0031", ts: "2026-04-19T11:05:00Z", branch: "Glasgow · BR-11", amount: 9200, currency: "GBP", method: "cash_deposit", counterparty: "self" },
  { id: "TX-09851", case_id: "ALT-20260419-0031", ts: "2026-04-19T13:48:00Z", branch: "Edinburgh · BR-05", amount: 8800, currency: "GBP", method: "cash_deposit", counterparty: "self" },
];

export const SANCTIONS: Record<string, SanctionsHit[]> = {
  "orion-holdings-llc": [],
  "konstantin-reiner": [
    { subject: "Konstantin Reiner", list: "EU_consolidated", match_score: 0.61, matched_on: "name+DOB partial" },
  ],
  "viktor-petrenko": [
    { subject: "Viktor Petrenko", list: "OFAC_SDN", match_score: 0.87, matched_on: "name+DOB" },
  ],
};

export const TYPOLOGY_PLAYBOOKS: TypologyPlaybook[] = [
  {
    id: "FATF-STR-001",
    name: "Structuring / smurfing",
    description: "Splitting cash deposits below reporting threshold across branches or days to avoid CTR/SAR aggregation.",
    red_flags: [
      "Deposits clustered just under reporting threshold",
      "Multi-branch dispersal in short window",
      "Round-number amounts below threshold",
      "No legitimate source-of-funds rationale",
    ],
    fatf_reference: "FATF Recommendation 10 · Guidance on CDD and indicators of structuring",
    sar_narrative_template:
      "Subject {entity} conducted {n} cash deposits of £{range} across {branches} branches within {window}, each falling below the £10,000 CTR threshold. Pattern consistent with structuring typology.",
  },
  {
    id: "FATF-LAY-003",
    name: "Layering via shell vehicles",
    description: "Rapid movement of funds through multiple newly incorporated entities with no operational substance.",
    red_flags: [
      "Newly incorporated entity",
      "No trading history",
      "Generic business description",
      "Multi-jurisdiction ownership",
    ],
    fatf_reference: "FATF Typologies Report 2023 · Shell company misuse",
    sar_narrative_template: "",
  },
  {
    id: "FATF-SMU-002",
    name: "Smurfing into concentration account",
    description: "Many originators depositing into a single beneficiary account to obscure source of funds.",
    red_flags: [
      "Many distinct small originators",
      "Single beneficiary",
      "No commercial relationship between originators and beneficiary",
    ],
    fatf_reference: "FATF Typologies · Cash-intensive businesses",
    sar_narrative_template: "",
  },
  {
    id: "FATF-SAN-004",
    name: "Sanctions nexus",
    description: "Counterparty or beneficial owner partially matches an OFAC/EU/UN list with sufficient confidence to escalate.",
    red_flags: [
      "Name + DOB partial match",
      "Shared jurisdiction with sanctioned entity",
      "Routing pattern through sanctioned corridor",
    ],
    fatf_reference: "FATF Recommendation 6 · Targeted financial sanctions",
    sar_narrative_template: "",
  },
];

export const CASES: Case[] = [
  {
    id: "ALT-20260419-0031",
    subject: "Orion Holdings LLC · 9 deposits · CTR threshold",
    subject_entity_id: "orion-holdings-llc",
    typology: "structuring",
    typology_label: "Structuring",
    severity: "critical",
    summary:
      "9 deposits across 3 branches, each under the £10,000 reporting threshold, over a 72-hour window.",
    created_at: "2026-04-19T02:34:00Z",
    sar_due_at: "2026-05-19T02:34:00Z",
    age_minutes: 12,
    risk_score: 0.92,
    risk_basis: "Isolation Forest · p99",
  },
  {
    id: "ALT-20260419-0028",
    subject: "4-hop funnel · shell-company cluster",
    subject_entity_id: "helix-capital-partners",
    typology: "layering",
    typology_label: "Layering",
    severity: "high",
    summary:
      "Funds moved through 4 associated shell entities within 6 hours, no commercial rationale established.",
    created_at: "2026-04-19T01:59:00Z",
    sar_due_at: "2026-05-19T01:59:00Z",
    age_minutes: 47,
    risk_score: 0.87,
    risk_basis: "Graph score · 4-hop ring",
  },
  {
    id: "ALT-20260419-0022",
    subject: "12 distinct originators · single beneficiary",
    subject_entity_id: "ardent-logistics-group",
    typology: "smurfing",
    typology_label: "Smurfing",
    severity: "medium",
    summary:
      "12 originators across 3 cities depositing small sums into a single Ardent Logistics account.",
    created_at: "2026-04-19T01:35:00Z",
    sar_due_at: "2026-05-19T01:35:00Z",
    age_minutes: 71,
    risk_score: 0.71,
    risk_basis: "Density score · originator fan-in",
  },
  {
    id: "ALT-20260419-0019",
    subject: "OFAC SDN partial match · confidence 0.87",
    subject_entity_id: "meridian-trade-ltd",
    typology: "sanctions_nexus",
    typology_label: "Sanctions nexus",
    severity: "high",
    summary:
      "Beneficial owner Viktor Petrenko partially matches OFAC SDN list at 0.87 confidence.",
    created_at: "2026-04-19T00:42:00Z",
    sar_due_at: "2026-04-26T00:42:00Z",
    age_minutes: 124,
    risk_score: 0.94,
    risk_basis: "Sanctions screen · OFAC SDN",
  },
];

export const TYPOLOGY_MIX_24H: { typology: string; pct: number; severity: Severity | "info" }[] = [
  { typology: "Structuring", pct: 34, severity: "critical" },
  { typology: "Layering", pct: 27, severity: "high" },
  { typology: "Smurfing", pct: 19, severity: "medium" },
  { typology: "Round-tripping", pct: 12, severity: "low" },
  { typology: "Other", pct: 8, severity: "low" },
];

export function caseTotal(caseId: string): number {
  return TRANSACTIONS.filter((t) => t.case_id === caseId).reduce((s, t) => s + t.amount, 0);
}

export function caseTransactions(caseId: string): Transaction[] {
  return TRANSACTIONS.filter((t) => t.case_id === caseId);
}

export function caseBySlug(caseId: string): Case | undefined {
  return CASES.find((c) => c.id === caseId);
}

export function formatGBP(amount: number): string {
  return "£" + amount.toLocaleString("en-GB");
}

export function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}

export function sarClockLabel(dueAt: string, now: Date = new Date()): string {
  const due = new Date(dueAt).getTime();
  const ms = due - now.getTime();
  if (ms <= 0) return "overdue";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
}
