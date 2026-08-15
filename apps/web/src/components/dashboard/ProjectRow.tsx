"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/app/actions/projects";
import { formatCurrency, PRICE_PER_BORING } from "@/lib/utils";

interface ProjectRowProps {
  project: any;
}

/** Status → dot colour + label. Same set the cards used. */
const STATUS_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "var(--color-amber-d)", label: "Draft" },
  ACTIVE: { color: "var(--color-green-d)", label: "Active" },
  ON_HOLD: { color: "var(--color-amber-d)", label: "On hold" },
  COMPLETED: { color: "var(--color-blue-d)", label: "Completed" },
  ARCHIVED: { color: "var(--color-text-ter)", label: "Archived" },
};

export default function ProjectRow({ project }: ProjectRowProps) {
  const router = useRouter();
  const [isPaying, startPayment] = useTransition();
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const status = STATUS_MAP[project.status] || STATUS_MAP.DRAFT;
  const epcName = project.epcOrganization?.name || "—";
  const gtName = project.geotechOrganization?.name || "—";
  const isLocked = !!project.lockedAt;

  // The contractor view (project report) is open to every role.
  const projectHref = `/projects/${project.id}/contractor`;

  const meta = project.chainageFrom != null && project.chainageTo != null
    ? `Ch.${project.chainageFrom} – ${project.chainageTo}`
    : project.state || "";

  const counts: Record<string, number> = project.boreholeStatusCounts || {};
  const totalBoreholes: number =
    typeof project.totalBoreholes === "number" ? project.totalBoreholes : 0;
  const completedCount = counts.COMPLETED ?? 0;
  const activeCount = (counts.IN_PROGRESS ?? 0) + (counts.SUSPENDED ?? 0);
  const progressPct = totalBoreholes > 0 ? Math.round((completedCount / totalBoreholes) * 100) : null;

  const boringsPlanned: number | null =
    typeof project.totalBoringsPlanned === "number" && project.totalBoringsPlanned > 0
      ? project.totalBoringsPlanned
      : totalBoreholes > 0
        ? totalBoreholes
        : null;
  const payAmount = boringsPlanned != null ? boringsPlanned * PRICE_PER_BORING : null;

  // Razorpay checkout is not wired up yet — this button is a placeholder.
  const handlePayNowPlaceholder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPayMessage("Payment gateway coming soon.");
  };

  // Locked projects keep the real "record a PENDING payment" action.
  const handlePayNowLocked = (e: React.MouseEvent) => {
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
        setPayMessage("Payment recorded as PENDING — Razorpay checkout coming soon");
        router.refresh();
      }
    });
  };

  return (
    <div
      onClick={() => { if (!isLocked) router.push(projectHref); }}
      className={`group relative grid items-center gap-4 border-b border-border last:border-b-0 transition-colors
        grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.5fr)_150px_auto]
        ${isLocked ? "cursor-default opacity-70" : "cursor-pointer hover:bg-bg-card"}`}
      style={{ padding: "14px 18px" }}
    >
      {/* ── Identity ── */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="w-[7px] h-[7px] rounded-full shrink-0"
          style={{ background: status.color }}
          title={status.label}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] text-text-pri font-medium truncate">{project.name}</span>
            {isLocked && <span className="text-[11px] shrink-0">🔒</span>}
          </div>
          <div className="flex items-center gap-2 mt-[3px] min-w-0">
            <span className="font-mono text-[9px] text-amber-d tracking-[0.1em] shrink-0">
              {project.projectCode}
            </span>
            {meta && (
              <>
                <span className="text-text-ter text-[9px] shrink-0">·</span>
                <span className="text-[10px] text-text-ter truncate">{meta}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Parties (desktop only) ── */}
      <div className="hidden lg:flex flex-col gap-[3px] min-w-0">
        <span className="text-[10px] text-text-sec truncate flex items-center gap-[6px]">
          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--color-rust-d)" }} />
          {epcName}
        </span>
        <span className="text-[10px] text-text-sec truncate flex items-center gap-[6px]">
          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--color-green-d)" }} />
          {gtName}
        </span>
      </div>

      {/* ── Progress (desktop only) ── */}
      <div className="hidden lg:block">
        {totalBoreholes > 0 ? (
          <>
            <div className="flex items-center justify-between text-[9.5px] mb-[5px]">
              <span className="font-mono text-text-sec">
                {completedCount}/{totalBoreholes}
                {activeCount > 0 && <span className="text-amber-d"> · {activeCount} active</span>}
              </span>
              <span className="font-mono text-text-ter">{progressPct}%</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100 ? "var(--color-green-d)" : "var(--color-rust-mid)",
                }}
              />
            </div>
          </>
        ) : (
          <span className="text-[9.5px] text-text-ter font-mono">
            {boringsPlanned != null ? `${boringsPlanned} planned` : "No borings yet"}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          onClick={isLocked ? handlePayNowLocked : handlePayNowPlaceholder}
          disabled={isPaying}
          title={
            boringsPlanned != null
              ? `${boringsPlanned} borings × ${formatCurrency(PRICE_PER_BORING)}`
              : "Razorpay checkout coming soon"
          }
          className="text-[10px] rounded-md text-amber-d cursor-pointer transition-all whitespace-nowrap hover:brightness-125 disabled:opacity-60"
          style={{ padding: "5px 10px", background: "rgba(186,117,23,.1)", border: "1px solid rgba(186,117,23,.24)" }}
        >
          {isPaying ? "Recording…" : payAmount != null ? `Pay · ${formatCurrency(payAmount)}` : "Pay now"}
        </button>
        {!isLocked && (
          <span
            className="text-[10px] rounded-md text-rust-d whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ padding: "5px 10px", background: "rgba(153,60,29,.12)", border: "1px solid rgba(153,60,29,.25)" }}
          >
            Open →
          </span>
        )}
      </div>

      {/* ── Inline feedback ── */}
      {(payMessage || payError) && (
        <div className="col-span-full text-[9.5px] leading-relaxed -mb-1">
          {payMessage && <span className="text-amber-d">{payMessage}</span>}
          {payError && <span className="text-rust-d">{payError}</span>}
        </div>
      )}
    </div>
  );
}
