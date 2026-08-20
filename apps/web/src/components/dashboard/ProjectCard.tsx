"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRazorpayCheckout } from "@/lib/razorpay";
import { formatCurrency, getBoringPricing } from "@/lib/utils";

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

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const status = STATUS_MAP[project.status] || STATUS_MAP.DRAFT;
  const epcName = project.epcOrganization?.name || "—";
  const gtName = project.geotechOrganization?.name || "—";
  const isLocked = !!project.lockedAt;

  // The contractor view (project report) is open to every role — the engineer
  // portal is reachable from its topbar.
  const projectHref = `/projects/${project.id}/contractor`;

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

  // Prefer the planned count captured at creation; fall back to boreholes actually
  // created, so projects made before the count was persisted still show an amount.
  const boringsPlanned: number | null =
    typeof project.totalBoringsPlanned === "number" && project.totalBoringsPlanned > 0
      ? project.totalBoringsPlanned
      : totalBoreholes > 0
        ? totalBoreholes
        : null;
  const payPricing = boringsPlanned != null ? getBoringPricing(boringsPlanned) : null;
  const payAmount = payPricing?.total ?? null;

  // Razorpay checkout: order (server-priced) → modal → signature verification.
  // On success the API marks the payment SUCCESS and unlocks the project.
  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaying) return;
    if (boringsPlanned == null) {
      setPayError("Add boreholes (or a planned count) first to determine the amount.");
      return;
    }
    setPayError(null);
    setPayMessage(null);
    setIsPaying(true);
    startRazorpayCheckout(project.id, boringsPlanned, project.name, {
      onSuccess: () => {
        setIsPaying(false);
        setPayMessage("✓ Payment successful — project activated.");
        router.refresh();
      },
      onError: (message) => {
        setIsPaying(false);
        setPayError(message);
      },
      onDismiss: () => setIsPaying(false),
    });
  };

  return (
    <div
      className={`relative flex flex-col bg-bg-surface border border-border rounded-xl overflow-hidden transition-all duration-150 group ${
        isLocked
          ? "cursor-default"
          : "cursor-pointer hover:border-border-mid hover:-translate-y-[2px] hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.9)]"
      }`}
      onClick={() => { if (!isLocked) router.push(projectHref); }}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl"
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
              className="text-[11px] bg-rust-mid border-none rounded-md text-text-pri cursor-pointer hover:bg-rust transition-colors disabled:opacity-60 disabled:cursor-default"
              style={{ padding: "7px 16px", marginTop: "4px" }}
            >
              {isPaying ? "Opening checkout…" : `Pay now · ${formatCurrency(payAmount)}`}
            </button>
          ) : null}
          {payError && (
            <div className="text-[10px] text-rust-d text-center leading-relaxed max-w-[200px]">{payError}</div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start gap-3 px-[18px] pt-[16px] pb-[14px] border-b border-border">
        <div className="min-w-0">
          <div className="font-mono text-[9px] text-amber-d mb-[6px] tracking-[0.12em]">{project.projectCode}</div>
          <div className="text-[13.5px] font-medium text-text-pri leading-snug mb-[3px] truncate">{project.name}</div>
          {chainage && <div className="text-[10.5px] text-text-ter">{chainage}</div>}
        </div>
        <span className={`text-[8.5px] py-[3px] px-[8px] rounded-full font-medium whitespace-nowrap shrink-0 ${status.cls}`}>
          {status.text}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-[18px] py-[16px]">
        {project.description && (
          <div className="text-[11px] text-text-sec mb-[14px] line-clamp-2 leading-relaxed">{project.description}</div>
        )}

        {totalBoreholes > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-[14px]">
              <MiniStat value={completedCount} label="Complete" className="text-green-d" />
              <MiniStat value={activeCount} label="Active" className="text-amber-d" />
              <MiniStat value={pendingCount} label="Pending" className="text-text-ter" />
            </div>

            {progressPct != null && (
              <div className="flex items-center gap-[10px] mb-[12px]">
                <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct === 100 ? "var(--color-green-d)" : "var(--color-rust-mid)",
                    }}
                  />
                </div>
                <div className="font-mono text-[9.5px] text-text-ter shrink-0">{progressPct}%</div>
              </div>
            )}

            {/* Borehole status dot-strip */}
            <div className="flex gap-[4px] flex-wrap items-center mb-[10px]">
              {visibleDots.map((color, i) => (
                <span key={i} className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              ))}
              {overflow > 0 && (
                <span className="font-mono text-[8.5px] text-text-ter ml-[2px]">+{overflow}</span>
              )}
            </div>
            <div className="flex gap-[12px] flex-wrap mb-[14px]">
              <Legend color="var(--color-green-d)" label="Done" />
              <Legend color="var(--color-amber-d)" label="Active" />
              <Legend color="var(--color-border-mid)" label="Pending" />
              {closedBadCount > 0 && <Legend color="var(--color-red-d)" label="Closed" />}
            </div>
          </>
        ) : (
          <div className="text-[10.5px] text-text-ter mb-[14px] rounded-lg bg-bg-card text-center leading-relaxed px-3 py-[10px]">
            No boreholes created yet{boringsPlanned != null ? ` · ${boringsPlanned} planned` : ""} — add them from the project portal.
          </div>
        )}

        {/* Linked parties */}
        <div className="flex gap-[6px] flex-wrap">
          <PartyPill color="var(--color-rust-d)" name={epcName} />
          <PartyPill color="var(--color-green-d)" name={gtName} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center gap-2 px-[18px] py-[12px] border-t border-border">
        <span className="text-[9.5px] text-text-ter shrink-0">
          {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-[6px]">
          {!isLocked && (
            <button
              onClick={handlePayNow}
              disabled={isPaying}
              title={
                boringsPlanned != null && payPricing != null
                  ? `${boringsPlanned} borings × ${formatCurrency(payPricing.pricePerBoring)}${payPricing.pack ? ` · ${payPricing.pack.name} (${payPricing.pack.discountPct}% off)` : ""}`
                  : "Add boreholes first to determine the amount"
              }
              className="text-[10px] py-[5px] px-[11px] rounded-md text-amber-d cursor-pointer transition-all whitespace-nowrap hover:brightness-125 disabled:opacity-60"
              style={{ background: "rgba(186,117,23,.12)", border: "1px solid rgba(186,117,23,.28)" }}
            >
              {isPaying ? "Opening checkout…" : payAmount != null ? `Pay now · ${formatCurrency(payAmount)}` : "Pay now"}
            </button>
          )}
          <span className="text-[10px] py-[5px] px-[11px] rounded-md text-rust-d cursor-pointer transition-all opacity-0 group-hover:opacity-100 whitespace-nowrap"
            style={{ background: "rgba(153,60,29,.12)", border: "1px solid rgba(153,60,29,.25)" }}>
            Open →
          </span>
        </div>
      </div>

      {/* Placeholder feedback for the not-yet-wired payment gateway */}
      {!isLocked && payMessage && (
        <div className="text-[9.5px] text-amber-d text-center leading-relaxed px-[18px] pb-[12px] -mt-[4px]">
          {payMessage}
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className="text-center rounded-lg bg-bg-card py-[9px] px-1">
      <div className={`font-mono text-[15px] font-medium ${className}`}>{value}</div>
      <div className="text-[8.5px] text-text-ter mt-[3px] tracking-[0.06em]">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[5px] text-[9px] text-text-ter">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function PartyPill({ color, name }: { color: string; name: string }) {
  return (
    <span className="text-[9.5px] py-[3px] px-[9px] rounded-full border-[0.5px] border-border bg-bg-card text-text-ter flex items-center gap-[5px] max-w-full">
      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
      <span className="truncate">{name}</span>
    </span>
  );
}
