import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { mongoConfigured } from "@/lib/mongo/client";
import { getRecentCases } from "@/lib/mongo/suspicion-trail";

export const metadata = { title: "Suspicion Trail" };
export const dynamic = "force-dynamic";

function formatWhen(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default async function TrailPage() {
  if (!mongoConfigured) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          eyebrow="Decision record"
          title="Suspicion Trail"
          description="A deterministic, exportable chain of the evidence behind every SAR / no-SAR decision."
        />
        <Card className="mt-6">
          <CardContent className="p-8 text-sm text-muted-foreground">
            MongoDB is not configured. Set <code className="font-mono text-xs">MONGODB_URI</code> in{" "}
            <code className="font-mono text-xs">.env.local</code> to enable the Suspicion Trail.
          </CardContent>
        </Card>
      </div>
    );
  }

  let cases: Awaited<ReturnType<typeof getRecentCases>> = [];
  let loadError: string | null = null;
  try {
    cases = await getRecentCases(30);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Decision record"
        title="Suspicion Trail"
        description="Every MCP tool call the investigator agent makes is persisted here — immutable, exportable, and case-scoped."
      />

      {loadError && (
        <Card className="mt-6 border-risk-critical/40">
          <CardContent className="p-4 text-xs text-risk-critical">
            Failed to load trail activity: {loadError}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Recent cases
              </div>
              <div className="text-sm font-semibold">
                {cases.length} case{cases.length === 1 ? "" : "s"} with recorded activity
              </div>
            </div>
          </div>
          {cases.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No tool calls recorded yet. Open a case and ask the investigator agent something —
              every tool it calls will land here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cases.map((c) => (
                <li key={c.caseId}>
                  <Link
                    href={`/trail/${encodeURIComponent(c.caseId)}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-card/60"
                  >
                    <div>
                      <div className="font-mono text-sm font-semibold">{c.caseId}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Last activity · {formatWhen(c.lastActivity)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{c.events}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        tool call{c.events === 1 ? "" : "s"}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
