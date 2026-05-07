import { PageHeader } from "@/components/shell/page-header";
import { NetworkGraph } from "@/components/graph/network-graph";
import { PlayheadScrubber } from "@/components/graph/playhead-scrubber";
import { buildNetworkGraph } from "@/lib/graph/build";
import { CASES, TRANSACTIONS, formatGBP } from "@/lib/data/fixtures";

export const metadata = { title: "Exposure graph" };

const CTR_THRESHOLD_GBP = 10000;

export default function GraphPage() {
  const data = buildNetworkGraph();

  const amounts = TRANSACTIONS.map((t) => t.amount);
  const minDeposit = Math.min(...amounts);
  const maxDeposit = Math.max(...amounts);
  const subCtrCount = TRANSACTIONS.filter((t) => t.amount < CTR_THRESHOLD_GBP).length;
  const branches = Array.from(new Set(TRANSACTIONS.map((t) => t.branch.split(" · ")[0])));
  const caseCount = CASES.length;
  const windowHours = 72;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-5">
      <PageHeader
        eyebrow="Exposure graph"
        title="Four cases. One owner network. One investigation."
        description={`Read left to right — sanctions at the source, branches where the cash surfaced. Every edge is evidence.`}
      />
      <div className="mt-5 grid gap-6 md:grid-cols-[300px_1fr]">
        <aside className="md:pt-1">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            The story
          </div>
          <ol className="relative space-y-5 border-l border-border/60 pl-5">
            <Step dot="bg-risk-critical shadow-[0_0_10px] shadow-risk-critical/60" n="01" title="Sanctions nexus">
              Two beneficial owners partially match international lists.
              <div className="mt-1.5 font-mono text-[11px] leading-[1.5] text-risk-critical/90">
                Viktor Petrenko · OFAC SDN · 0.87
                <br />
                Konstantin Reiner · EU consolidated · 0.61
              </div>
            </Step>
            <Step dot="bg-risk-critical/70" n="02" title="Ownership bridge">
              Petrenko holds 100% of Meridian Trade. Reiner holds 60% of Orion Holdings. Two of four
              flagged entities are sanctions-adjacent.
            </Step>
            <Step dot="bg-risk-high" n="03" title="Below-CTR pattern">
              {subCtrCount} cash deposits between {formatGBP(minDeposit)} and{" "}
              {formatGBP(maxDeposit)} — every one under the £10,000 CTR threshold.
            </Step>
            <Step dot="bg-risk-info" n="04" title={`${branches.length} cities · ${windowHours} hours`}>
              {branches.join(", ")}. Same originator, dispersed geography, short window — textbook
              structuring.
            </Step>
            <Step dot="bg-primary" n="05" title="One investigation">
              {caseCount} cases, {caseCount} typologies, one owner graph. That&apos;s the evidence
              the cases belong together.
            </Step>
          </ol>
        </aside>
        <div className="space-y-3">
          <PlayheadScrubber />
          <NetworkGraph data={data} />
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  dot,
  children,
}: {
  n: string;
  title: string;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative">
      <span className={`absolute -left-[23px] top-1.5 h-2 w-2 rounded-full ${dot}`} />
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{n}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{children}</div>
    </li>
  );
}
