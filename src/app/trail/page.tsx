import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Suspicion Trail" };

export default function TrailPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Decision record"
        title="Suspicion Trail"
        description="A deterministic, exportable chain of the evidence behind every SAR / no-SAR decision."
      />
      <Card className="mt-6">
        <CardContent className="p-8">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Roadmap — Week 3
          </div>
          <h2 className="mt-1 text-base font-semibold">What this page will do</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85">
            <li>
              <span className="font-medium">Capture</span> — every MCP tool call during triage (input, output, citations) is persisted as an immutable record.
            </li>
            <li>
              <span className="font-medium">Scrub</span> — a timeline scrubber lets the investigator walk forward/backward through evidence as it arrived.
            </li>
            <li>
              <span className="font-medium">Branch</span> — alternative hypotheses (e.g. "what if this were smurfing rather than structuring?") are first-class.
            </li>
            <li>
              <span className="font-medium">Export</span> — one-click export to a SAR-ready PDF packet with FATF typology references and tool-call provenance.
            </li>
          </ul>
          <div className="mt-4 font-mono text-[10px] text-muted-foreground">
            Backed by the durable run store and agent-panel event stream already wired in Week 2.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
