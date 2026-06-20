"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAlertLine,
  RiEdit2Line,
  RiCameraLine,
  RiDownloadLine,
  RiShieldCheckLine,
  RiImageLine,
} from "react-icons/ri";
import { getInitials } from "@/lib/utils";
import NotificationBell from "../notifications/NotificationBell";

interface ContractorClientProps {
  project: any;
  boreholes: any[];
  dashboard: any;
  sites: any[];
  user: Record<string, unknown> | null;
  payments: any[];
  reportData: Record<string, any>;
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
  SUSPENDED: "Suspended",
  ABANDONED: "Abandoned",
};

const STATUS_STROKE: Record<string, { stroke: string; dash?: string }> = {
  PLANNED: { stroke: "#D3D1C7", dash: "4,2" },
  IN_PROGRESS: { stroke: "#BA7517", dash: "4,2" },
  COMPLETED: { stroke: "#993C1D" },
  TERMINATED: { stroke: "#5F5E5A" },
  SUSPENDED: { stroke: "#EF9F27", dash: "4,2" },
  ABANDONED: { stroke: "#A32D2D", dash: "4,2" },
};

function num(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function fmtDate(d: any, withYear = true): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function truncate(s: string | null | undefined, max: number): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Map a free-text soil description onto the legend's pattern set. */
function classifySoil(desc: string | null | undefined): {
  bg: string;
  pattern: string | null;
  opacity: number;
  textColor: string;
} {
  const d = (desc || "").toLowerCase();
  if (d.includes("fill")) return { bg: "#EAF3DE", pattern: "url(#p-fill)", opacity: 0.6, textColor: "#639922" };
  if (d.includes("silt")) return { bg: "#FAEEDA", pattern: "url(#p-silt)", opacity: 0.6, textColor: "#BA7517" };
  if (d.includes("clay")) return { bg: "#FAECE7", pattern: "url(#p-clay)", opacity: 0.5, textColor: "#D85A30" };
  if (d.includes("sand") || d.includes("gravel"))
    return { bg: "#FAEEDA", pattern: "url(#p-sand)", opacity: 0.7, textColor: "#854F0B" };
  if (d.includes("rock") && d.includes("hard")) return { bg: "#2C2C2A", pattern: null, opacity: 1, textColor: "#444441" };
  if (d.includes("rock") || d.includes("boulder"))
    return { bg: "#F1EFE8", pattern: "url(#p-rock)", opacity: 0.7, textColor: "#5F5E5A" };
  return { bg: "#F1EFE8", pattern: null, opacity: 1, textColor: "#854F0B" };
}

interface AnomalyFlag {
  intervalKey: string;
  reason: string;
  type: "refusal" | "spike";
}

/**
 * Real anomaly detection: refusal intervals, or an N-value >= 30 that is also
 * >= 2.5x the median of the previous (up to 3) intervals' N-values.
 */
function computeAnomalies(intervals: any[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  intervals.forEach((iv: any, idx: number) => {
    const key = String(iv.id ?? idx);
    const from = num(iv.fromDepth);
    const to = num(iv.toDepth);
    const depthTxt = from != null ? ` at ${from}${to != null ? `–${to}` : ""}m` : "";
    if (iv.isRefusal) {
      flags.push({ intervalKey: key, type: "refusal", reason: `SPT refusal${depthTxt}` });
      return;
    }
    const n = num(iv.nValue);
    if (n != null && n >= 30) {
      const prevNs = intervals
        .slice(Math.max(0, idx - 3), idx)
        .map((p: any) => num(p.nValue))
        .filter((v: number | null): v is number => v != null);
      if (prevNs.length > 0) {
        const med = median(prevNs);
        if (med > 0 && n >= 2.5 * med) {
          flags.push({ intervalKey: key, type: "spike", reason: `N=${n} spike${depthTxt} (prior median N=${med})` });
        }
      }
    }
  });
  return flags;
}

function tickStep(max: number): number {
  const steps = [1, 2, 2.5, 5, 10, 20, 25, 50];
  for (const s of steps) if (max / s <= 7) return s;
  return Math.ceil(max / 7);
}

interface BhDerived {
  bh: any;
  intervals: any[];
  anomalies: AnomalyFlag[];
  anomalyKeys: Set<string>;
  drawDepth: number | null;
  wtDepth: number | null;
  reviewedIntervals: any[];
}

export default function ContractorClient({
  project,
  boreholes,
  dashboard: _dashboard,
  sites,
  user,
  payments,
  reportData,
}: ContractorClientProps) {
  const router = useRouter();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites.length > 0 ? sites[0].id : "");
  const [viewMode, setViewMode] = useState<"site" | "eng">("site");
  const [hoveredBhId, setHoveredBhId] = useState<string | null>(null);

  // Boreholes for the selected structure. No fabricated fallback — empty stays empty.
  const displayBoreholes = useMemo(
    () => (sites.length > 0 ? boreholes.filter((b: any) => b.siteId === selectedSiteId) : boreholes),
    [boreholes, sites.length, selectedSiteId]
  );

  // Per-borehole derived data from the real report payloads.
  const bhData = useMemo(() => {
    const map: Record<string, BhDerived> = {};
    for (const bh of boreholes) {
      const report = reportData?.[bh.id];
      const intervals = [...(report?.intervals ?? [])].sort(
        (a: any, b: any) => (num(a.fromDepth) ?? 0) - (num(b.fromDepth) ?? 0)
      );
      const anomalies = computeAnomalies(intervals);
      const depthCandidates = [
        num(bh.plannedDepth),
        num(bh.finalDepth),
        ...intervals.map((iv: any) => num(iv.toDepth)),
      ].filter((v): v is number => v != null && v > 0);
      const wtObs = [...(report?.waterTableObservations ?? [])].sort(
        (a: any, b: any) => new Date(b.observedAt ?? 0).getTime() - new Date(a.observedAt ?? 0).getTime()
      );
      map[bh.id] = {
        bh,
        intervals,
        anomalies,
        anomalyKeys: new Set(anomalies.map((a) => a.intervalKey)),
        drawDepth: depthCandidates.length ? Math.max(...depthCandidates) : null,
        wtDepth: wtObs.length ? num(wtObs[0].depth) : null,
        reviewedIntervals: intervals.filter((iv: any) => typeof iv.remarks === "string" && iv.remarks.includes("IS ")),
      };
    }
    return map;
  }, [boreholes, reportData]);

  // Real photos flattened from the selected structure's interval media.
  const photos = useMemo(
    () =>
      displayBoreholes.flatMap((bh: any) => {
        const intervals = bhData[bh.id]?.intervals ?? [];
        return intervals.flatMap((iv: any) =>
          (iv.media ?? []).map((m: any) => ({
            id: m.id,
            fileName: m.fileName,
            mimeType: m.mimeType,
            createdAt: m.createdAt,
            bhCode: bh.boreholeCode,
            from: num(iv.fromDepth),
            to: num(iv.toDepth),
          }))
        );
      }),
    [displayBoreholes, bhData]
  );

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF8F6]">
        <div className="text-center bg-white p-8 rounded-xl border border-[#D3D1C7]">
          <div className="text-[28px] mb-3">⚠️</div>
          <div className="text-[14px] text-text-sec font-medium">Project not found</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-[11px] py-1.5 px-3 bg-rust-mid text-white rounded-md hover:bg-rust-d transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const firstName = (user?.firstName as string) || "";
  const lastName = (user?.lastName as string) || "";
  const initials = getInitials(firstName, lastName);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User";

  // ---- Summary stats (real data only) ----
  const completedAll = boreholes.filter((b: any) => b.status === "COMPLETED").length;
  const successPayments = payments.filter((p: any) => p.status === "SUCCESS");
  const investigationCost = successPayments.reduce((sum: number, p: any) => sum + (num(p.amountPaid) ?? 0), 0);
  const costLabel =
    successPayments.length > 0
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
          investigationCost
        )
      : "—";
  const totalAnomalies = boreholes.reduce((sum: number, b: any) => sum + (bhData[b.id]?.anomalies.length ?? 0), 0);

  // Anomaly flags for the displayed structure (used by the warning strip).
  const displayedAnomalies = displayBoreholes.flatMap((bh: any) =>
    (bhData[bh.id]?.anomalies ?? []).map((a) => ({ bh, ...a }))
  );

  // Engineer-review notes derived from real interval remarks (IS-code references).
  const reviewedNotes = displayBoreholes.flatMap((bh: any) =>
    (bhData[bh.id]?.reviewedIntervals ?? []).map((iv: any) => ({ bh, iv }))
  );

  const currentSite = sites.find((s: any) => s.id === selectedSiteId) || null;

  const handleBackToDashboard = () => router.push("/dashboard");
  const handleSwitchToPortal = () => router.push(`/projects/${project.id}/portal`);

  // ---- Cross-section geometry ----
  const TOP_Y = 30;
  const CHART_H = 320;
  const sectionMax = (() => {
    const depths = displayBoreholes
      .map((bh: any) => bhData[bh.id]?.drawDepth)
      .filter((v: number | null | undefined): v is number => v != null && v > 0);
    return depths.length ? Math.max(...depths) : 10;
  })();
  const pxPerM = CHART_H / sectionMax;
  const depthToY = (d: number) => TOP_Y + d * pxPerM;
  const step = tickStep(sectionMax);
  const ticks: number[] = [];
  for (let d = 0; d <= sectionMax + 1e-9; d += step) ticks.push(Math.round(d * 100) / 100);

  const bhXFor = (index: number, svgWidth: number) =>
    displayBoreholes.length === 1 ? svgWidth / 2 : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

  /** Shared cross-section renderer for both "site" and "eng" modes — same real data, different labelling. */
  const renderCrossSection = (mode: "site" | "eng") => {
    if (displayBoreholes.length === 0) {
      return (
        <div className="py-20 text-center text-text-ter text-[12px]">
          No boreholes available for cross section.
        </div>
      );
    }

    const svgWidth = Math.max(620, displayBoreholes.length * 125);

    return (
      <div className="relative overflow-x-auto select-none" style={{ width: "100%" }}>
        <div style={{ width: `${svgWidth}px` }}>
          <svg width={svgWidth} height="370" viewBox={`0 0 ${svgWidth} 370`} className="block">
            <defs>
              <pattern id={`p-fill-${mode}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#97C459" strokeWidth="1.5" /></pattern>
              <pattern id={`p-silt-${mode}`} patternUnits="userSpaceOnUse" width="8" height="4"><line x1="0" y1="2" x2="8" y2="2" stroke="#EF9F27" strokeWidth="1.5" /></pattern>
              <pattern id={`p-clay-${mode}`} patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="0" y2="5" stroke="#F0997B" strokeWidth="1.5" /></pattern>
              <pattern id={`p-sand-${mode}`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#BA7517" strokeWidth="1.5" /></pattern>
              <pattern id={`p-rock-${mode}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(135)"><line x1="0" y1="0" x2="0" y2="6" stroke="#888780" strokeWidth="1.5" /></pattern>
            </defs>

            {/* depth axis scaled to real max depth */}
            <line x1="42" y1={TOP_Y} x2="42" y2={TOP_Y + CHART_H} stroke="#D3D1C7" strokeWidth="0.5" />
            {ticks.map((d) => (
              <g key={`tick-${d}`}>
                <text x="4" y={depthToY(d) + 3} fontSize="9" fill="#888780" fontFamily="sans-serif">
                  {d}m
                </text>
                <line x1="42" y1={depthToY(d)} x2={svgWidth} y2={depthToY(d)} stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
              </g>
            ))}

            {/* ground surface */}
            <line x1="54" y1={TOP_Y - 2} x2={svgWidth} y2={TOP_Y - 2} stroke="#3B6D11" strokeWidth="1.5" strokeDasharray="4,2" />
            <text x="44" y={TOP_Y - 8} fontSize="8" fill="#3B6D11" fontFamily="sans-serif">Ground surface (RL)</text>

            {/* real water table line — only across boreholes with recorded observations */}
            {(() => {
              const pts = displayBoreholes
                .map((bh: any, i: number) => {
                  const wt = bhData[bh.id]?.wtDepth;
                  return wt != null ? { x: bhXFor(i, svgWidth), y: depthToY(wt) } : null;
                })
                .filter((p): p is { x: number; y: number } => p != null);
              if (pts.length === 0) return null;
              return (
                <g>
                  {pts.length > 1 && (
                    <path
                      d={`M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`}
                      stroke="#378ADD"
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      fill="none"
                    />
                  )}
                  {pts.map((p, i) => (
                    <g key={`wt-${i}`}>
                      <line x1={p.x - 16} y1={p.y} x2={p.x + 16} y2={p.y} stroke="#378ADD" strokeWidth="1" strokeDasharray="3,2" />
                      <text x={p.x - 16} y={p.y - 3} fontSize="7" fill="#378ADD" fontFamily="sans-serif">WT</text>
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* boreholes drawn from real intervals */}
            {displayBoreholes.map((bh: any, index: number) => {
              const data = bhData[bh.id];
              const bhX = bhXFor(index, svgWidth);
              const intervals = data?.intervals ?? [];
              const drawDepth = data?.drawDepth ?? sectionMax;
              const shaftH = Math.max(4, drawDepth * pxPerM);
              const hasAnomaly = (data?.anomalies.length ?? 0) > 0;
              const border = STATUS_STROKE[bh.status] ?? STATUS_STROKE.PLANNED;

              return (
                <g key={`${mode}-${bh.id}`}>
                  {intervals.length === 0 ? (
                    <>
                      {/* honest empty state — no fabricated strata */}
                      <rect x={bhX - 12} y={TOP_Y} width="24" height={shaftH} fill="#F1EFE8" opacity="0.6" />
                      <text
                        x={bhX}
                        y={TOP_Y + shaftH / 2}
                        fontSize="8"
                        fill="#B4B2A9"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                        transform={`rotate(-90 ${bhX} ${TOP_Y + shaftH / 2})`}
                      >
                        No field data yet
                      </text>
                    </>
                  ) : (
                    intervals.map((iv: any, lIdx: number) => {
                      const from = num(iv.fromDepth);
                      const to = num(iv.toDepth);
                      if (from == null || to == null || to <= from) return null;
                      const y = depthToY(from);
                      const bandH = (to - from) * pxPerM;
                      const soil = classifySoil(iv.soilDescription);
                      const flagged = data.anomalyKeys.has(String(iv.id ?? lIdx));
                      const reviewed =
                        mode === "eng" && typeof iv.remarks === "string" && iv.remarks.includes("IS ");
                      const n = num(iv.nValue);
                      const b1 = num(iv.blow1);
                      const b2 = num(iv.blow2);
                      const b3 = num(iv.blow3);

                      let nLabel: string | null = null;
                      if (mode === "site") {
                        const blows = b1 != null && b2 != null && b3 != null ? `${b1}/${b2}/${b3}` : null;
                        if (n != null) nLabel = blows ? `${blows} → N=${n}` : `N=${n}`;
                        else if (blows) nLabel = blows;
                      } else if (n != null) {
                        nLabel = `N=${n}${reviewed ? " (reviewed)" : ""}`;
                      }

                      const descLabel = bandH >= 22 ? truncate(iv.soilDescription, 16) : "";
                      const midY = y + bandH / 2;

                      return (
                        <g key={`iv-${lIdx}`}>
                          <rect x={bhX - 12} y={y} width="24" height={bandH} fill={soil.bg} />
                          {soil.pattern && (
                            <rect
                              x={bhX - 12}
                              y={y}
                              width="24"
                              height={bandH}
                              fill={soil.pattern.replace(")", `-${mode})`)}
                              opacity={soil.opacity}
                            />
                          )}
                          {flagged && (
                            <rect x={bhX - 13} y={y} width="26" height={bandH} fill="none" stroke="#E24B4A" strokeWidth="1" />
                          )}
                          {descLabel && (
                            <text x={bhX + 16} y={nLabel ? midY - 2 : midY + 3} fontSize="7" fill="#5F5E5A" fontFamily="sans-serif">
                              {descLabel}
                            </text>
                          )}
                          {nLabel && (
                            <text
                              x={bhX + 16}
                              y={descLabel ? midY + 7 : midY + 3}
                              fontSize="8"
                              fill={flagged ? "#E24B4A" : soil.textColor}
                              fontWeight={flagged ? 600 : undefined}
                              fontFamily="sans-serif"
                            >
                              {nLabel}
                              {flagged ? "!" : ""}
                            </text>
                          )}
                          {iv.isRefusal && (
                            <text x={bhX - 22} y={midY + 3} fontSize="8" fill="#A32D2D" fontWeight={600} fontFamily="sans-serif">
                              R
                            </text>
                          )}
                        </g>
                      );
                    })
                  )}

                  {/* outer border by real status */}
                  <rect
                    x={bhX - 12}
                    y={TOP_Y}
                    width="24"
                    height={shaftH}
                    fill="none"
                    stroke={hasAnomaly ? "#E24B4A" : border.stroke}
                    strokeWidth={hasAnomaly ? 1.5 : 1}
                    strokeDasharray={border.dash}
                  />
                  <text x={bhX} y={TOP_Y + shaftH + 10} fontSize="8" fill="#993C1D" textAnchor="middle" fontFamily="sans-serif">
                    {bh.boreholeCode}
                  </text>
                </g>
              );
            })}

            <text x={svgWidth - 10} y="366" fontSize="8" fill={mode === "site" ? "#97C459" : "#185FA5"} textAnchor="end" fontFamily="sans-serif">
              {mode === "site" ? "Raw site data · Groundlense" : "Engineer reviewed data · Groundlense"}
            </text>
          </svg>

          {/* hover zones */}
          {displayBoreholes.map((bh: any, index: number) => {
            const data = bhData[bh.id];
            const bhX = bhXFor(index, svgWidth);
            const lat = num(bh.latitude);
            const lng = num(bh.longitude);
            const rl = num(bh.groundLevelRL);
            const plannedDepth = num(bh.plannedDepth);
            const finalDepth = num(bh.finalDepth);
            const anomalies = data?.anomalies ?? [];

            return (
              <div
                key={`hover-${mode}-${bh.id}`}
                onMouseEnter={() => setHoveredBhId(bh.id)}
                onMouseLeave={() => setHoveredBhId(null)}
                className="absolute cursor-pointer"
                style={{ left: `${bhX - 20}px`, top: `${TOP_Y}px`, width: "40px", height: `${CHART_H}px` }}
              >
                {hoveredBhId === bh.id && (
                  <div
                    className="hover-card"
                    style={{ left: "50%", transform: "translateX(-50%) translateY(-8px)", pointerEvents: "none", display: "block" }}
                  >
                    <div className="hc-title font-display">
                      {bh.boreholeCode}
                      {bh.name ? ` · ${bh.name}` : ""}
                      {anomalies.length > 0 && " ⚠"}
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Latitude</span>
                      <span className="hc-value green">{lat != null ? `${lat.toFixed(6)}°` : "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Longitude</span>
                      <span className="hc-value green">{lng != null ? `${lng.toFixed(6)}°` : "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">RL</span>
                      <span className="hc-value green">{rl != null ? `${rl} m` : "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Planned depth</span>
                      <span className="hc-value">{plannedDepth != null ? `${plannedDepth} m` : "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Final depth</span>
                      <span className="hc-value">{finalDepth != null ? `${finalDepth} m` : "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Start date</span>
                      <span className="hc-value">{fmtDate(bh.startedAt) ?? "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">End date</span>
                      <span className="hc-value">{fmtDate(bh.completedAt) ?? "—"}</span>
                    </div>
                    <div className="hc-row">
                      <span className="hc-label">Status</span>
                      <span className="hc-value">{STATUS_LABEL[bh.status] ?? bh.status ?? "—"}</span>
                    </div>
                    {anomalies.length > 0 ? (
                      <div className="hc-dev warn">⚠ {anomalies[0].reason}</div>
                    ) : (
                      <div className="hc-dev" style={{ background: "#2C2C2A", color: "#B4B2A9" }}>
                        GPS deviation: not recorded
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** BH info row under the cross-section — real values only. */
  const renderBhInfoRow = (mode: "site" | "eng") => {
    if (displayBoreholes.length === 0) return null;
    return (
      <div className="bh-info-row mt-2 border-t border-[#F5C4B3]">
        {displayBoreholes.map((bh: any) => {
          const data = bhData[bh.id];
          const lat = num(bh.latitude);
          const lng = num(bh.longitude);
          const rl = num(bh.groundLevelRL);
          const plannedDepth = num(bh.plannedDepth);
          const finalDepth = num(bh.finalDepth);
          const deepest = (data?.intervals ?? []).reduce((max: number | null, iv: any) => {
            const to = num(iv.toDepth);
            return to != null && (max == null || to > max) ? to : max;
          }, null as number | null);
          const hasAnomaly = (data?.anomalies.length ?? 0) > 0;

          let cellClass = "bh-info-cell";
          if (bh.status === "PLANNED") cellClass += " pending";
          else if (bh.status === "IN_PROGRESS") cellClass += " inprog";

          const depthValue = finalDepth ?? deepest;
          const depthLabel =
            finalDepth != null
              ? "final depth"
              : deepest != null
              ? "deepest interval"
              : plannedDepth != null
              ? `planned ${plannedDepth}m`
              : "no depth recorded";

          return (
            <div key={`info-${mode}-${bh.id}`} className={cellClass}>
              <div className="bh-info-id font-mono">
                {bh.boreholeCode}
                {bh.name ? ` · ${bh.name}` : ""} {hasAnomaly ? "⚠" : ""}
              </div>
              <div className="bh-info-depth">{depthValue != null ? `${depthValue.toFixed(1)} m` : "— m"}</div>
              <div className="bh-info-depth-label">{depthLabel}</div>
              <div className="bh-info-dates">
                Start: {fmtDate(bh.startedAt, false) ?? "—"} <br />
                End: {fmtDate(bh.completedAt, false) ?? STATUS_LABEL[bh.status] ?? "—"}
              </div>
              <div className="bh-info-gps font-mono">
                {lat != null && lng != null ? (
                  <>
                    {lat.toFixed(5)}°, {lng.toFixed(5)}°
                  </>
                ) : (
                  "GPS: —"
                )}
                <br />
                RL {rl != null ? `${rl}m` : "—"}
                <br />
                GPS deviation: not recorded
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .portal { background: #fff; border: 0.5px solid #D3D1C7; border-radius: 12px; overflow: hidden; }
        .hdr { background: #993C1D; padding: 16px 20px; }
        .hdr-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .hdr-logo { font-size: 12px; font-weight: 500; color: #FAC775; letter-spacing: 0.5px; }
        .hdr-title { font-size: 17px; font-weight: 500; color: #fff; }
        .hdr-sub { font-size: 11px; color: #F5C4B3; margin-top: 2px; }
        .sum-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; margin-top: 10px; }
        .sc { background: rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 7px 9px; }
        .sc-l { font-size: 9px; color: #F5C4B3; margin-bottom: 2px; }
        .sc-v { font-size: 14px; font-weight: 500; color: #fff; }
        .sc-s { font-size: 9px; color: #F0997B; margin-top: 1px; }
        .body { padding: 14px 18px; background: #FFF8F6; }
        .sec-label { font-size: 10px; font-weight: 600; color: #993C1D; letter-spacing: 1px; margin-bottom: 7px; text-transform: uppercase; }
        .struct-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .struct-sel { font-size: 12px; padding: 6px 10px; border: 1.5px solid #D85A30; border-radius: 7px; background: #fff; color: #412402; font-weight: 500; outline: none; }
        .flag-strip { background: #FCEBEB; border: 0.5px solid #F09595; border-radius: 7px; padding: 7px 11px; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
        .flag-text { font-size: 11px; color: #A32D2D; }
        .xsec-wrap { background: #fff; border: 0.5px solid #F5C4B3; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
        .xsec-header { background: #FAECE7; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .xsec-title { font-size: 11px; font-weight: 500; color: #993C1D; }
        .toggle-wrap { display: flex; align-items: center; gap: 8px; }
        .toggle-label { font-size: 11px; color: #854F0B; font-weight: 500; }
        .data-toggle { font-size: 11px; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 500; border: 1.5px solid #D85A30; background: #fff; color: #993C1D; transition: all 0.2s ease; }
        .data-toggle.active { background: #D85A30; color: #fff; border-color: #993C1D; }
        .view-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; font-weight: 500; }
        .view-badge.site { background: #EAF3DE; color: #3B6D11; border: 0.5px solid #97C459; }
        .view-badge.eng { background: #E6F1FB; color: #185FA5; border: 0.5px solid #85B7EB; }
        .xsec-legend { display: flex; gap: 8px; flex-wrap: wrap; padding: 6px 12px; border-bottom: 0.5px solid #F5C4B3; }
        .leg-item { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #633806; }
        .leg-sw { width: 14px; height: 10px; border-radius: 1px; flex-shrink: 0; }
        .xsec-body { padding: 10px 12px; overflow-x: auto; position: relative; }
        .mod-note { background: #E6F1FB; border: 0.5px solid #85B7EB; border-radius: 6px; padding: 6px 10px; margin: 8px 0; font-size: 11px; color: #185FA5; display: flex; align-items: center; gap: 6px; }

        /* HOVER CARD */
        .bh-hover-zone { position: relative; display: inline-block; }
        .hover-card { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px); background: #2C2C2A; color: #fff; border-radius: 8px; padding: 10px 12px; font-size: 11px; white-space: nowrap; z-index: 100; min-width: 210px; border: 0.5px solid #444441; box-shadow: 0 4px 12px rgba(0,0,0,0.3); pointer-events: none; }
        .hover-card::after { content:''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #2C2C2A; }
        .hc-title { font-size: 12px; font-weight: 500; color: #FAC775; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 0.5px solid #444441; }
        .hc-row { display: flex; justify-content: space-between; gap: 16px; padding: 2px 0; font-size: 10px; }
        .hc-label { color: #B4B2A9; }
        .hc-value { color: #fff; font-weight: 500; }
        .hc-value.red { color: #F09595; font-weight: 500; }
        .hc-value.green { color: #9FE1CB; }
        .hc-dev { margin-top: 6px; padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
        .hc-dev.ok { background: #085041; color: #9FE1CB; }
        .hc-dev.warn { background: #791F1F; color: #F7C1C1; }

        .photos-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .photo-card { background: #fff; border: 0.5px solid #F5C4B3; border-radius: 7px; overflow: hidden; }
        .photo-img { width: 100%; height: 72px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; font-size: 9px; overflow: hidden; }
        .photo-img img { width: 100%; height: 72px; object-fit: cover; display: block; }
        .photo-info { padding: 6px 8px; }
        .photo-bh { font-size: 11px; font-weight: 500; color: #993C1D; }
        .photo-date { font-size: 10px; color: #854F0B; margin-top: 1px; }
        .photo-tag { font-size: 10px; color: #5F5E5A; margin-top: 1px; word-break: break-all; }
        .dl-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .dl-btn { display: flex; align-items: center; gap: 5px; padding: 8px 13px; background: #D85A30; border: none; border-radius: 7px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .dl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .dl-btn-sec { display: flex; align-items: center; gap: 5px; padding: 8px 13px; background: #fff; border: 1.5px solid #D85A30; border-radius: 7px; color: #D85A30; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .dl-btn-sec:disabled { opacity: 0.45; cursor: not-allowed; }
        .dl-hint { font-size: 10px; color: #888780; }

        /* BH INFO ROW */
        .bh-info-row { display: flex; gap: 0; border-top: 0.5px solid #F5C4B3; overflow-x: auto; }
        .bh-info-cell { flex: 1; min-width: 100px; padding: 8px 6px; text-align: center; border-right: 0.5px solid #F5C4B3; background: #FFF8F6; }
        .bh-info-cell:last-child { border-right: none; }
        .bh-info-id { font-size: 10px; font-weight: 500; color: #993C1D; margin-bottom: 2px; }
        .bh-info-depth { font-size: 11px; font-weight: 600; color: #1a1a1a; }
        .bh-info-depth-label { font-size: 9px; color: #888780; }
        .bh-info-dates { font-size: 9px; color: #5F5E5A; margin-top: 3px; line-height: 1.4; }
        .bh-info-gps { font-size: 9px; color: #5F5E5A; margin-top: 3px; line-height: 1.3; }
        .bh-info-cell.pending { background: #F1EFE8; opacity: 0.7; }
        .bh-info-cell.inprog { background: #FAEEDA; }
      ` }} />

      {/* Topbar — matches PortalTopbar style and pixel dimensions */}
      <div className="bg-bg-surface border-b border-border flex items-center shrink-0" style={{ height: "50px", padding: "0 16px", gap: "14px" }}>
        <span onClick={handleBackToDashboard} className="font-display text-[15px] text-rust-d tracking-[0.3px] cursor-pointer">GroundLense</span>
        <span className="text-[9px] text-rust-d font-mono bg-[rgba(153,60,29,.2)] border border-[rgba(153,60,29,.3)] rounded-[3px]" style={{ padding: "2px 7px" }}>
          CONTRACTOR
        </span>
        <div className="flex items-center gap-2 bg-bg-card rounded-[5px] border border-border-mid" style={{ padding: "4px 10px", maxWidth: "360px" }}>
          <span className="font-mono text-[9px] text-amber-d">{project.projectCode}</span>
          <span className="text-[11px] text-text-pri font-medium truncate">{project.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <div className="flex items-center gap-[7px] bg-bg-card rounded-[5px] border border-border" style={{ padding: "4px 9px" }}>
            <div className="rounded-full flex items-center justify-center text-[9px] font-bold text-rust-d" style={{ width: "22px", height: "22px", background: "rgba(153,60,29,.3)" }}>{initials}</div>
            <span className="text-[11px] text-text-sec">{displayName}</span>
          </div>
          <button onClick={handleBackToDashboard} className="text-[10px] bg-transparent border border-border rounded-[5px] text-text-ter cursor-pointer transition-all hover:border-rust-mid hover:text-rust-d" style={{ padding: "4px 9px" }}>
            ← Dashboard
          </button>
          <button onClick={handleSwitchToPortal} className="text-[10px] bg-[rgba(240,153,123,0.15)] border border-[rgba(240,153,123,0.3)] rounded-[5px] text-[#F0997B] cursor-pointer transition-all hover:bg-rust-mid hover:text-white" style={{ padding: "4px 9px" }}>
            Engineer portal →
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px", background: "#FFF8F6" }}>
        <div className="portal shadow-sm">
          {/* Header Panel */}
          <div className="hdr">
            <div className="hdr-top">
              <div className="hdr-logo">Groundlense Technologies</div>
              <div style={{ fontSize: "10px", color: "#F5C4B3" }}>Contractor Portal · Read only</div>
            </div>
            <div className="hdr-title font-display tracking-wide">{project.name}</div>
            <div className="hdr-sub font-mono">
              Contractor: {project.epcOrganization?.name || "—"} &nbsp;·&nbsp;
              Geotech: {project.geotechOrganization?.name || "—"}
            </div>

            {/* Stat Row — real data only */}
            <div className="sum-grid">
              <div className="sc">
                <div className="sc-l">Structures</div>
                <div className="sc-v font-display">{sites.length}</div>
                <div className="sc-s">{sites.length > 0 ? "Structure sites" : "None defined yet"}</div>
              </div>
              <div className="sc">
                <div className="sc-l">BH planned</div>
                <div className="sc-v font-display">{boreholes.length}</div>
                <div className="sc-s">Across project</div>
              </div>
              <div className="sc">
                <div className="sc-l">Completed</div>
                <div className="sc-v font-display">{completedAll}</div>
                <div className="sc-s">
                  {boreholes.length > 0 ? `${Math.round((completedAll / boreholes.length) * 100)}% done` : "No boreholes"}
                </div>
              </div>
              <div className="sc">
                <div className="sc-l">Investigation cost</div>
                <div className="sc-v font-display">{costLabel}</div>
                <div className="sc-s">
                  {successPayments.length > 0
                    ? `${successPayments.length} successful payment${successPayments.length > 1 ? "s" : ""}`
                    : "No payments yet"}
                </div>
              </div>
              <div className="sc">
                <div className="sc-l">Anomaly flags</div>
                <div className="sc-v font-display" style={{ color: totalAnomalies > 0 ? "#FAC775" : "#fff" }}>
                  {totalAnomalies}
                </div>
                <div className="sc-s">{totalAnomalies > 0 ? "From field N-values" : "None detected"}</div>
              </div>
            </div>
          </div>

          {/* Body Section */}
          <div className="body">
            {/* Structure Selector */}
            <div className="sec-label">Select structure</div>
            <div className="struct-row">
              <select
                className="struct-sel"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                disabled={sites.length === 0}
              >
                {sites.length > 0 ? (
                  sites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">All boreholes — no structures defined</option>
                )}
              </select>
              <div style={{ fontSize: "11px", color: "#854F0B", background: "#FAEEDA", padding: "4px 8px", borderRadius: "5px", border: "0.5px solid #EF9F27", fontWeight: 500 }}>
                {displayBoreholes.length} borehole{displayBoreholes.length === 1 ? "" : "s"}
                {currentSite?.structureType ? ` · ${currentSite.structureType}` : ""}
              </div>
            </div>

            {/* Warning flags — computed from real interval data only */}
            {displayedAnomalies.length > 0 && (
              <div className="flag-strip">
                <RiAlertLine className="text-[#E24B4A] text-[15px] shrink-0" />
                <div className="flag-text font-medium">
                  {displayedAnomalies.map((a: any, i: number) => (
                    <span key={`${a.bh.id}-${a.intervalKey}`}>
                      {i > 0 && <span> &nbsp;|&nbsp; </span>}
                      {a.bh.boreholeCode} — {a.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cross Section Box */}
            <div className="xsec-wrap shadow-sm">
              <div className="xsec-header">
                <div className="xsec-title font-medium">
                  Geological cross-section · hover any borehole for coordinates + dates
                </div>
                <div className="toggle-wrap">
                  <div className="toggle-label">Viewing:</div>
                  <button
                    onClick={() => setViewMode("site")}
                    className={`data-toggle ${viewMode === "site" ? "active" : ""}`}
                  >
                    As recorded on site
                  </button>
                  <button
                    onClick={() => setViewMode("eng")}
                    className={`data-toggle ${viewMode === "eng" ? "active" : ""}`}
                  >
                    As reviewed by engineer
                  </button>
                </div>
              </div>

              {/* Legend Strip */}
              <div className="xsec-legend">
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(45deg,#C0DD97,#C0DD97 2px,#EAF3DE 2px,#EAF3DE 4px)" }} />
                  Fill
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(90deg,#FAC775,#FAC775 2px,#FAEEDA 2px,#FAEEDA 5px)" }} />
                  Silt
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(0deg,#F0997B,#F0997B 2px,#FAECE7 2px,#FAECE7 4px)" }} />
                  Clay
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(45deg,#BA7517,#BA7517 2px,#FAEEDA 2px,#FAEEDA 3px)" }} />
                  Sand / gravel
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(135deg,#888780,#888780 2px,#F1EFE8 2px,#F1EFE8 3px)" }} />
                  Wthr rock
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "#2C2C2A" }} />
                  Hard rock
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "#F1EFE8" }} />
                  Unclassified
                </div>
                <div className="leg-item">
                  <div className="leg-sw border border-[#E24B4A]" style={{ background: "#FCEBEB" }} />
                  Anomaly / refusal
                </div>
              </div>

              {viewMode === "site" ? (
                <div className="xsec-body" style={{ overflow: "visible" }}>
                  <div className="flex items-center gap-[6px] mb-2">
                    <span className="view-badge site">As recorded on site — raw field data · unmodified</span>
                  </div>
                  {renderCrossSection("site")}
                  {renderBhInfoRow("site")}
                </div>
              ) : (
                <div className="xsec-body" style={{ overflow: "visible" }}>
                  <div className="flex items-center gap-[6px] mb-2">
                    <span className="view-badge eng">As reviewed by engineer — corrected · approved report</span>
                  </div>

                  {/* Engineer modification notes from real interval remarks */}
                  {reviewedNotes.length > 0 ? (
                    reviewedNotes.map(({ bh, iv }: any, i: number) => (
                      <div key={`note-${bh.id}-${i}`} className="mod-note shadow-sm border border-[#85B7EB]">
                        <RiEdit2Line className="text-[#185FA5] text-[15px] shrink-0" />
                        <div>
                          <strong>
                            {bh.boreholeCode}
                            {num(iv.fromDepth) != null ? ` · ${num(iv.fromDepth)}–${num(iv.toDepth) ?? "?"}m` : ""}
                          </strong>{" "}
                          — {iv.remarks}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mod-note shadow-sm border border-[#85B7EB]">
                      <RiEdit2Line className="text-[#185FA5] text-[15px] shrink-0" />
                      <div>No engineer modifications recorded — identical to field data.</div>
                    </div>
                  )}

                  {renderCrossSection("eng")}
                  {renderBhInfoRow("eng")}
                </div>
              )}
            </div>

            {/* Site Photos section — real uploaded media via the authenticated proxy */}
            <div className="sec-label mt-4">Site photos — timestamped uploads</div>
            {photos.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 mb-[14px] bg-white border border-[#F5C4B3] rounded-[7px] py-8 text-center"
              >
                <RiCameraLine className="text-[20px] text-[#B4B2A9]" />
                <div className="text-[11px] text-[#888780]">No site photos uploaded yet</div>
              </div>
            ) : (
              <div className="photos-strip">
                {photos.map((p: any) => (
                  <div key={p.id} className="photo-card shadow-sm hover:scale-[1.01] transition-all">
                    <div className="photo-img" style={{ background: "#F1EFE8", color: "#5F5E5A" }}>
                      {p.mimeType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/media/${p.id}`} alt={p.fileName || "Site photo"} loading="lazy" />
                      ) : (
                        <>
                          <RiImageLine className="text-[20px]" />
                          <span className="font-semibold">{truncate(p.fileName, 20) || "File"}</span>
                        </>
                      )}
                    </div>
                    <div className="photo-info">
                      <div className="photo-bh">
                        {p.bhCode}
                        {p.from != null ? ` · ${p.from}–${p.to ?? "?"}m` : ""}
                      </div>
                      <div className="photo-date">{fmtDate(p.createdAt) ?? "—"}</div>
                      <div className="photo-tag">{truncate(p.fileName, 32) || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document downloads strip — backend not available yet */}
            <div className="dl-row mt-4">
              <button className="dl-btn" disabled title="Available soon">
                <RiDownloadLine className="text-[14px]" />
                Download full report — PDF
              </button>
              <button className="dl-btn-sec" disabled title="Available soon">
                <RiShieldCheckLine className="text-[14px]" />
                Tamper certificate
              </button>
              <button className="dl-btn-sec" disabled title="Available soon">
                <RiImageLine className="text-[14px]" />
                All site photos
              </button>
              <span className="dl-hint">Downloads available soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
