/* Summary row — matches .summary-row: grid 3cols, gap 10px, mb 20px */

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
    <div className="grid grid-cols-3 gap-[10px] mb-5">
      <StatCard label="Active projects" value={summary.projects} sub={`${summary.boreholes} total borings`} borderClass="border-t-rust" />
      <StatCard label="Total borings" value={summary.boreholes} sub={`${summary.intervals} intervals logged`} borderClass="border-t-amber" />
      <StatCard label="Samples collected" value={summary.samples} sub={`${summary.media} media files`} borderClass="border-t-green" />
    </div>
  );
}

/* Matches .sum-card: bg-surface, border, rounded-lg, padding 14px 16px */
function StatCard({ label, value, sub, borderClass }: { label: string; value: number; sub?: string; borderClass: string }) {
  return (
    <div className={`bg-bg-surface border border-border rounded-lg ${borderClass}`} style={{ padding: "14px 16px" }}>
      <div className="font-display text-[26px] text-text-pri mb-[2px]">{value}</div>
      <div className="text-[10px] text-text-ter uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-text-sec mt-1">{sub}</div>}
    </div>
  );
}
