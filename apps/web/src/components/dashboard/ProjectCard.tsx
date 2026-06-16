"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/app/actions/projects";
import { formatCurrency } from "@/lib/utils";

interface ProjectCardProps {
  project: any;
  orgType: string | null;
}

const STATUS_MAP: Record<string, { cls: string; text: string }> = {
  DRAFT: { cls: "st-review", text: "○ Draft" },
  ACTIVE: { cls: "st-active", text: "● Active" },
  ON_HOLD: { cls: "st-review", text: "◐ On hold" },
  COMPLETED: { cls: "st-active", text: "✓ Completed" },
  ARCHIVED: { cls: "st-locked", text: "⬤ Archived" },
};

export default function ProjectCard({ project, orgType }: ProjectCardProps) {
  const router = useRouter();
  const [isPaying, startPayment] = useTransition();
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const status = STATUS_MAP[project.status] || STATUS_MAP.DRAFT;
  const epcName = project.epcOrganization?.name || "—";
  const gtName = project.geotechOrganization?.name || "—";
  const isLocked = !!project.lockedAt;

  // EPC contractors get the read-only contractor portal; geotech/engineers get the data portal.
  const portalSegment = orgType === "EPC_CONTRACTOR" ? "contractor" : "portal";
  const projectHref = `/projects/${project.id}/${portalSegment}`;

  const chainage = project.chainageFrom != null && project.chainageTo != null
    ? `Ch.${project.chainageFrom} – ${project.chainageTo}`
    : project.state || "";

  // ── Real per-status borehole counts from GET /projects ──
  const counts: Record<string, number> = project.boreholeStatusCounts || {};
  const totalBoreholes: number =
    typeof project.totalBoreholes === "number" ? project.totalBoreholes : 0;
  const completedCount = counts.COMPLETED ?? 0;
  const activeCount = (counts.IN_PROGRESS ?? 0) + (counts.SUSPENDED ?? 0);
  const pendingCount = counts.PLANNED ?? 0;
  const closedBadCount = (counts.ABANDONED ?? 0) + (counts.TERMINATED ?? 0);
  const progressPct = totalBoreholes > 0 ? Math.round((completedCount / totalBoreholes) * 100) : null;

  // Dot strip: one dot per borehole by status, capped with a "+n" overflow
  const MAX_DOTS = 24;
  const dotColors: { color: string; count: number }[] = [
    { color: "var(--color-green-d)", count: completedCount },
    { color: "var(--color-amber-d)", count: activeCount },
    { color: "var(--color-border-mid)", count: pendingCount },
    { color: "var(--color-red-d)", count: closedBadCount },
  ];
  const dots: string[] = [];
  for (const { color, count } of dotColors) {
    for (let i = 0; i < count; i++) dots.push(color);
  }
  const overflow = dots.length - MAX_DOTS;
  const visibleDots = overflow > 0 ? dots.slice(0, MAX_DOTS) : dots;

  // Amount only computable when the project declares its planned borings.
  const boringsPlanned: number | null =
    typeof project.totalBoringsPlanned === "number" && project.totalBoringsPlanned > 0
      ? project.totalBoringsPlanned
      : null;
  const payAmount = boringsPlanned != null ? boringsPlanned * 5000 : null;

  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payAmount == null || boringsPlanned == null || isPaying) return;
    setPayError(null);
    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("boringsPurchased", String(boringsPlanned));
    fd.set("amountPaid", String(payAmount));
    startPayment(async () => {
      const res = await createPaymentAction(fd);
      if ("error" in res && res.error) {
        setPayError(res.error);
      } else {
        setPayMessage("Payment recorded as PENDING — complete via Razorpay checkout (coming soon)");
        router.refresh();
      }
    });
  };

  return (
    <div
      className={`relative bg-bg-surface border border-border rounded-[10px] overflow-hidden transition-all duration-150 group ${isLocked ? "cursor-default" : "cursor-pointer hover:border-border-mid hover:-translate-y-[1px]"}`}
      onClick={() => { if (!isLocked) router.push(projectHref); }}
    >
      {/* Locked overlay — matches .proj-locked-overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[10px]"
          style={{ background: "rgba(26,25,24,0.8)", backdropFilter: "blur(5px)", padding: "12px" }}>
          <div className="text-[24px]">🔒</div>
          <div className="text-[11px] text-text-sec text-center leading-relaxed">
            Project locked<br />
            <span className="text-[10px] text-text-ter">{new Date(project.lockedAt).toLocaleDateString("en-IN")}</span>
          </div>
          {payMessage ? (
            <div className="text-[10px] text-amber-d text-center leading-relaxed max-w-[200px]">{payMessage}</div>
          ) : payAmount != null ? (
            <button
              onClick={handlePayNow}
              disabled={isPaying}
              className="text-[11px] bg-rust-mid border-none rounded-[6px] text-text-pri cursor-pointer hover:bg-rust transition-colors disabled:opacity-60 disabled:cursor-default"
              style={{ padding: "7px 16px", marginTop: "4px" }}
            >
              {isPaying ? "Recording…" : `Pay now · ${formatCurrency(payAmount)}`}
            </button>
          ) : null}
          {payError && (
            <div className="text-[10px] text-rust-d text-center leading-relaxed max-w-[200px]">{payError}</div>
          )}
        </div>
      )}

      {/* Header — matches .pc-hdr: padding 12px 14px, border-bottom, flex between */}
      <div className="flex justify-between items-start" style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <div className="font-mono text-[8px] text-amber-d mb-1 tracking-[0.5px]">{project.projectCode}</div>
          <div className="text-[12px] font-medium text-text-pri mb-[2px] leading-snug">{project.name}</div>
          {chainage && <div className="text-[10px] text-text-ter">{chainage}</div>}
        </div>
        <span className={`text-[8px] py-[2px] px-[7px] rounded-full font-medium whitespace-nowrap shrink-0 ${status.cls}`}>{status.text}</span>
      </div>

      {/* Body — matches .pc-body: padding 12px 14px */}
      <div style={{ padding: "12px 14px" }}>
        {project.description && (
          <div className="text-[10px] text-text-sec mb-[10px] line-clamp-2 leading-relaxed">{project.description}</div>
        )}

        {/* Stat row — real per-status borehole counts (boreholeStatusCounts from /projects) */}
        {totalBoreholes > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-[6px] mb-[10px]">
              <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
                <div className="font-mono text-[14px] font-medium text-green-d">{completedCount}</div>
                <div className="text-[8px] text-text-ter mt-[2px]">Complete</div>
              </div>
              <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
                <div className="font-mono text-[14px] font-medium text-amber-d">{activeCount}</div>
                <div className="text-[8px] text-text-ter mt-[2px]">Active</div>
              </div>
              <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
                <div className="font-mono text-[14px] font-medium text-text-ter">{pendingCount}</div>
                <div className="text-[8px] text-text-ter mt-[2px]">Pending</div>
              </div>
            </div>

            {/* Progress — matches .pc-prog-row: COMPLETED / total */}
            {progressPct != null && (
              <div className="flex items-center gap-2 mb-[8px]">
                <div className="flex-1 h-[3px] rounded-[2px] overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-[2px]" style={{ width: `${progressPct}%`, background: progressPct === 100 ? "var(--color-green-d)" : "var(--color-rust-mid)" }} />
                </div>
                <div className="font-mono text-[9px] text-text-ter">{progressPct}%</div>
              </div>
            )}

            {/* Borehole status dot-strip — matches .bh-status-strip / .bh-dot */}
            <div className="flex gap-[3px] flex-wrap items-center mb-[5px]">
              {visibleDots.map((color, i) => (
                <span key={i} className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              ))}
              {overflow > 0 && (
                <span className="font-mono text-[8px] text-text-ter">+{overflow}</span>
              )}
            </div>
            <div className="flex gap-[10px] mb-[8px]">
              <span className="flex items-center gap-1 text-[9px] text-text-ter"><span className="w-2 h-2 rounded-full" style={{ background: "var(--color-green-d)" }} />Done</span>
              <span className="flex items-center gap-1 text-[9px] text-text-ter"><span className="w-2 h-2 rounded-full" style={{ background: "var(--color-amber-d)" }} />Active</span>
              <span className="flex items-center gap-1 text-[9px] text-text-ter"><span className="w-2 h-2 rounded-full" style={{ background: "var(--color-border-mid)" }} />Pending</span>
              {closedBadCount > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-text-ter"><span className="w-2 h-2 rounded-full" style={{ background: "var(--color-red-d)" }} />Closed</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-[10px] text-text-ter mb-[10px] rounded-[6px] bg-bg-card text-center leading-relaxed" style={{ padding: "7px 8px" }}>
            No boreholes created yet{boringsPlanned != null ? ` · ${boringsPlanned} planned` : ""} — add them from the project portal.
          </div>
        )}

        {/* Linked parties — matches .linked-row */}
        <div className="flex gap-[6px] flex-wrap">
          <span className="text-[9px] py-[2px] px-2 rounded-full border-[0.5px] border-border bg-bg-card text-text-ter flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rust-d" /> {epcName}
          </span>
          <span className="text-[9px] py-[2px] px-2 rounded-full border-[0.5px] border-border bg-bg-card text-text-ter flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-d" /> {gtName}
          </span>
        </div>
      </div>

      {/* Footer — matches .pc-foot: padding 10px 14px, border-top, flex between */}
      <div className="flex justify-between items-center" style={{ padding: "10px 14px", borderTop: "1px solid var(--color-border)" }}>
        <span className="text-[9px] text-text-ter">
          {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="text-[10px] py-1 px-[10px] rounded-[5px] text-rust-d cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          style={{ background: "rgba(153,60,29,.12)", border: "1px solid rgba(153,60,29,.25)" }}>
          Open →
        </span>
      </div>
    </div>
  );
}
