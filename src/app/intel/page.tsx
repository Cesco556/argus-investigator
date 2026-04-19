import { ExternalLink, Rss } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchIntel } from "@/lib/intel/fetch";
import { INTEL_SOURCES } from "@/lib/intel/sources";

export const metadata = { title: "Regulatory intel" };
export const revalidate = 1800;

function relativeTime(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function IntelPage() {
  const { items, sources, fetched_at } = await fetchIntel({ limit: 40 });

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Threat intelligence"
        title="Regulatory intel"
        description={`Primary-source feeds from UK regulators + curated global AML coverage. ${items.length} items · last fetched ${relativeTime(fetched_at)}.`}
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <Badge
            key={s.id}
            variant="outline"
            className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
            title={s.error ?? `${s.count} items`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-risk-low" : "bg-risk-high"}`} />
            {s.label} · {s.ok ? s.count : "down"}
          </Badge>
        ))}
        {INTEL_SOURCES.every((src) => sources.find((s) => s.id === src.id)?.ok) && (
          <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
            <Rss className="h-2.5 w-2.5" /> all sources live
          </Badge>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No items fetched. All regulator feeds appear to be unreachable — check outbound network.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group block"
            >
              <Card className="h-full transition-colors hover:border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {item.source_label}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.jurisdiction}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {relativeTime(item.published_at)}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="mt-1.5 line-clamp-3 text-[13px] text-muted-foreground">
                      {item.summary}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
                    <ExternalLink className="h-2.5 w-2.5" />
                    <span className="truncate">{new URL(item.url).hostname}</span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
