"use client";

import { Fragment } from "react";

export type CitationKind = "tx" | "entity" | "fatf" | "case" | "other";

const CITATION_RE = /\[([A-Z]{2,}-[A-Z0-9-]+|entity:[a-z0-9-]+|FATF-[A-Z]{2,}-\d{3})\]/g;

export function citationKind(tag: string): CitationKind {
  if (tag.startsWith("entity:")) return "entity";
  if (tag.startsWith("FATF-")) return "fatf";
  if (tag.startsWith("TX-")) return "tx";
  if (tag.startsWith("CASE-") || tag.startsWith("ALT-")) return "case";
  return "other";
}

export function renderWithCitations(text: string) {
  const parts: (string | { tag: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ tag: match[1] });
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <Fragment key={i}>{p}</Fragment>
    ) : (
      <CitationChip key={i} tag={p.tag} />
    ),
  );
}

export function CitationChip({ tag }: { tag: string }) {
  const kind = citationKind(tag);

  const onClick = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("argus:cite", { detail: { tag, kind } }));
    const selector =
      kind === "entity"
        ? `[data-entity-id="${tag.slice("entity:".length)}"]`
        : kind === "tx"
          ? `[data-tx-id="${tag}"]`
          : kind === "case"
            ? `[data-case-id="${tag}"]`
            : null;
    if (!selector) return;
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const prevShadow = el.style.boxShadow;
    const prevTransition = el.style.transition;
    el.style.transition = "box-shadow 200ms ease-out";
    el.style.boxShadow = "0 0 0 2px #e3a955";
    window.setTimeout(() => {
      el.style.boxShadow = prevShadow;
      el.style.transition = prevTransition;
    }, 1400);
  };

  const dispatchHover = (hovering: boolean) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("argus:cite:hover", { detail: { tag, kind, hovering } }),
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => dispatchHover(true)}
      onMouseLeave={() => dispatchHover(false)}
      onFocus={() => dispatchHover(true)}
      onBlur={() => dispatchHover(false)}
      title={`Jump to ${tag}`}
      className="mx-0.5 inline-flex items-center rounded border border-primary/30 bg-primary/10 px-1 py-0 align-baseline font-mono text-[10px] text-primary transition-colors hover:border-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      {tag}
    </button>
  );
}
