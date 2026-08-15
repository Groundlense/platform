/* Summary stats — same three caller-scoped totals, restyled to match the
   marketing pages: mono uppercase label, display-face number, accent hairline. */

interface SummaryRowProps {
  summary: {
    projects: number;
    boreholes: number;
    intervals: number;
    samples: number;
    media: number;
  };
}

export default function SummaryRow({ summary }: SummaryRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* /dashboard/summary returns caller-scoped totals only — no per-status
          breakdown or "reports generated" count exists, so none is shown. */}
      <StatCard
        label="Projects"
        value={summary.projects}
        sub={`${summary.boreholes} total borings`}
        accent="var(--color-rust-mid)"
      />
      <StatCard
        label="Total borings"
        value={summary.boreholes}
        sub={`${summary.intervals} intervals logged`}
        accent="var(--color-amber)"
      />
      <StatCard
        label="Samples collected"
        value={summary.samples}
        sub={`${summary.media} media files`}
        accent="var(--color-g-mid)"
      />
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string;
  value: number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-bg-surface border border-border rounded-xl px-5 py-[18px] transition-colors hover:border-border-mid">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-text-ter mb-[10px]">
        {label}
      </div>
      <div className="font-display text-[32px] leading-none text-text-pri">{value}</div>
      {sub && <div className="text-[11px] text-text-sec mt-[10px]">{sub}</div>}
    </div>
  );
}
