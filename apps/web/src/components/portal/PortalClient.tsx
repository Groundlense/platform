"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiSettings4Line,
  RiRadarLine,
  RiCheckDoubleLine,
  RiFlaskLine,
  RiFileTextLine,
  RiDownloadLine,
  RiShieldCheckLine,
  RiLock2Line,
  RiUserAddLine,
  RiCloseLine,
} from "react-icons/ri";
import { usePortalTab } from "./PortalContext";
import {
  createIntervalReview,
  fetchBoreholeReviews,
  fetchBoreholeIntegrity,
  submitSampleLabResult,
  getUserActivityLogs,
  type BoreholeIntegrity,
} from "@/app/actions/portal";

interface PortalClientProps {
  project: any;
  projects: any[];
  boreholes: any[]; // Full report data: intervals[] (with samples[] incl. labResult, media[]) + waterTableObservations[]
  sites: any[];
  user: Record<string, unknown> | null;
  members: any[]; // Project members: { user: { firstName, lastName, employeeCode, email }, ... }
  nablLabs: any[]; // NABL labs: { labName, nablCertNumber, certValidUntil, isVerified, ... }
  activityLogs: any[]; // Org-scoped recent logs: { action, entityType, entityId, createdAt, user{firstName,lastName} }
  projectDashboard: any; // { boreholes, intervals, completedIntervals, completionPercentage, samples, media }
}

// Soil color mappings for SVG strata drawing
const SOIL_COLORS: Record<string, { fill: string; stroke: string; textColor: string }> = {
  fill: { fill: "#1A2E1A", stroke: "#2A4A2A", textColor: "#97C459" },
  topsoil: { fill: "#1A2E1A", stroke: "#2A4A2A", textColor: "#97C459" },
  silt: { fill: "#2A2010", stroke: "#4A3010", textColor: "#FAC775" },
  sand: { fill: "#201A08", stroke: "#3A2A10", textColor: "#FAC775" },
  clay: { fill: "#281818", stroke: "#482020", textColor: "#F0997B" },
  gravel: { fill: "#1A1A1A", stroke: "#3A3A3A", textColor: "#B4B2A9" },
  rock: { fill: "#151515", stroke: "#2E2E2E", textColor: "#E5E5E5" },
  default: { fill: "#1E1D1C", stroke: "#333333", textColor: "#6B6966" },
};

const BH_STATUS: Record<string, { cls: string; text: string }> = {
  PLANNED: { cls: "p-gr", text: "○ Planned" },
  IN_PROGRESS: { cls: "p-a", text: "● In progress" },
  COMPLETED: { cls: "p-g", text: "✓ Complete" },
  ABANDONED: { cls: "p-red", text: "✗ Abandoned" },
  TERMINATED: { cls: "p-red", text: "✗ Terminated" },
  SUSPENDED: { cls: "p-a", text: "❚❚ Suspended" },
};

const IS_CLAUSES = [
  "IS 2131 Cl.6.3 — Casing disturbance",
  "IS 2131 Cl.5.2 — Gravel pocket encountered",
  "IS 2131 Cl.6.1 — Water table correction",
  "IS 2131 Cl.4.2 — Equipment malfunction suspected",
];

function getSoilColors(soilDesc: string) {
  const desc = (soilDesc || "").toLowerCase();
  if (desc.includes("fill") || desc.includes("topsoil")) return SOIL_COLORS.fill;
  if (desc.includes("silt")) return SOIL_COLORS.silt;
  if (desc.includes("sand")) return SOIL_COLORS.sand;
  if (desc.includes("clay")) return SOIL_COLORS.clay;
  if (desc.includes("gravel")) return SOIL_COLORS.gravel;
  if (desc.includes("rock") || desc.includes("stone")) return SOIL_COLORS.rock;
  return SOIL_COLORS.default;
}

function parseNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function fmtNum(v: number | null | undefined, digits = 1, suffix = ""): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${v.toFixed(digits)}${suffix}`;
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return "—";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    day: "numeric",
    month: "short",
  });
}

const num = (s: string): number => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

interface Anomaly {
  boreholeId: string;
  boreholeCode: string;
  boreholeName: string;
  intervalId: string;
  intervalNo: number;
  depthLabel: string;
  nValue: number | null;
  type: "REFUSAL" | "N_SPIKE";
  message: string;
}

export default function PortalClient({
  project,
  projects = [],
  boreholes = [],
  sites = [],
  user = null,
  members = [],
  nablLabs = [],
  activityLogs = [],
  projectDashboard = null,
}: PortalClientProps) {
  const { activeTab, setActiveTab } = usePortalTab();
  const router = useRouter();

  const proj = project; // No mock fallback — null renders honest "—" values
  const u = user as any;
  const userName = u
    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || (u.email as string) || "Engineer"
    : "Engineer";

  const activeNablLab = nablLabs.length > 0 ? nablLabs[0] : null;

  // ── Real boreholes only — no mock dataset, no fabricated merge ──
  const mappedBoreholes = useMemo(() => {
    return (boreholes || []).map((bh: any) => {
      const intervals = [...(bh.intervals || [])]
        .map((iv: any) => ({
          ...iv,
          fromDepth: parseNum(iv.fromDepth) ?? 0,
          toDepth: parseNum(iv.toDepth) ?? 0,
          nValue: parseNum(iv.nValue),
          nCorrected: parseNum(iv.nCorrected),
        }))
        .sort((a: any, b: any) => (a.intervalNo ?? 0) - (b.intervalNo ?? 0));

      const media = intervals.flatMap((iv: any) =>
        (iv.media || []).map((m: any) => ({ ...m, intervalNo: iv.intervalNo }))
      );
      const samples = intervals.flatMap((iv: any) =>
        (iv.samples || []).map((s: any) => ({ ...s, interval: iv }))
      );

      const wtObs = bh.waterTableObservations || [];
      const waterTable = wtObs.length > 0 ? parseNum(wtObs[wtObs.length - 1].depth) : null;
      const maxIntervalDepth = intervals.reduce(
        (m: number, iv: any) => Math.max(m, iv.toDepth || 0),
        0
      );

      return {
        ...bh,
        name: bh.name || bh.boreholeCode,
        teamName: bh.team?.name ?? null,
        latitude: bh.latitude != null ? String(bh.latitude) : null,
        longitude: bh.longitude != null ? String(bh.longitude) : null,
        groundLevelRL: parseNum(bh.groundLevelRL),
        plannedDepth: parseNum(bh.plannedDepth),
        finalDepth: parseNum(bh.finalDepth) ?? (maxIntervalDepth > 0 ? maxIntervalDepth : null),
        waterTable,
        intervals,
        media,
        samples,
        maxIntervalDepth,
      };
    });
  }, [boreholes]);

  // ── Review modifications applied this session (server-persisted) ──
  const [appliedMods, setAppliedMods] = useState<
    Record<string, { nValue: number; remarks: string; clause: string; appliedAt: string }>
  >({});
  // Anomalies accepted as valid — persisted via POST /intervals/:id/reviews (APPROVE)
  const [acceptedAnomalies, setAcceptedAnomalies] = useState<Record<string, boolean>>({});
  const [acceptBusyId, setAcceptBusyId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<{ id: string; message: string } | null>(null);

  const effectiveN = (iv: any): number | null =>
    appliedMods[iv.id] ? appliedMods[iv.id].nValue : iv.nValue;

  // ── Anomaly heuristic over REAL intervals:
  //    anomalous if isRefusal, or nValue ≥ 30 AND ≥ 2.5× median of previous up-to-3 intervals ──
  const allAnomalies = useMemo<Anomaly[]>(() => {
    const found: Anomaly[] = [];
    mappedBoreholes.forEach((bh: any) => {
      bh.intervals.forEach((iv: any, idx: number) => {
        const depthLabel = `${iv.fromDepth.toFixed(1)}–${iv.toDepth.toFixed(1)}m`;
        if (iv.isRefusal) {
          found.push({
            boreholeId: bh.id,
            boreholeCode: bh.boreholeCode,
            boreholeName: bh.name,
            intervalId: iv.id,
            intervalNo: iv.intervalNo,
            depthLabel,
            nValue: effectiveN(iv),
            type: "REFUSAL",
            message: `Refusal recorded at ${depthLabel}${
              iv.penetrationMm != null ? ` (penetration ${iv.penetrationMm}mm)` : ""
            } — verify rock/obstruction with the field team.`,
          });
          return;
        }
        const n = effectiveN(iv);
        if (n != null && n >= 30) {
          const prev = bh.intervals
            .slice(Math.max(0, idx - 3), idx)
            .map((p: any) => effectiveN(p))
            .filter((v: any): v is number => v != null && v > 0);
          if (prev.length > 0) {
            const med = median(prev);
            if (med > 0 && n >= 2.5 * med) {
              found.push({
                boreholeId: bh.id,
                boreholeCode: bh.boreholeCode,
                boreholeName: bh.name,
                intervalId: iv.id,
                intervalNo: iv.intervalNo,
                depthLabel,
                nValue: n,
                type: "N_SPIKE",
                message: `N=${n} at ${depthLabel} is ${(n / med).toFixed(
                  1
                )}× the median (N=${med}) of the preceding intervals — possible casing disturbance or gravel pocket.`,
              });
            }
          }
        }
      });
    });
    return found;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedBoreholes, appliedMods]);

  const visibleAnomalies = useMemo(
    () => allAnomalies.filter((a) => !acceptedAnomalies[a.intervalId]),
    [allAnomalies, acceptedAnomalies]
  );
  const anomaliesForBh = (bhId: string) => visibleAnomalies.filter((a) => a.boreholeId === bhId);
  const anomalousIntervalIds = useMemo(
    () => new Set(visibleAnomalies.map((a) => a.intervalId)),
    [visibleAnomalies]
  );

  // Tab stats counters
  const stats = useMemo(() => {
    const total = mappedBoreholes.length;
    const completed = mappedBoreholes.filter((b: any) => b.status === "COMPLETED").length;
    const active = mappedBoreholes.filter((b: any) => b.status === "IN_PROGRESS").length;
    const pending = mappedBoreholes.filter((b: any) => b.status === "PLANNED").length;
    return { total, completed, active, pending };
  }, [mappedBoreholes]);

  // Real activity logs only — no fabricated feed
  const logs = activityLogs || [];
  const entriesToday = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((l: any) => l.createdAt && new Date(l.createdAt).toDateString() === today)
      .length;
  }, [logs]);
  const lastEntryAgo = logs.length > 0 ? timeAgo(logs[0]?.createdAt) : null;

  const totalPhotos = useMemo(() => {
    const fromIntervals = mappedBoreholes.reduce(
      (sum: number, bh: any) => sum + (bh.media?.length || 0),
      0
    );
    return fromIntervals || projectDashboard?.media || 0;
  }, [mappedBoreholes, projectDashboard]);

  // ── Tab 2: Live Monitor state — initial selection = FIRST REAL borehole ──
  const [selectedBhId, setSelectedBhId] = useState<string | null>(null);
  const selectedBorehole = useMemo(() => {
    return mappedBoreholes.find((b: any) => b.id === selectedBhId) || mappedBoreholes[0] || null;
  }, [selectedBhId, mappedBoreholes]);

  // ── Tab 3: Review state ──
  const [expandedBhId, setExpandedBhId] = useState<string | null>(null);
  // Boring approval — persisted via POST /intervals/:id/reviews (action APPROVE)
  const [bhStatusApproved, setBhStatusApproved] = useState<Record<string, boolean>>({});
  const [approveBusyBhId, setApproveBusyBhId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  // Persisted review history per borehole — GET /boreholes/:id/reviews
  const [bhReviews, setBhReviews] = useState<Record<string, any[]>>({});
  const [bhReviewsLoading, setBhReviewsLoading] = useState<Record<string, boolean>>({});
  const [modIntervalId, setModIntervalId] = useState<string | null>(null);
  const [modNValue, setModNValue] = useState<string>("");
  const [selectedClause, setSelectedClause] = useState<string>("");
  const [modReason, setModReason] = useState<string>("");
  const [modBusy, setModBusy] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  const loadBhReviews = async (bhId: string) => {
    setBhReviewsLoading((prev) => ({ ...prev, [bhId]: true }));
    const reviews = await fetchBoreholeReviews(bhId);
    setBhReviews((prev) => ({ ...prev, [bhId]: reviews }));
    setBhReviewsLoading((prev) => ({ ...prev, [bhId]: false }));
  };

  const expandBh = (bhId: string) => {
    setExpandedBhId(bhId);
    setApproveError(null);
    if (bhReviews[bhId] === undefined) loadBhReviews(bhId);
  };

  const toggleExpandBh = (bhId: string) => {
    if (expandedBhId === bhId) setExpandedBhId(null);
    else expandBh(bhId);
  };

  const openModPanel = (iv: any) => {
    setModIntervalId(iv.id);
    setModNValue(iv.nValue != null ? String(iv.nValue) : "");
    setSelectedClause("");
    setModReason("");
    setModError(null);
  };

  const handleApplyModification = async (bh: any, iv: any) => {
    const newN = parseInt(modNValue, 10);
    if (!selectedClause || isNaN(newN)) return;
    setModBusy(true);
    setModError(null);
    // POST /intervals/:id/reviews — MODIFY_N updates the interval nValue and
    // appends the audit remark server-side.
    const res = await createIntervalReview(iv.id, {
      action: "MODIFY_N",
      nValueNew: newN,
      isCodeReason: selectedClause,
      comments: modReason.trim() || undefined,
    });
    setModBusy(false);
    if (res.success) {
      setAppliedMods((prev) => ({
        ...prev,
        [iv.id]: {
          nValue: newN,
          remarks: `N modified ${iv.nValue ?? "—"}→${newN} per ${selectedClause}${
            modReason.trim() ? ` — ${modReason.trim()}` : ""
          }`,
          clause: selectedClause,
          appliedAt: new Date().toISOString(),
        },
      }));
      setModIntervalId(null);
      loadBhReviews(bh.id);
      router.refresh();
    } else {
      setModError(res.error || "Failed to apply modification.");
    }
  };

  // Approve every interval of a boring — each approval is a persisted review row.
  const handleApproveBoring = async (bh: any) => {
    if (approveBusyBhId || bh.intervals.length === 0) return;
    setApproveBusyBhId(bh.id);
    setApproveError(null);
    const results = await Promise.all(
      bh.intervals.map((iv: any) =>
        createIntervalReview(iv.id, {
          action: "APPROVE",
          comments: "Boring approved by engineer review",
        })
      )
    );
    setApproveBusyBhId(null);
    const failed = results.filter((r) => !r.success);
    if (failed.length === 0) {
      setBhStatusApproved((prev) => ({ ...prev, [bh.id]: true }));
      loadBhReviews(bh.id);
      router.refresh();
    } else {
      setApproveError(failed[0].error || `Failed to approve ${failed.length} interval(s).`);
    }
  };

  // Accept a flagged interval as valid — persisted as an APPROVE review.
  const handleAcceptValid = async (intervalId: string, note: string): Promise<boolean> => {
    if (acceptBusyId) return false;
    setAcceptBusyId(intervalId);
    setAcceptError(null);
    const res = await createIntervalReview(intervalId, { action: "APPROVE", comments: note });
    setAcceptBusyId(null);
    if (res.success) {
      setAcceptedAnomalies((prev) => ({ ...prev, [intervalId]: true }));
      router.refresh();
      return true;
    }
    setAcceptError({ id: intervalId, message: res.error || "Failed to record approval." });
    return false;
  };

  // ── Tab 4: Lab state — form starts EMPTY (no magic seed values) ──
  const allSamples = useMemo(() => {
    return mappedBoreholes.flatMap((bh: any) =>
      bh.samples.map((s: any) => {
        const collected = s.collectedAt || s.createdAt || null;
        const deadline = collected ? new Date(new Date(collected).getTime() + 14 * 86400000) : null;
        const daysLeft = deadline
          ? Math.ceil((deadline.getTime() - Date.now()) / 86400000)
          : null;
        return {
          ...s,
          boreholeCode: bh.boreholeCode,
          boreholeName: bh.name,
          collected,
          deadline,
          daysLeft,
          hasResult: !!s.labResult,
        };
      })
    );
  }, [mappedBoreholes]);

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [labSavedIds, setLabSavedIds] = useState<Record<string, boolean>>({});
  const selectedSample = useMemo(
    () => allSamples.find((s: any) => s.id === selectedSampleId) || allSamples[0] || null,
    [selectedSampleId, allSamples]
  );
  const sampleLocked = !!selectedSample && (selectedSample.hasResult || !!labSavedIds[selectedSample.id]);

  const labStats = useMemo(() => {
    const total = allSamples.length;
    const entered = allSamples.filter((s: any) => s.hasResult || labSavedIds[s.id]).length;
    const pendingSamples = allSamples.filter((s: any) => !(s.hasResult || labSavedIds[s.id]));
    const expiring = pendingSamples.filter(
      (s: any) => s.daysLeft != null && s.daysLeft >= 0 && s.daysLeft <= 3
    ).length;
    const overdue = pendingSamples.filter((s: any) => s.daysLeft != null && s.daysLeft < 0).length;
    return { total, entered, expiring, overdue };
  }, [allSamples, labSavedIds]);

  // Lab input fields — all empty strings until the technician enters real values
  const [gSiltClay, setGSiltClay] = useState("");
  const [gFineSand, setGFineSand] = useState("");
  const [gMedSand, setGMedSand] = useState("");
  const [gCoarseSand, setGCoarseSand] = useState("");
  const [gGravel, setGGravel] = useState("");
  const [liquidLimit, setLiquidLimit] = useState("");
  const [plasticLimit, setPlasticLimit] = useState("");
  const [bulkDensity, setBulkDensity] = useState("");
  const [moistureContent, setMoistureContent] = useState("");
  const [specificGravity, setSpecificGravity] = useState("");
  const [uuC, setUuC] = useState("");
  const [uuPhi, setUuPhi] = useState("");
  const [cuC, setCuC] = useState("");
  const [cuPhi, setCuPhi] = useState("");
  const [cdC, setCdC] = useState("");
  const [cdPhi, setCdPhi] = useState("");
  const [cc, setCc] = useState("");
  const [cv, setCv] = useState("");
  const [mv, setMv] = useState("");
  const [pc, setPc] = useState("");
  const [ucs, setUcs] = useState("");
  const [pointLoad, setPointLoad] = useState("");
  const [rockClass, setRockClass] = useState("");
  const [ph, setPh] = useState("");
  const [sulphates, setSulphates] = useState("");
  const [chlorides, setChlorides] = useState("");
  const [organic, setOrganic] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const [reportPdfUrl, setReportPdfUrl] = useState("");
  const [selectedLabId, setSelectedLabId] = useState<string>(nablLabs[0]?.id ?? "");
  const [labBusy, setLabBusy] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [labSuccess, setLabSuccess] = useState<string | null>(null);

  const resetLabForm = () => {
    [
      setGSiltClay, setGFineSand, setGMedSand, setGCoarseSand, setGGravel,
      setLiquidLimit, setPlasticLimit, setBulkDensity, setMoistureContent, setSpecificGravity,
      setUuC, setUuPhi, setCuC, setCuPhi, setCdC, setCdPhi,
      setCc, setCv, setMv, setPc, setUcs, setPointLoad, setRockClass,
      setPh, setSulphates, setChlorides, setOrganic, setReportNumber, setReportPdfUrl,
    ].forEach((set) => set(""));
    setLabError(null);
    setLabSuccess(null);
  };

  const selectSample = (id: string) => {
    setSelectedSampleId(id);
    resetLabForm();
  };

  // Auto-calculations (kept from prototype — derived from entered values)
  const plasticityIndex = useMemo(() => {
    const val = num(liquidLimit) - num(plasticLimit);
    return val > 0 ? Math.round(val * 10) / 10 : 0;
  }, [liquidLimit, plasticLimit]);
  const isPlastic = plasticityIndex > 0;

  const uscsSymbol = useMemo(() => {
    if (!gSiltClay && !liquidLimit) return "";
    const sc = num(gSiltClay);
    const ll = num(liquidLimit);
    if (sc < 50) return "SP — Poorly graded sand";
    if (ll < 35) return plasticityIndex > 7 ? "CL — Low plasticity clay" : "ML — Silt / Low plasticity";
    if (ll < 50) return plasticityIndex > 10 ? "CI — Medium plasticity clay" : "MI — Silt / Med plasticity";
    return plasticityIndex > 17 ? "CH — High plasticity clay" : "MH — Silt / High plasticity";
  }, [gSiltClay, liquidLimit, plasticityIndex]);

  const dryDensity = useMemo(() => {
    const bd = num(bulkDensity);
    const mc = num(moistureContent);
    if (bd <= 0) return 0;
    const val = bd / (1 + mc / 100);
    return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
  }, [bulkDensity, moistureContent]);

  const voidRatio = useMemo(() => {
    const gs = num(specificGravity);
    if (dryDensity <= 0 || gs <= 0) return 0;
    const val = gs / dryDensity - 1;
    return isNaN(val) || val < 0 ? 0 : parseFloat(val.toFixed(2));
  }, [specificGravity, dryDensity]);

  const porosity = useMemo(() => {
    if (voidRatio <= 0) return 0;
    const val = (voidRatio / (1 + voidRatio)) * 100;
    return isNaN(val) ? 0 : parseFloat(val.toFixed(1));
  }, [voidRatio]);

  const canSubmitLab =
    !!selectedSample &&
    !sampleLocked &&
    nablLabs.length > 0 &&
    !!selectedLabId &&
    reportNumber.trim().length > 0 &&
    reportPdfUrl.trim().length > 0 &&
    !labBusy;

  const handleLabSave = async () => {
    if (!canSubmitLab || !selectedSample) return;
    setLabBusy(true);
    setLabError(null);
    const res = await submitSampleLabResult(selectedSample.id, {
      nablLabId: selectedLabId,
      testType: "GEOTECH_LAB_SUITE",
      testValues: {
        grainSize: {
          siltClayPct: num(gSiltClay), fineSandPct: num(gFineSand), medSandPct: num(gMedSand),
          coarseSandPct: num(gCoarseSand), gravelPct: num(gGravel),
        },
        atterberg: { liquidLimit: num(liquidLimit), plasticLimit: num(plasticLimit) },
        density: {
          bulkDensity: num(bulkDensity), moistureContent: num(moistureContent),
          specificGravity: num(specificGravity),
        },
        shear: {
          uu: { c: num(uuC), phi: num(uuPhi) },
          cu: { c: num(cuC), phi: num(cuPhi) },
          cd: { c: num(cdC), phi: num(cdPhi) },
        },
        consolidation: { cc: num(cc), cv: num(cv), mv: num(mv), pc: num(pc) },
        rock: { ucs: num(ucs), pointLoad: num(pointLoad), classification: rockClass },
        chemical: {
          ph: num(ph), sulphates: num(sulphates), chlorides: num(chlorides), organic: num(organic),
        },
      },
      resultValues: {
        plasticityIndex,
        classification: uscsSymbol,
        dryDensity,
        voidRatio,
        porosity,
      },
      reportNumber: reportNumber.trim(),
      reportPdfUrl: reportPdfUrl.trim(),
      testedOn: new Date().toISOString(),
    });
    setLabBusy(false);
    if (res.success) {
      setLabSavedIds((prev) => ({ ...prev, [selectedSample.id]: true }));
      setLabSuccess(`Results for sample ${selectedSample.sampleNumber || selectedSample.id} locked & saved.`);
      router.refresh();
    } else {
      setLabError(res.error || "Failed to submit lab results.");
    }
  };

  // ── Setup tab: activity-log slide-in panel ──
  const [logPanelUser, setLogPanelUser] = useState<{ id: string; name: string; code: string } | null>(null);
  const [logEntries, setLogEntries] = useState<any[] | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const openLogPanel = async (userId: string, name: string, code: string) => {
    setLogPanelUser({ id: userId, name, code });
    setLogEntries(null);
    setLogLoading(true);
    const entries = await getUserActivityLogs(userId);
    setLogEntries(entries);
    setLogLoading(false);
  };

  // ── Tab 5: Report state ──
  const [allowableSettlement, setAllowableSettlement] = useState<number>(25);
  const [rigidityFactor, setRigidityFactor] = useState<number>(0.8);
  const [shearFailureMode, setShearFailureMode] = useState("General shear failure");
  const [seismicZone, setSeismicZone] = useState("Zone III");
  const [pga, setPga] = useState<number>(0.16);
  const [earthquakeMag, setEarthquakeMag] = useState<number>(7.5);
  const [selectedReportBhId, setSelectedReportBhId] = useState<string>("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showExcelSec, setShowExcelSec] = useState(false);

  const reportBh = useMemo(() => {
    return (
      mappedBoreholes.find((b: any) => b.id === selectedReportBhId) ||
      mappedBoreholes.find((b: any) => b.status === "COMPLETED") ||
      mappedBoreholes[0] ||
      null
    );
  }, [selectedReportBhId, mappedBoreholes]);

  // ── Tamper-evidence: real SHA-256 chain verification (GET /boreholes/:id/integrity) ──
  const [integrity, setIntegrity] = useState<BoreholeIntegrity | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [certVisible, setCertVisible] = useState(false);
  const reportBhId = reportBh?.id ?? null;

  useEffect(() => {
    if (activeTab !== "report" || !reportBhId) return;
    let cancelled = false;
    setIntegrityLoading(true);
    setCertVisible(false);
    setIntegrity(null);
    fetchBoreholeIntegrity(reportBhId).then((result) => {
      if (cancelled) return;
      setIntegrity(result);
      setIntegrityLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, reportBhId]);

  // Liquefaction from REAL intervals of the selected report borehole
  const liquefactionData = useMemo(() => {
    if (!reportBh) return [];
    return reportBh.intervals
      .filter((iv: any) => effectiveN(iv) != null)
      .map((iv: any) => {
        const depth = (iv.fromDepth + iv.toDepth) / 2;
        const rd = Math.max(1.0 - 0.00765 * depth, 0.5); // depth reduction factor
        const csr = 0.65 * pga * rd; // simplified CSR
        const n160 = iv.nCorrected ?? effectiveN(iv) ?? 0;
        const crr = n160 < 30 ? 0.05 + 0.012 * n160 + 0.0003 * n160 * n160 : 0.5; // simple curve fit
        const fs = csr > 0 ? crr / csr : 0;
        return {
          depth: `${iv.fromDepth.toFixed(2)}-${iv.toDepth.toFixed(2)}m`,
          rawN: effectiveN(iv),
          n160: n160.toFixed(1),
          csr: csr.toFixed(3),
          crr: crr.toFixed(3),
          fs: fs.toFixed(2),
          status: fs < 1.0 ? "Liquefiable" : "Safe",
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportBh, pga, appliedMods]);

  // SPT N-vs-depth points for the report graph (real data, scaled axes)
  const sptGraph = useMemo(() => {
    if (!reportBh) return null;
    const pts = reportBh.intervals
      .map((iv: any) => ({
        depth: (iv.fromDepth + iv.toDepth) / 2,
        n: iv.nCorrected ?? effectiveN(iv),
        raw: effectiveN(iv),
      }))
      .filter((p: any) => p.n != null);
    if (pts.length === 0) return null;
    const maxN = Math.max(10, Math.ceil(Math.max(...pts.map((p: any) => p.n)) / 10) * 10);
    const maxD = Math.max(1, ...pts.map((p: any) => p.depth), reportBh.finalDepth ?? 0);
    const x = (n: number) => 30 + (n / maxN) * 240;
    const y = (d: number) => 10 + (d / maxD) * 100;
    const path = pts
      .map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${x(p.n).toFixed(1)},${y(p.depth).toFixed(1)}`)
      .join(" ");
    return { pts, maxN, maxD, x, y, path };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportBh, appliedMods]);

  // Cross-section scaling for Live Monitor (real max depth — not fixed 0–18m)
  const crossSection = useMemo(() => {
    if (!selectedBorehole) return null;
    const maxDepth = Math.max(
      selectedBorehole.plannedDepth ?? 0,
      selectedBorehole.finalDepth ?? 0,
      selectedBorehole.maxIntervalDepth ?? 0,
      selectedBorehole.waterTable ?? 0
    );
    if (maxDepth <= 0) return null;
    const scale = 300 / maxDepth;
    const yOf = (d: number) => 10 + d * scale;
    const ticks = Array.from({ length: 7 }, (_, i) => (i * maxDepth) / 6);
    const nVals = selectedBorehole.intervals
      .map((iv: any) => effectiveN(iv))
      .filter((v: any): v is number => v != null && v > 0);
    const maxN = nVals.length ? Math.max(...nVals) : 0;
    return { maxDepth, scale, yOf, ticks, maxN };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBorehole, appliedMods]);

  // Schematic map positions from real coordinates (relative layout)
  const mapPoints = useMemo(() => {
    const withCoords = mappedBoreholes.filter(
      (b: any) => parseNum(b.latitude) != null && parseNum(b.longitude) != null
    );
    if (withCoords.length === 0) return [];
    const lats = withCoords.map((b: any) => parseNum(b.latitude) as number);
    const lngs = withCoords.map((b: any) => parseNum(b.longitude) as number);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latSpan = maxLat - minLat, lngSpan = maxLng - minLng;
    return withCoords.map((b: any) => {
      const lat = parseNum(b.latitude) as number;
      const lng = parseNum(b.longitude) as number;
      const left = lngSpan > 0 ? 10 + ((lng - minLng) / lngSpan) * 75 : 48;
      const top = latSpan > 0 ? 20 + (1 - (lat - minLat) / latSpan) * 55 : 48;
      return { bh: b, left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%` };
    });
  }, [mappedBoreholes]);

  const modSuccessFor = (ivId: string) => appliedMods[ivId];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-base">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ══ CUSTOM LABELS & TEXTS ══ */
        .card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 9px; padding: 14px; margin-bottom: 12px; }
        .card-title { font-size: 10px; font-weight: 600; color: var(--color-text-ter); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
        .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
        .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
        .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
        .fg { display: flex; flex-direction: column; gap: 4px; }
        .fl { font-size: 9px; font-weight: 600; color: var(--color-text-ter); }
        .fi { font-size: 11px; padding: 6px 10px; border: 1.5px solid var(--color-border-mid); border-radius: 7px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; }
        .fi:focus { border-color: var(--color-rust-mid); }
        .fs { font-size: 11px; padding: 6px 10px; border: 1.5px solid var(--color-border-mid); border-radius: 7px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; }
        .ib { border-radius: 7px; padding: 7px 11px; font-size: 10px; line-height: 1.5; margin-bottom: 12px; }

        /* DARK HSL MAP ALIGNMENT */
        .ib-r { background: rgba(163,45,45,.08); border: 0.5px solid rgba(163,45,45,.25); color: #F09595; }
        .ib-a { background: rgba(186,117,23,.08); border: 0.5px solid rgba(186,117,23,.25); color: #FAC775; }
        .ib-b { background: rgba(24,95,165,.08); border: 0.5px solid rgba(24,95,165,.25); color: #85B7EB; }
        .ib-g { background: rgba(59,109,17,.08); border: 0.5px solid rgba(59,109,17,.25); color: #97C459; }

        .ct-lock { font-size: 9px; color: var(--color-amber-d); background: rgba(186,117,23,.12); padding: 2px 6px; border-radius: 3px; font-weight: 500; text-transform: none; }
        .ct-action { font-size: 9px; color: var(--color-rust-d); cursor: pointer; text-transform: none; font-weight: 500; }
        .ct-action.disabled { opacity: .45; cursor: not-allowed; }
        .nabl-b { font-size: 9px; color: #97C459; background: rgba(59,109,17,.08); border-radius: 5px; padding: 6px 10px; border: 0.5px solid rgba(59,109,17,.25); display: inline-block; font-weight: 500; }
        .dr { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; border-bottom: 0.5px solid var(--color-border); }
        .dr:last-child { border-bottom: none; }
        .dr-l { color: var(--color-text-ter); }
        .dr-v { color: var(--color-text-sec); font-weight: 500; }
        .dr-v.ok { color: var(--color-green-d); }
        .dr-v.warn { color: var(--color-amber-d); }

        /* LIVE MONITOR TAB styles */
        .bore-viewer { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        .bv-header { background: var(--color-bg-surface); padding: 8px 12px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; }
        .bv-select { font-size: 11px; padding: 4px 8px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; margin-left: 8px; }
        .bv-body { display: grid; grid-template-columns: 1fr 320px; border-top: 1px solid var(--color-border); }
        .bv-3d { background: #1A1918; padding: 12px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; align-items: center; }
        .bv-right { padding: 12px 14px; background: var(--color-bg-surface); display: flex; flex-direction: column; gap: 4px; }
        .bv-right-title { font-size: 11px; font-weight: 600; color: var(--color-text-pri); margin-bottom: 6px; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 5px; }
        .photo-thumb { background: var(--color-bg-card); border: 0.5px solid var(--color-border); border-radius: 4px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s; overflow: hidden; }
        .photo-thumb:hover { border-color: var(--color-rust-mid); }
        .photo-thumb img { width: 100%; height: 44px; object-fit: cover; border-radius: 3px; margin-bottom: 2px; }
        .pt-icon { font-size: 14px; margin-bottom: 2px; }
        .pt-label { font-size: 8px; color: var(--color-text-ter); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .anom-card { background: rgba(163,45,45,.03); border: 1.5px dashed rgba(163,45,45,.2); border-radius: 9px; padding: 10px 12px; margin-bottom: 10px; }
        .anom-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .anom-title { font-size: 11px; font-weight: 600; color: #F09595; }
        .anom-body { font-size: 10px; color: var(--color-text-sec); line-height: 1.5; margin-bottom: 8px; }
        .anom-actions { display: flex; gap: 6px; }
        .btn { font-size: 10px; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: all 0.1s; border: none; }
        .btn-sm { font-size: 9px; padding: 4px 8px; }
        .btn:disabled { opacity: .45; cursor: not-allowed; }

        .btn-p { background: var(--color-rust-mid); color: #fff; }
        .btn-p:hover:not(:disabled) { background: var(--color-rust-d); }
        .btn-d { background: rgba(163,45,45,.15); color: #F09595; border: 0.5px solid rgba(163,45,45,.3); }
        .btn-d:hover:not(:disabled) { background: rgba(163,45,45,.25); }
        .btn-w { background: var(--color-bg-card); color: var(--color-text-sec); border: 0.5px solid var(--color-border-mid); }
        .btn-w:hover:not(:disabled) { border-color: var(--color-rust-mid); }
        .btn-s { background: rgba(59,109,17,.15); color: #97C459; border: 0.5px solid rgba(59,109,17,.3); }
        .btn-s:hover:not(:disabled) { background: rgba(59,109,17,.25); }
        .btn-b { background: rgba(24,95,165,.15); color: #85B7EB; border: 0.5px solid rgba(24,95,165,.3); }
        .btn-b:hover:not(:disabled) { background: rgba(24,95,165,.25); }

        .feed-item { display: flex; gap: 10px; padding: 8px 4px; border-bottom: 0.5px solid var(--color-border); font-size: 11px; align-items: flex-start; }
        .feed-item:last-child { border-bottom: none; }
        .fdot { width: 6px; height: 6px; margin-top: 4px; flex-shrink: 0; border-radius: 50%; }
        .fd-g { background: var(--color-green-d); }
        .fd-a { background: var(--color-amber-d); }
        .fd-r { background: var(--color-rust-d); }
        .fd-red { background: #A32D2D; }
        .fc { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .ft { color: var(--color-text-pri); font-weight: 500; }
        .fs2 { color: var(--color-text-ter); font-size: 10px; }
        .ftime { font-size: 9px; color: var(--color-text-ter); white-space: nowrap; }

        /* REVIEW TAB styles */
        .brh { display: flex; align-items: center; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 7px; padding: 10px 12px; margin-bottom: 6px; cursor: pointer; }
        .brh.flagged { border-color: rgba(163,45,45,.3); }
        .brh:hover { border-color: var(--color-border-mid); }
        .brh-id { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--color-amber-d); margin-bottom: 1px; }
        .brh-name { font-size: 12px; font-weight: 600; color: var(--color-text-pri); }
        .brh-meta { font-size: 9px; color: var(--color-text-ter); margin-top: 2px; }
        .brh-chevron { font-size: 11px; color: var(--color-text-ter); margin-left: 8px; transform: rotate(0deg); transition: transform 0.2s; }
        .brh-chevron.open { transform: rotate(180deg); }
        .spt-tbl { width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px; }
        .spt-tbl th { background: var(--color-bg-surface); color: var(--color-text-ter); text-transform: uppercase; font-size: 8px; font-weight: 600; letter-spacing: 0.4px; padding: 5px 8px; text-align: left; border-bottom: 1px solid var(--color-border); }
        .spt-tbl td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .spt-tbl tr.flagged td { background: rgba(163,45,45,.03); color: #F09595; }
        .nv { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--color-text-pri); }
        .nv-flag { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: bold; color: #F09595; }
        .mod-panel { background: var(--color-bg-raised); border: 1px solid var(--color-border-mid); border-radius: 8px; padding: 12px; margin-top: 10px; }
        .mod-title { font-size: 10px; font-weight: 600; color: var(--color-text-sec); text-transform: uppercase; margin-bottom: 8px; border-bottom: 0.5px solid var(--color-border-mid); padding-bottom: 4px; }
        .mod-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .mod-orig { font-size: 11px; font-weight: 500; color: var(--color-text-ter); }
        .mod-new { font-size: 11px; font-weight: 700; color: var(--color-green-d); }
        .btn-row { display: flex; gap: 6px; margin-top: 8px; }

        /* LAB TAB styles */
        .sl { font-size: 9px; font-weight: 600; color: var(--color-rust-d); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; margin-bottom: 6px; }
        .excel-zone { border: 1.5px dashed var(--color-border-mid); border-radius: 7px; padding: 14px; text-align: center; background: var(--color-bg-raised); }
        .excel-icon { font-size: 20px; margin-bottom: 4px; color: var(--color-text-ter); }
        .excel-text { font-size: 11px; font-weight: 500; color: var(--color-text-sec); }
        .excel-sub { font-size: 9px; color: var(--color-text-ter); margin-top: 2px; }

        /* MAP WRAP */
        .map-wrap { height: 160px; background: #252423; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 12px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .map-bg2 { position: absolute; inset: 0; opacity: 0.15; background-image: radial-gradient(#F0997B 1px, transparent 1px), radial-gradient(#F0997B 1px, transparent 1px); background-size: 20px 20px; background-position: 0 0, 10px 10px; }
        .map-grid2 { position: absolute; inset: 0; opacity: 0.05; background: linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px); background-size: 40px 40px; }
        .mp { position: absolute; cursor: pointer; display: flex; align-items: center; font-size: 12px; }
        .mp-lbl { font-size: 8px; font-family: 'DM Mono', monospace; font-weight: 700; background: var(--color-bg-surface); padding: 1px 4px; border: 0.5px solid var(--color-border-mid); border-radius: 3px; margin-left: 2px; white-space: nowrap; }

        /* TABLE styles */
        .dt { width: 100%; border-collapse: collapse; font-size: 11px; }
        .dt th { background: var(--color-bg-surface); padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 8px; font-weight: 600; color: var(--color-text-ter); border-bottom: 1px solid var(--color-border); }
        .dt td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .td-p { font-weight: 600; color: var(--color-text-pri) !important; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .data-table th { background: var(--color-bg-surface); padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 8px; font-weight: 600; color: var(--color-text-ter); border-bottom: 1px solid var(--color-border); letter-spacing: 0.4px; }
        .data-table td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .pill-green { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 8px; font-size: 9px; font-weight: 500; background: rgba(59,109,17,.12); color: #97C459; border: 0.5px solid rgba(59,109,17,.25); }
        .pill-gray { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 8px; font-size: 9px; font-weight: 500; background: rgba(107,105,102,.12); color: #B4B2A9; border: 0.5px solid rgba(107,105,102,.3); }

        /* EMPTY STATES */
        .empty-state { padding: 22px 16px; text-align: center; color: var(--color-text-ter); font-size: 11px; border: 1.5px dashed var(--color-border-mid); border-radius: 8px; background: var(--color-bg-raised); line-height: 1.6; }
        .empty-state b { color: var(--color-text-sec); font-weight: 600; }

        /* ACTIVITY LOG SLIDE-IN PANEL */
        .log-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 360px; background: var(--color-bg-surface); border-left: 1px solid var(--color-border); z-index: 200; overflow-y: auto; box-shadow: -8px 0 24px rgba(0,0,0,.45); animation: logSlideIn .2s ease; }
        @keyframes logSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .logp-header { padding: 14px 16px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 8px; position: sticky; top: 0; background: var(--color-bg-surface); }
        .logp-title { font-size: 13px; font-weight: 600; color: var(--color-text-pri); }
        .logp-close { margin-left: auto; cursor: pointer; color: var(--color-text-ter); font-size: 16px; background: transparent; border: none; }
        .logp-body { padding: 14px 16px; }
        .log-entry { display: flex; gap: 8px; padding: 7px 0; border-bottom: 0.5px solid var(--color-border); font-size: 10px; align-items: flex-start; }
        .log-entry:last-child { border-bottom: none; }
        .log-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; background: var(--color-rust-mid); }
        .log-action { color: var(--color-text-pri); font-weight: 500; font-size: 10px; }
        .log-detail { color: var(--color-text-ter); font-size: 9px; }
        .log-time { margin-left: auto; font-size: 8px; color: var(--color-text-ter); white-space: nowrap; }

        /* REPORT PREVIEW */
        .report-preview-box { background: #FFFFFF; color: #1E1D1C; border-radius: 8px; padding: 24px; font-family: 'Outfit', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15); margin-top: 12px; border: 1px solid #E5E5E5; }
        .rp-header { border-bottom: 2px solid #1A1918; padding-bottom: 12px; margin-bottom: 16px; text-align: center; }
        .rp-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; text-transform: uppercase; color: #1A1918; }
        .rp-subtitle { font-size: 10px; font-family: 'DM Mono', monospace; color: #6B6966; margin-top: 4px; }
        .rp-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
        .rp-table th { background: #F4F4F4; color: #1A1918; font-weight: 700; border: 1px solid #D5D5D5; padding: 6px; text-align: left; text-transform: uppercase; font-size: 8px; }
        .rp-table td { border: 1px solid #D5D5D5; padding: 6px; color: #333332; }

        /* TAMPER CERTIFICATE */
        .rp-cert { background: var(--color-bg-raised); border: 1px solid var(--color-border-mid); border-radius: 8px; padding: 12px; margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
        .rp-cert-t { font-size: 10px; font-weight: 700; color: var(--color-text-sec); }
        .rp-cert-h { font-size: 9px; color: var(--color-text-ter); line-height: 1.5; }
      ` }} />

      {/* Internal Interactive Tab Bar */}
      <div className="flex items-center bg-bg-surface border-b border-border shrink-0 select-none" style={{ padding: "0 16px" }}>
        {[
          { key: "setup", label: "Setup", icon: <RiSettings4Line /> },
          { key: "monitor", label: "Live Monitor", icon: <RiRadarLine /> },
          { key: "review", label: "Review", icon: <RiCheckDoubleLine /> },
          { key: "lab", label: "Lab", icon: <RiFlaskLine /> },
          { key: "report", label: "Report", icon: <RiFileTextLine /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-[6px] whitespace-nowrap bg-transparent border-x-0 border-t-0 transition-all duration-100 cursor-pointer
              ${activeTab === t.key
                ? "text-rust-d border-b-2 border-rust-mid font-semibold"
                : "text-text-ter border-b-2 border-transparent hover:text-text-sec"
              }`}
            style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 500 }}
          >
            <span className="text-[12px]">{t.icon}</span>
            {t.label}
            {t.key === "monitor" && visibleAnomalies.length > 0 && (
              <span className="pill p-red text-[8px]">{visibleAnomalies.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents Content Wrapper */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ⚙ SETUP TAB */}
        {activeTab === "setup" && (
          <div className="animate-fade-in">
            <div className="ib ib-r shadow-sm">
              ⚠ Once the first SPT entry is submitted by a field worker, all setup data becomes read-only and cannot be modified by anyone — including the engineer. Ensure all parameters are correct before field work begins.
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Total borings</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.total}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Planned</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Completed</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.completed}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">In progress</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.active}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{stats.active > 0 ? "Active now" : "None active"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Pending</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.pending}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Not started</div>
              </div>
            </div>

            {/* Project Details Card — real project data, "—" where absent */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>📋 Project Details</span>
                <span className="ct-action disabled" title="Coming soon — project editing is not available yet">Edit</span>
              </div>
              {!proj ? (
                <div className="empty-state">Project details could not be loaded.</div>
              ) : (
                <>
                  <div className="grid2">
                    <div className="fg">
                      <div className="fl">Project ID</div>
                      <input className="fi font-mono text-amber-d" value={proj.projectCode ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Project Name</div>
                      <input className="fi" value={proj.name ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Client / Authority</div>
                      <input className="fi" value={proj.initiatedByCompany?.name ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Contractor</div>
                      <input className="fi" value={proj.epcOrganization?.name ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">IE Firm</div>
                      <input className="fi" value={proj.billingCompany?.name ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Contract Number (auto-generated)</div>
                      <input
                        className="fi font-mono text-[10px]"
                        value={
                          proj.projectCode && proj.epcOrganization?.code
                            ? `${proj.initiatedByCompany?.code ?? "CLIENT"}/${proj.epcOrganization.code}/${proj.projectCode}`
                            : "Not generated yet"
                        }
                        readOnly
                      />
                      <div style={{ fontSize: "9px", color: "var(--color-text-ter)", marginTop: "2px" }}>Format: Client/Contractor/Project — generated from registered organizations</div>
                    </div>
                  </div>
                  <div className="grid3 mt-2">
                    <div className="fg">
                      <div className="fl">State</div>
                      <input className="fi" value={proj.state ?? "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Investigation Start</div>
                      <input className="fi" value={proj.startDate ? new Date(proj.startDate).toLocaleDateString("en-IN") : "—"} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Expected Completion</div>
                      <input className="fi" value={proj.endDate ? new Date(proj.endDate).toLocaleDateString("en-IN") : "—"} readOnly />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Investigation Parameters Card — form defaults only; persistence not built yet */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>⚙ Investigation Parameters</span>
                <span className="ct-lock" title="Parameter storage is not available on the server yet">Coming soon — not yet persisted</span>
              </div>
              <div className="ib ib-a">
                ⚠ These parameters apply to ALL borings in this project. Cannot be changed once any boring is started by a field worker.
              </div>
              <div className="grid2">
                <div className="fg">
                  <div className="fl">Boring Method</div>
                  <select className="fs" disabled defaultValue="rotary" title="Coming soon">
                    <option value="rotary">Rotary boring — NX size bit</option>
                    <option>Percussion boring</option>
                    <option>Wash boring</option>
                    <option>Auger boring</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">Drilling Fluid</div>
                  <select className="fs" disabled defaultValue="bentonite" title="Coming soon">
                    <option>Water</option>
                    <option value="bentonite">Bentonite slurry</option>
                    <option>Mud</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">Casing Used</div>
                  <select className="fs" disabled defaultValue="yes" title="Coming soon">
                    <option value="yes">Yes — 150mm dia NW casing</option>
                    <option>No casing</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">SPT Hammer Type</div>
                  <select className="fs" disabled defaultValue="is2131" title="Coming soon">
                    <option value="is2131">63.5 kg — 75cm free fall (IS 2131 Standard)</option>
                    <option value="donut">Donut Hammer — 63.5 kg</option>
                    <option value="safety">Safety Hammer — 63.5 kg</option>
                    <option value="nonstandard">Non-standard Hammer (Manual trip)</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">IS Code Applicable</div>
                  <select className="fs" disabled defaultValue="is1892" title="Coming soon">
                    <option value="is1892">IS 1892 + IRC 78 + IS 2131</option>
                    <option>RDSO + IRS Bridge Code</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">NABL Lab Assigned</div>
                  <select className="fs" disabled title={nablLabs.length === 0 ? "No NABL lab registered yet" : "Coming soon"}>
                    {nablLabs.length === 0 ? (
                      <option>No NABL lab registered yet</option>
                    ) : (
                      nablLabs.map((lab: any) => (
                        <option key={lab.id}>{lab.labName} — NABL {lab.nablCertNumber}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              {activeNablLab ? (
                <div className="nabl-b mt-3">
                  {activeNablLab.isVerified ? "✓ NABL Accreditation verified" : "○ NABL accreditation pending verification"} · {activeNablLab.labName} · {activeNablLab.nablCertNumber}
                  {activeNablLab.certValidUntil ? ` · Valid until ${new Date(activeNablLab.certValidUntil).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}
                </div>
              ) : (
                <div className="ib ib-a mt-3 mb-0">⚠ No NABL lab registered yet — lab result submission is disabled until a lab is added.</div>
              )}
            </div>

            {/* Team Assignment Card — real project members */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>👥 Team Assignment</span>
                <span className="ct-action disabled flex items-center gap-1" title="Coming soon — member management is not available yet"><RiUserAddLine /> Add member</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button className="btn btn-p btn-sm" disabled title="Coming soon — team creation is not available yet">+ Add Team</button>
                <div className="text-[10px] text-text-ter self-center">
                  Project members are shown below. Team grouping appears once teams are assigned from the server.
                </div>
              </div>

              {members.length === 0 ? (
                <div className="empty-state">
                  <b>No members assigned to this project yet.</b><br />
                  Members appear here once they are added to the project.
                </div>
              ) : (
                <div className="bg-bg-raised border border-border rounded-lg p-3">
                  <div className="text-[11px] font-bold text-green-d mb-2">Project Members ({members.length})</div>
                  <table className="dt">
                    <thead>
                      <tr>
                        <th>GL ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m: any, i: number) => {
                        const mu = m.user || {};
                        const name = `${mu.firstName ?? ""} ${mu.lastName ?? ""}`.trim() || "—";
                        return (
                          <tr key={m.id || i}>
                            <td className="font-mono text-[9px] text-amber-d">{mu.employeeCode ?? "—"}</td>
                            <td className="td-p">{name}</td>
                            <td>{m.role ?? "Member"}</td>
                            <td className="text-[10px]">{mu.email ?? "—"}</td>
                            <td className="text-[10px]">{m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                            <td>
                              <button
                                className="btn btn-s btn-sm"
                                onClick={() => openLogPanel(mu.id ?? m.userId, name, mu.employeeCode ?? "")}
                              >
                                View log
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Site Geology + Seismicity — report calculation inputs (feed liquefaction) */}
            <div className="card shadow-sm">
              <div className="card-title">🌍 Site Geology + Seismicity</div>
              <div className="grid3 mb-2">
                <div className="fg">
                  <div className="fl">Seismic zone (IS 1893)</div>
                  <select className="fs" value={seismicZone} onChange={(e) => {
                    setSeismicZone(e.target.value);
                    if (e.target.value === "Zone I") setPga(0.06);
                    else if (e.target.value === "Zone II") setPga(0.10);
                    else if (e.target.value === "Zone III") setPga(0.16);
                    else if (e.target.value === "Zone IV") setPga(0.24);
                    else if (e.target.value === "Zone V") setPga(0.36);
                  }}>
                    <option>Zone I</option>
                    <option>Zone II</option>
                    <option>Zone III</option>
                    <option>Zone IV</option>
                    <option>Zone V</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="fl">PGA (amax/g)</div>
                  <input className="fi font-mono" type="number" step="0.01" value={pga} onChange={(e) => setPga(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="fg">
                  <div className="fl">Geological formation</div>
                  <select className="fs">
                    <option>Alluvial plain</option>
                    <option>Lateritic</option>
                    <option>Hard rock</option>
                    <option>Mixed alluvial</option>
                    <option>Basaltic</option>
                  </select>
                </div>
              </div>
              <div className="bg-bg-raised rounded p-[6px_10px] text-[9px] text-text-ter">
                Seismic zone feeds liquefaction assessment automatically. PGA used in CSR/CRR calculation. These inputs are session-only — server storage is coming soon.
              </div>
            </div>

            {/* Boring Locations Table with Excel import */}
            <div className="card shadow-sm">
              <div className="card-title">
                <span>📍 Boring Locations</span>
                <div className="flex gap-2">
                  <span className="ct-lock self-center">🔒 Locked after boring start</span>
                  <span className="ct-action self-center" onClick={() => setShowExcelSec(!showExcelSec)}>
                    {showExcelSec ? "✕ Close Excel tool" : "📂 Excel Import / Export"}
                  </span>
                </div>
              </div>

              {/* Excel Import Panel — UI placeholder, functionality coming soon */}
              {showExcelSec && (
                <div className="bg-bg-raised border border-border rounded-lg p-3 mb-3 animate-fade-down">
                  <div className="ib ib-b">
                    ℹ Download the Excel template, fill boring locations with your structural engineer / contractor, then upload. Format: BH No. · Latitude · Longitude · RL · Planned Depth
                  </div>
                  <div className="grid2 mb-2">
                    <button className="btn btn-b w-full" disabled title="Coming soon — Excel template download is not available yet">⬇ Download Excel template</button>
                    <div className="excel-zone py-2 flex flex-col justify-center items-center opacity-50" title="Coming soon — Excel upload is not available yet">
                      <div className="text-[16px] mb-1">📂</div>
                      <div className="text-[10px] font-semibold text-text-sec">Upload filled Excel</div>
                      <div className="text-[8px] text-text-ter">Coming soon</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Schematic map from real GPS coordinates */}
              <div className="map-wrap">
                <div className="map-bg2" />
                <div className="map-grid2" />
                {mapPoints.length === 0 ? (
                  <div className="relative z-10 text-[10px] text-text-ter">No GPS coordinates recorded yet — locations appear when boreholes are geo-tagged</div>
                ) : (
                  mapPoints.map(({ bh, left, top }: any) => {
                    const icon = bh.status === "COMPLETED" ? "📍" : bh.status === "IN_PROGRESS" ? "🔵" : "⭕";
                    const color = bh.status === "COMPLETED" ? "#97C459" : bh.status === "IN_PROGRESS" ? "#85B7EB" : "#6B6966";
                    const label = bh.status === "COMPLETED" ? "✓" : bh.status === "IN_PROGRESS" ? "active" : "pending";
                    return (
                      <div key={bh.id} className="mp" style={{ left, top }} title={`${bh.boreholeCode} · ${bh.name}`}>
                        <span>{icon}</span>
                        <div className="mp-lbl" style={{ color }}>{bh.boreholeCode?.split("-").pop()} {label}</div>
                      </div>
                    );
                  })
                )}
                {mapPoints.length > 0 && (
                  <div className="absolute bottom-1 right-2 z-10 text-[8px] text-text-ter">Relative layout from recorded GPS — not to scale</div>
                )}
              </div>

              {/* Locations table — real fields only */}
              <div className="overflow-x-auto">
                <table className="dt" style={{ minWidth: "760px" }}>
                  <thead>
                    <tr>
                      <th>BH ID</th>
                      <th>Location / Sub-structure</th>
                      <th>Team</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>RL (m)</th>
                      <th>Planned Depth (m)</th>
                      <th>Final Depth (m)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedBoreholes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center text-text-ter py-4">
                          No boreholes created yet — they appear here once the project setup adds them.
                        </td>
                      </tr>
                    ) : (
                      mappedBoreholes.map((bh: any) => {
                        const st = BH_STATUS[bh.status] || BH_STATUS.PLANNED;
                        return (
                          <tr key={bh.id}>
                            <td className="font-mono text-[9px] text-amber-d">{bh.boreholeCode}</td>
                            <td className="td-p">{bh.name}</td>
                            <td>{bh.teamName ? <span className="pill p-b" style={{ fontSize: "8px" }}>{bh.teamName}</span> : "—"}</td>
                            <td className="font-mono text-[10px]">{bh.latitude ?? "—"}</td>
                            <td className="font-mono text-[10px]">{bh.longitude ?? "—"}</td>
                            <td className="font-mono text-[10px]">{fmtNum(bh.groundLevelRL, 3)}</td>
                            <td>{fmtNum(bh.plannedDepth, 1)}</td>
                            <td>{fmtNum(bh.finalDepth, 1)}</td>
                            <td><span className={`pill ${st.cls}`}>{st.text}</span></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="btn-row justify-end mt-3">
                <button className="btn btn-p" disabled title="Coming soon — setup persistence is not available yet">Save Setup</button>
                <button className="btn btn-w flex items-center gap-1" onClick={() => setShowExcelSec(!showExcelSec)}>
                  📂 Import / Export Excel
                </button>
              </div>
            </div>

            {/* Sites Table */}
            {sites.length > 0 && (
              <div className="card shadow-sm">
                <div className="card-title">📍 Project Sites / structures ({sites.length})</div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Coordinates</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s: any) => (
                        <tr key={s.id}>
                          <td className="font-mono text-[9px] text-amber-d">{s.code}</td>
                          <td className="text-text-pri font-medium">{s.name}</td>
                          <td>{s.description || "—"}</td>
                          <td className="font-mono text-[9px]">{s.latitude ? `${s.latitude}, ${s.longitude}` : "—"}</td>
                          <td><span className={`pill ${s.isActive ? "pill-green" : "pill-gray"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📡 LIVE MONITOR TAB */}
        {activeTab === "monitor" && (
          <div className="animate-fade-in">
            {/* Summary counters — real values only */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Live borings</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{stats.active}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{stats.active > 0 ? "Active now" : "None active"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Anomalies</div>
                <div className="text-[20px] font-bold font-display" style={{ color: visibleAnomalies.length > 0 ? "#EF9F27" : "var(--color-text-pri)" }}>
                  {visibleAnomalies.length}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">{visibleAnomalies.length > 0 ? "Pending review" : "None detected"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Entries today</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{entriesToday}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{lastEntryAgo ? `Last ${lastEntryAgo}` : "No entries yet"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Photos</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{totalPhotos}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">Uploaded from field</div>
              </div>
            </div>

            {/* 3D Bore Viewer */}
            {mappedBoreholes.length === 0 ? (
              <div className="empty-state mb-3">
                <b>No boreholes yet.</b><br />
                Live cross-sections appear here once boreholes are created and field teams sync SPT data.
              </div>
            ) : (
              <div className="bore-viewer shadow-sm">
                <div className="bv-header flex justify-between w-full">
                  <div className="flex items-center">
                    <span className="text-[11px] font-semibold text-text-sec">Select borehole</span>
                    <select
                      className="bv-select font-mono"
                      value={selectedBorehole?.id ?? ""}
                      onChange={(e) => setSelectedBhId(e.target.value)}
                    >
                      {mappedBoreholes.map((bh: any) => (
                        <option key={bh.id} value={bh.id}>
                          {bh.boreholeCode} · {bh.name} · {(BH_STATUS[bh.status] || BH_STATUS.PLANNED).text.replace(/^[^\w]+\s*/, "")}
                          {anomaliesForBh(bh.id).length > 0 ? " ⚠" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedBorehole && anomaliesForBh(selectedBorehole.id).length > 0 && (
                    <span className="pill p-red shrink-0 text-[9px] font-semibold">⚠ {anomaliesForBh(selectedBorehole.id).length} anomal{anomaliesForBh(selectedBorehole.id).length === 1 ? "y" : "ies"} flagged</span>
                  )}
                </div>

                <div className="bv-body">
                  {/* Cross-section SVG */}
                  <div className="bv-3d">
                    <div className="text-[9px] text-green-d mb-2 font-mono">
                      {selectedBorehole.boreholeCode} · {selectedBorehole.name} · {fmtNum(selectedBorehole.finalDepth, 1, "m")} · {selectedBorehole.status}
                    </div>

                    {!crossSection || selectedBorehole.intervals.length === 0 ? (
                      <div className="empty-state w-full my-8">
                        <b>No SPT intervals recorded yet.</b><br />
                        The cross-section is drawn from field data — it appears when field teams sync.
                      </div>
                    ) : (
                      <svg width="100%" height="320" viewBox="0 0 280 320" style={{ maxWidth: "320px" }}>
                        {/* Depth axis scaled from real max depth */}
                        <line x1="35" y1="10" x2="35" y2="310" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                        {crossSection.ticks.map((d: number, i: number) => (
                          <g key={i}>
                            <text x="2" y={crossSection.yOf(d) + 3} fontSize="8" fill="#6B6966" fontFamily="sans-serif">
                              {d % 1 === 0 ? d.toFixed(0) : d.toFixed(1)}m
                            </text>
                            <line x1="35" y1={crossSection.yOf(d)} x2="200" y2={crossSection.yOf(d)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                          </g>
                        ))}

                        {/* Soil layers from real intervals */}
                        {selectedBorehole.intervals.map((interval: any, idx: number) => {
                          const colors = getSoilColors(interval.soilDescription);
                          const startY = crossSection.yOf(interval.fromDepth);
                          const height = Math.max((interval.toDepth - interval.fromDepth) * crossSection.scale, 2);
                          return (
                            <g key={interval.id || idx}>
                              <rect x="38" y={startY} width="80" height={height} fill={colors.fill} rx="1" />
                              <rect x="38" y={startY} width="80" height={height} fill="none" stroke={colors.stroke} strokeWidth="0.5" />
                              {height > 14 && interval.soilDescription && (
                                <text x="42" y={startY + height / 2 + 3} fontSize="7" fill={colors.textColor}>
                                  {interval.soilDescription.slice(0, 16)}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Anomaly bands from the real heuristic */}
                        {anomaliesForBh(selectedBorehole.id).map((a) => {
                          const iv = selectedBorehole.intervals.find((x: any) => x.id === a.intervalId);
                          if (!iv) return null;
                          const startY = crossSection.yOf(iv.fromDepth);
                          const height = Math.max((iv.toDepth - iv.fromDepth) * crossSection.scale, 8);
                          return (
                            <g key={a.intervalId}>
                              <rect x="35" y={startY} width="86" height={height} fill="rgba(163,45,45,0.25)" rx="1" />
                              <rect x="35" y={startY} width="86" height={height} fill="none" stroke="#A32D2D" strokeWidth="1" strokeDasharray="3,2" />
                              {height > 10 && (
                                <text x="40" y={startY + height / 2 + 2} fontSize="7" fill="#F09595" fontWeight="bold">
                                  ⚠ {a.type === "REFUSAL" ? "Refusal" : `N=${a.nValue} anomaly`}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Borehole shaft outline scaled to drilled depth */}
                        {(() => {
                          const shaftDepth = selectedBorehole.finalDepth ?? selectedBorehole.maxIntervalDepth ?? 0;
                          const shaftH = Math.max(shaftDepth * crossSection.scale, 4);
                          return (
                            <g>
                              <rect x="88" y="10" width="12" height={shaftH} fill="#0A120A" rx="2" />
                              <rect x="88" y="10" width="12" height={shaftH} fill="none" stroke="#1A2E1A" strokeWidth="0.5" />
                              <ellipse cx="94" cy="10" rx="6" ry="2" fill="#0A0A0A" />
                            </g>
                          );
                        })()}

                        {/* N-value bars */}
                        <line x1="121" y1="10" x2="121" y2="310" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                        {selectedBorehole.intervals.map((interval: any, idx: number) => {
                          const nVal = effectiveN(interval);
                          if (nVal == null) return null;
                          const startY = crossSection.yOf(interval.fromDepth);
                          const height = Math.max((interval.toDepth - interval.fromDepth) * crossSection.scale, 2);
                          const width = crossSection.maxN > 0 ? Math.max((nVal / crossSection.maxN) * 60, 2) : 2;
                          const isAnom = anomalousIntervalIds.has(interval.id);
                          const color = isAnom ? "#F09595" : "#FAC775";
                          return (
                            <g key={interval.id || idx}>
                              <rect x="122" y={startY + height / 2 - 2} width={width} height="4" fill={color} rx="1" />
                              <text x={122 + width + 4} y={startY + height / 2 + 1} fontSize="7" fill={color} fontFamily="monospace">
                                {interval.isRefusal ? "Refusal" : `N=${nVal}`}{isAnom ? "⚠" : ""}
                              </text>
                            </g>
                          );
                        })}

                        {/* Water table indicator line */}
                        {selectedBorehole.waterTable != null && (
                          <g>
                            <line x1="35" y1={crossSection.yOf(selectedBorehole.waterTable)} x2="200" y2={crossSection.yOf(selectedBorehole.waterTable)} stroke="#378ADD" strokeWidth="1" strokeDasharray="3,2" opacity="0.8" />
                            <text x="36" y={crossSection.yOf(selectedBorehole.waterTable) - 2} fontSize="7" fill="#85B7EB" fontFamily="monospace">
                              WT {selectedBorehole.waterTable.toFixed(2)}m
                            </text>
                          </g>
                        )}

                        {/* Legend */}
                        <g transform="translate(0, 306)">
                          <rect x="38" y="0" width="8" height="6" fill="#1A2E1A" rx="1" /><text x="49" y="6" fontSize="6" fill="#6B6966">Fill</text>
                          <rect x="70" y="0" width="8" height="6" fill="#2A2010" rx="1" /><text x="81" y="6" fontSize="6" fill="#6B6966">Silt</text>
                          <rect x="102" y="0" width="8" height="6" fill="#281818" rx="1" /><text x="113" y="6" fontSize="6" fill="#6B6966">Clay</text>
                          <rect x="134" y="0" width="8" height="6" fill="#201A08" rx="1" /><text x="145" y="6" fontSize="6" fill="#6B6966">Sand</text>
                          <rect x="166" y="0" width="8" height="6" fill="#151515" rx="1" /><text x="177" y="6" fontSize="6" fill="#6B6966">Rock</text>
                        </g>
                      </svg>
                    )}
                  </div>

                  {/* Right detail panel — real values, "—" for absent */}
                  <div className="bv-right">
                    <div className="bv-right-title">{selectedBorehole.boreholeCode} · {selectedBorehole.name}</div>

                    <div className="dr">
                      <span className="dr-l">Status</span>
                      <span className={`dr-v ${anomaliesForBh(selectedBorehole.id).length > 0 ? "warn" : "ok"}`}>
                        {anomaliesForBh(selectedBorehole.id).length > 0
                          ? "⚠ Anomaly flagged"
                          : (BH_STATUS[selectedBorehole.status] || BH_STATUS.PLANNED).text}
                      </span>
                    </div>
                    <div className="dr"><span className="dr-l">Start</span><span className="dr-v ok">{fmtDateTime(selectedBorehole.startedAt)}</span></div>
                    <div className="dr"><span className="dr-l">End</span><span className="dr-v ok">{selectedBorehole.completedAt ? fmtDateTime(selectedBorehole.completedAt) : selectedBorehole.status === "IN_PROGRESS" ? "In progress" : "—"}</span></div>
                    <div className="dr"><span className="dr-l">Total depth</span><span className="dr-v">{fmtNum(selectedBorehole.finalDepth, 1, "m")}</span></div>
                    <div className="dr"><span className="dr-l">Latitude</span><span className="dr-v">{selectedBorehole.latitude ?? "—"}</span></div>
                    <div className="dr"><span className="dr-l">Longitude</span><span className="dr-v">{selectedBorehole.longitude ?? "—"}</span></div>
                    <div className="dr"><span className="dr-l">GPS deviation</span><span className="dr-v" title="Planned-vs-actual GPS comparison is not captured by the field app yet">not recorded</span></div>
                    <div className="dr"><span className="dr-l">RL</span><span className="dr-v">{fmtNum(selectedBorehole.groundLevelRL, 3, "m")}</span></div>
                    <div className="dr"><span className="dr-l">Water table</span><span className={`dr-v ${selectedBorehole.waterTable != null ? "ok" : ""}`}>{fmtNum(selectedBorehole.waterTable, 2, "m")}</span></div>
                    <div className="dr"><span className="dr-l">SPT intervals</span><span className="dr-v">{selectedBorehole.intervals.length}</span></div>
                    <div className="dr"><span className="dr-l">Samples</span><span className="dr-v">{selectedBorehole.samples.length}</span></div>
                    <div className="dr"><span className="dr-l">Photos</span><span className="dr-v">{selectedBorehole.media.length} uploaded</span></div>
                    <div className="dr"><span className="dr-l">Team</span><span className="dr-v">{selectedBorehole.teamName ?? "—"}</span></div>

                    {anomaliesForBh(selectedBorehole.id).slice(0, 1).map((a) => (
                      <div key={a.intervalId} className="mt-2 p-2 bg-[rgba(163,45,45,.08)] border border-[rgba(163,45,45,.35)] rounded-md animate-fade-in">
                        <div className="text-[9px] font-semibold text-[#F09595] mb-0.5">⚠ Anomaly — {a.depthLabel}</div>
                        <div className="text-[9px] text-text-sec leading-relaxed mb-1.5">{a.message}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptValid(a.intervalId, `Anomaly accepted as valid by engineer: ${a.message}`)}
                            className="btn btn-s btn-sm py-1 flex-1 cursor-pointer"
                            disabled={acceptBusyId === a.intervalId}
                          >
                            {acceptBusyId === a.intervalId ? "Saving…" : "✓ Accept as valid"}
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab("review");
                              expandBh(a.boreholeId);
                            }}
                            className="btn btn-p btn-sm py-1 flex-1 text-center cursor-pointer"
                          >
                            Review / Modify N
                          </button>
                        </div>
                        {acceptError?.id === a.intervalId && (
                          <div className="text-[9px] text-[#F09595] mt-1">✗ {acceptError.message}</div>
                        )}
                      </div>
                    ))}

                    <div className="border-t border-border my-2" />
                    <div className="text-[9px] font-semibold text-text-ter uppercase">Site Photos</div>
                    {selectedBorehole.media.length === 0 ? (
                      <div className="text-[9px] text-text-ter py-2">No site photos uploaded yet — they appear when field teams sync.</div>
                    ) : (
                      <div className="photo-grid">
                        {selectedBorehole.media.slice(0, 9).map((med: any) => (
                          <div key={med.id} className="photo-thumb" title={med.fileName}>
                            {med.mimeType?.startsWith("image/") ? (
                              // Authenticated media proxy
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`/api/media/${med.id}`} alt={med.fileName || "Site photo"} />
                            ) : (
                              <div className="pt-icon">📎</div>
                            )}
                            <div className="pt-label">{med.photoType || med.fileName || "Photo"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Anomaly Alerts — only rendered when real anomalies exist */}
            {visibleAnomalies.length > 0 && (
              <>
                <div className="text-[10px] font-bold text-red-500 tracking-[0.5px] uppercase mb-2">🚨 Anomaly Alerts — Action Required</div>
                {visibleAnomalies.map((a) => (
                  <div key={a.intervalId} className="anom-card">
                    <div className="anom-hdr">
                      <span className="pill p-red text-[8px] uppercase">{a.type === "REFUSAL" ? "⚠ Refusal" : "🚨 Critical"}</span>
                      <span className="anom-title">{a.boreholeCode} · {a.boreholeName} · {a.depthLabel}{a.type === "N_SPIKE" ? ` — N=${a.nValue} statistical anomaly` : " — refusal recorded"}</span>
                    </div>
                    <div className="anom-body">{a.message}</div>
                    <div className="anom-actions">
                      <button
                        onClick={() => { setActiveTab("review"); expandBh(a.boreholeId); }}
                        className="btn btn-d btn-sm"
                      >
                        🚩 Flag for correction
                      </button>
                      <button
                        onClick={() => handleAcceptValid(a.intervalId, `Anomaly accepted as valid by engineer: ${a.message}`)}
                        className="btn btn-s btn-sm"
                        disabled={acceptBusyId === a.intervalId}
                      >
                        {acceptBusyId === a.intervalId ? "Saving…" : "✓ Accept as valid"}
                      </button>
                    </div>
                    {acceptError?.id === a.intervalId && (
                      <div className="text-[9px] text-[#F09595] mt-1">✗ {acceptError.message}</div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Live Data Feed — real activity logs */}
            <div className="card shadow-sm">
              <div className="card-title">📡 Live Data Feed — Recent Activity</div>
              {logs.length === 0 ? (
                <div className="empty-state">
                  <b>No activity yet.</b><br />
                  Entries appear here when field teams sync data.
                </div>
              ) : (
                logs.map((log: any, i: number) => (
                  <div key={log.id || i} className="feed-item">
                    <div className={`fdot ${String(log.action).toUpperCase().includes("ANOMALY") ? "fd-red" : String(log.action).toUpperCase().includes("WATER") ? "fd-a" : "fd-g"}`} />
                    <div className="fc">
                      <div className="ft">{log.action}</div>
                      <div className="fs2">
                        {log.entityType} {log.entityId ? `· ${log.entityId}` : ""} · By {log.user?.firstName ?? "—"} {log.user?.lastName ?? ""}
                      </div>
                    </div>
                    <div className="ftime">{timeAgo(log.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ✓ REVIEW TAB */}
        {activeTab === "review" && (
          <div className="animate-fade-in">
            <div className="ib ib-b shadow-sm">
              ℹ Engineer review: Modifications require mandatory IS code reason. Original entry always preserved in remarks. All modifications logged with your name, timestamp, IS clause reference.
            </div>

            {mappedBoreholes.length === 0 && (
              <div className="empty-state">
                <b>No boreholes to review yet.</b><br />
                Boreholes appear here once they are created and field data is synced.
              </div>
            )}

            {mappedBoreholes.map((bh: any) => {
              const isOpen = expandedBhId === bh.id;
              const isCompleted = bh.status === "COMPLETED";
              // Approved = persisted APPROVED review exists, or approved this session
              const isAppr =
                !!bhStatusApproved[bh.id] ||
                (bhReviews[bh.id] || []).some((r: any) => r.status === "APPROVED");
              const bhAnoms = anomaliesForBh(bh.id);
              const flagged = bhAnoms.length > 0;

              return (
                <div key={bh.id} className="mb-2" style={{ opacity: isCompleted || flagged ? 1 : 0.6 }}>
                  <div
                    onClick={() => {
                      if (!isCompleted && bh.intervals.length === 0) return;
                      toggleExpandBh(bh.id);
                    }}
                    className={`brh ${!isCompleted && bh.intervals.length === 0 ? "cursor-not-allowed" : ""} ${flagged && !isAppr ? "flagged" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="brh-id">{bh.boreholeCode}</div>
                      <div className="brh-name">{bh.name}</div>
                      <div className="brh-meta">
                        {fmtNum(bh.finalDepth, 1, "m")} · {bh.intervals.length} SPT intervals{bh.teamName ? ` · ${bh.teamName}` : ""}
                        {!isCompleted && bh.intervals.length === 0 && " · No field data yet"}
                        {!isCompleted && bh.intervals.length > 0 && " · Boring not yet closed"}
                      </div>
                    </div>
                    {isCompleted ? (
                      <span className={`pill ${isAppr ? "p-g" : flagged ? "p-red" : "p-gr"} ml-auto text-[9px]`}>
                        {isAppr ? "✓ Approved" : flagged ? "🚨 Review required" : "○ Not reviewed"}
                      </span>
                    ) : (
                      <span className={`pill ${(BH_STATUS[bh.status] || BH_STATUS.PLANNED).cls} ml-auto text-[9px]`}>
                        {(BH_STATUS[bh.status] || BH_STATUS.PLANNED).text}
                      </span>
                    )}
                    {(isCompleted || bh.intervals.length > 0) && (
                      <span className={`brh-chevron ${isOpen ? "open" : ""}`}>▾</span>
                    )}
                  </div>

                  {isOpen && (
                    <div className="bg-bg-card border border-border rounded-b-[7px] p-3 -mt-2 mb-2 animate-fade-down">
                      {bh.intervals.length === 0 ? (
                        <div className="empty-state">
                          <b>No SPT intervals recorded yet.</b><br />
                          Data appears when field teams sync.
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-semibold text-text-ter uppercase">SPT Interval Readings</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveBoring(bh)}
                                className="btn btn-s btn-sm cursor-pointer"
                                title="Records a persisted APPROVE review for every SPT interval of this boring"
                                disabled={isAppr || approveBusyBhId === bh.id}
                              >
                                {isAppr ? "✓ Approved" : approveBusyBhId === bh.id ? "Approving…" : "✓ Approve Boring"}
                              </button>
                            </div>
                          </div>

                          {approveError && (
                            <div className="ib ib-r">✗ {approveError}</div>
                          )}

                          <table className="spt-tbl">
                            <thead>
                              <tr>
                                <th>Depth</th>
                                <th>0–15cm</th>
                                <th>15–30cm</th>
                                <th>30–45cm</th>
                                <th>Raw N</th>
                                <th>Corr N</th>
                                <th>Soil Type</th>
                                <th>Status</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {bh.intervals.map((item: any, idx: number) => {
                                const isAnomInterval = anomalousIntervalIds.has(item.id);
                                const mod = modSuccessFor(item.id);
                                return (
                                  <tr key={item.id || idx} className={isAnomInterval ? "flagged" : ""}>
                                    <td>{item.fromDepth.toFixed(1)}-{item.toDepth.toFixed(1)}m</td>
                                    <td>{item.blow1 ?? "—"}</td>
                                    <td>{item.blow2 ?? "—"}</td>
                                    <td>{item.blow3 ?? "—"}</td>
                                    <td className={isAnomInterval ? "nv-flag" : "nv"}>
                                      {mod ? `${mod.nValue} (modified)` : item.isRefusal ? "Refusal" : (item.nValue ?? "—")}
                                    </td>
                                    <td>{item.nCorrected ?? "—"}</td>
                                    <td>{item.soilDescription ?? "—"}</td>
                                    <td>
                                      <span className={`pill ${isAnomInterval ? "p-red" : item.isCompleted ? "p-g" : "p-gr"}`}>
                                        {isAnomInterval ? "🚨" : item.isCompleted ? "✓" : "○"}
                                      </span>
                                    </td>
                                    <td>
                                      {isAnomInterval && !mod && (
                                        <button className="btn btn-d btn-sm" onClick={(e) => { e.stopPropagation(); openModPanel(item); }}>
                                          ✏ Modify
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Modification panel for the selected flagged interval */}
                          {bh.intervals.filter((iv: any) => iv.id === modIntervalId).map((iv: any) => (
                            <div key={iv.id} className="border-t border-border pt-3 mt-2">
                              <div className="mod-panel animate-fade-in">
                                <div className="mod-title">✏ Modify — {bh.boreholeCode} · {iv.fromDepth.toFixed(1)}–{iv.toDepth.toFixed(1)}m · N-value</div>
                                <div className="mod-row">
                                  <div className="mod-orig">Original N = {iv.nValue ?? "—"}</div>
                                  <div className="text-rust-d">→</div>
                                  <input
                                    type="number"
                                    className="fi w-[75px] text-center"
                                    value={modNValue}
                                    onChange={(e) => setModNValue(e.target.value)}
                                  />
                                  <div className="mod-new">Corrected N = {modNValue || "—"}</div>
                                </div>
                                <div className="fg mb-2">
                                  <div className="fl">IS Code Reason — Mandatory</div>
                                  <select className="fs" value={selectedClause} onChange={(e) => setSelectedClause(e.target.value)}>
                                    <option value="">— Select IS clause (required) —</option>
                                    {IS_CLAUSES.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="fg mb-3">
                                  <div className="fl">Reason / observation (appended to remarks)</div>
                                  <input
                                    className="fi"
                                    placeholder="e.g. adjacent boreholes show N=10–14 at same depth"
                                    value={modReason}
                                    onChange={(e) => setModReason(e.target.value)}
                                  />
                                </div>
                                {modError && (
                                  <div className="ib ib-r">✗ {modError}</div>
                                )}
                                <div className="btn-row">
                                  <button
                                    onClick={() => handleApplyModification(bh, iv)}
                                    className="btn btn-p btn-sm cursor-pointer"
                                    disabled={!selectedClause || isNaN(parseInt(modNValue, 10)) || modBusy}
                                    title={!selectedClause ? "Select the mandatory IS clause first" : undefined}
                                  >
                                    {modBusy ? "Applying…" : "Apply Modification"}
                                  </button>
                                  <button className="btn btn-w btn-sm" onClick={() => setModIntervalId(null)}>Cancel</button>
                                  <button
                                    onClick={async () => {
                                      const ok = await handleAcceptValid(
                                        iv.id,
                                        `N=${iv.nValue ?? "—"} accepted as valid by engineer review`
                                      );
                                      if (ok) setModIntervalId(null);
                                    }}
                                    className="btn btn-s btn-sm cursor-pointer"
                                    disabled={acceptBusyId === iv.id}
                                    title="Records a persisted APPROVE review for this interval"
                                  >
                                    {acceptBusyId === iv.id ? "Saving…" : `Accept N=${iv.nValue ?? "—"} as Valid`}
                                  </button>
                                </div>
                                {acceptError && acceptError.id === iv.id && (
                                  <div className="ib ib-r mt-2 mb-0">✗ {acceptError.message}</div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Audit lines for modifications applied this session — real user, real timestamp */}
                          {bh.intervals.filter((iv: any) => appliedMods[iv.id]).map((iv: any) => {
                            const mod = appliedMods[iv.id];
                            return (
                              <div key={iv.id} className="p-3 bg-[rgba(59,109,17,.08)] border border-green-d rounded-md text-[10px] text-green-d leading-relaxed font-semibold animate-fade-in mt-2">
                                ✓ Modification saved to server: N={iv.nValue ?? "—"} corrected to N={mod.nValue} under {mod.clause}. Logged by {userName} · {new Date(mod.appliedAt).toLocaleString("en-IN")}.
                              </div>
                            );
                          })}

                          {/* Persisted review history — GET /boreholes/:id/reviews */}
                          <div className="border-t border-border pt-2 mt-3">
                            <div className="text-[10px] font-semibold text-text-ter uppercase mb-1">Review history</div>
                            {bhReviewsLoading[bh.id] ? (
                              <div className="text-[10px] text-text-ter py-1">Loading review history…</div>
                            ) : (bhReviews[bh.id] || []).length === 0 ? (
                              <div className="text-[10px] text-text-ter py-1">No reviews recorded yet for this boring.</div>
                            ) : (
                              (bhReviews[bh.id] || []).map((r: any) => {
                                const tagMatch = /^\[interval:([^\]]+)\]\s*/.exec(r.comments || "");
                                const taggedIv = tagMatch
                                  ? bh.intervals.find((x: any) => x.id === tagMatch[1])
                                  : null;
                                const text = (r.comments || "").replace(/^\[interval:[^\]]+\]\s*/, "");
                                const statusMeta =
                                  r.status === "APPROVED"
                                    ? { icon: "✓", color: "var(--color-green-d)" }
                                    : r.status === "REJECTED"
                                      ? { icon: "✗", color: "#F09595" }
                                      : { icon: "✏", color: "var(--color-amber-d)" };
                                return (
                                  <div key={r.id} className="feed-item">
                                    <span className="text-[10px] shrink-0" style={{ color: statusMeta.color }}>{statusMeta.icon}</span>
                                    <div className="fc">
                                      <div className="ft" style={{ fontSize: "10px" }}>
                                        {r.status}
                                        {taggedIv ? ` · ${taggedIv.fromDepth.toFixed(1)}–${taggedIv.toDepth.toFixed(1)}m` : ""}
                                        {r.isCodeReason ? ` · ${r.isCodeReason}` : ""}
                                      </div>
                                      {text && <div className="fs2">{text}</div>}
                                      <div className="fs2">
                                        By {r.reviewedBy ? `${r.reviewedBy.firstName ?? ""} ${r.reviewedBy.lastName ?? ""}`.trim() || "—" : "—"}
                                      </div>
                                    </div>
                                    <div className="ftime">{fmtDateTime(r.reviewedAt)}</div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🧪 LAB TAB */}
        {activeTab === "lab" && (
          <div className="animate-fade-in">
            {/* Stat row — computed from real samples / lab results */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-green-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Total samples</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{labStats.total}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">All borings</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-blue-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Results entered</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{labStats.entered}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{labStats.total > 0 ? `${Math.round((labStats.entered / labStats.total) * 100)}% complete` : "—"}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-amber-d p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Approaching expiry</div>
                <div className="text-[20px] font-bold font-display" style={{ color: labStats.expiring > 0 ? "#EF9F27" : "var(--color-text-pri)" }}>
                  {labStats.expiring}
                </div>
                <div className="text-[9px] text-text-ter mt-[1px]">Within 3 days</div>
              </div>
              <div className="bg-bg-card border border-border rounded-[7px] border-t-2 border-t-rust-mid p-[10px_12px]">
                <div className="text-[9px] text-text-ter mb-[3px]">Overdue</div>
                <div className="text-[20px] font-bold text-text-pri font-display">{labStats.overdue}</div>
                <div className="text-[9px] text-text-ter mt-[1px]">{labStats.overdue === 0 ? "All within limit" : "Past 14-day window"}</div>
              </div>
            </div>

            {activeNablLab ? (
              <div className="nabl-b mb-3">
                ✓ {activeNablLab.labName} · NABL {activeNablLab.nablCertNumber}
                {activeNablLab.certValidUntil ? ` · Valid until ${new Date(activeNablLab.certValidUntil).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}
                {activeNablLab.isVerified ? " · Verified" : " · Verification pending"}
              </div>
            ) : (
              <div className="ib ib-a shadow-sm">
                ⚠ No NABL lab registered yet — lab result submission is disabled until a NABL-accredited lab is added to the organization.
              </div>
            )}

            {/* Sample Tracking card — real samples across all intervals */}
            <div className="card shadow-sm">
              <div className="card-title">🧪 Sample Tracking</div>
              {allSamples.length === 0 ? (
                <div className="empty-state">
                  <b>No samples collected yet.</b><br />
                  Samples appear here when field teams collect and sync them.
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sample ID</th>
                        <th>Borehole</th>
                        <th>Depth</th>
                        <th>Type</th>
                        <th>Collected</th>
                        <th>Timer (14-day)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSamples.map((s: any) => {
                        const resultIn = s.hasResult || labSavedIds[s.id];
                        const isSelected = selectedSample?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => selectSample(s.id)}
                            className={`cursor-pointer ${isSelected ? "bg-bg-raised font-semibold" : ""}`}
                          >
                            <td className="font-mono text-[9px] text-green-d">{s.sampleNumber || s.id.slice(0, 8)}</td>
                            <td className="font-mono text-[9px] text-amber-d">{s.boreholeCode}</td>
                            <td className="text-text-sec">{fmtNum(parseNum(s.sampleDepth), 1, "m")}</td>
                            <td className="text-text-ter">{s.sampleType ?? "—"}</td>
                            <td className="text-text-ter text-[10px]">{s.collected ? new Date(s.collected).toLocaleDateString("en-IN") : "—"}</td>
                            <td>
                              {resultIn ? (
                                <span className="text-green-d bg-[rgba(59,109,17,.08)] px-2 py-0.5 rounded text-[9px]">✓ Results in</span>
                              ) : s.daysLeft == null ? (
                                <span className="text-text-ter text-[9px]">—</span>
                              ) : s.daysLeft < 0 ? (
                                <span className="text-[#F09595] bg-[rgba(163,45,45,.08)] px-2 py-0.5 rounded text-[9px]">✗ {Math.abs(s.daysLeft)} days overdue</span>
                              ) : s.daysLeft <= 3 ? (
                                <span className="text-amber-d bg-[rgba(186,117,23,.08)] px-2 py-0.5 rounded text-[9px]">⏰ {s.daysLeft} days left</span>
                              ) : (
                                <span className="text-green-d bg-[rgba(59,109,17,.08)] px-2 py-0.5 rounded text-[9px]">✓ {s.daysLeft} days left</span>
                              )}
                            </td>
                            <td><span className={`pill ${resultIn ? "p-g" : "p-a"}`}>{resultIn ? "Complete" : s.status ?? "Pending"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Enter Lab Results card */}
            {allSamples.length === 0 ? null : (
              <div className="card shadow-sm">
                <div className="card-title">
                  <span>🧪 Enter Lab Results — {selectedSample?.sampleNumber || selectedSample?.id?.slice(0, 8) || "—"}</span>
                  <span className="text-text-ter normal-case text-[9px] font-normal">
                    {selectedSample
                      ? `${selectedSample.boreholeCode} · ${fmtNum(parseNum(selectedSample.sampleDepth), 1, "m")} · ${selectedSample.sampleType ?? "—"}`
                      : "Select a sample above"}
                  </span>
                </div>

                {sampleLocked ? (
                  <div className="ib ib-g">
                    ✓ Lab results locked & saved for this sample
                    {selectedSample?.labResult?.reportNumber ? ` · Report ${selectedSample.labResult.reportNumber}` : ""}
                    {selectedSample?.labResult?.testedOn ? ` · Tested ${new Date(selectedSample.labResult.testedOn).toLocaleDateString("en-IN")}` : ""}.
                  </div>
                ) : nablLabs.length === 0 ? (
                  <div className="ib ib-a">⚠ No NABL lab registered yet — submission is disabled.</div>
                ) : (
                  <div className="ib ib-b">
                    ℹ Enter the measured values from the lab machine output. IS code auto-tagged to each test below. Results lock after saving.
                  </div>
                )}

                {labSuccess && <div className="ib ib-g">✓ {labSuccess}</div>}
                {labError && <div className="ib ib-r">✗ {labError}</div>}

                {/* Step 1 */}
                <div className="sl">Step 1 — Grain size analysis (IS 2720 Part 4)</div>
                <div className="grid3 mb-3">
                  <div className="fg">
                    <div className="fl">Silt + Clay % (&lt;0.075mm)</div>
                    <input type="number" className="fi" value={gSiltClay} placeholder="—" onChange={(e) => setGSiltClay(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Fine sand %</div>
                    <input type="number" className="fi" value={gFineSand} placeholder="—" onChange={(e) => setGFineSand(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Medium sand %</div>
                    <input type="number" className="fi" value={gMedSand} placeholder="—" onChange={(e) => setGMedSand(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Coarse sand %</div>
                    <input type="number" className="fi" value={gCoarseSand} placeholder="—" onChange={(e) => setGCoarseSand(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Gravel %</div>
                    <input type="number" className="fi" value={gGravel} placeholder="—" onChange={(e) => setGGravel(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Classification (Auto)</div>
                    <input className="fi font-mono" value={uscsSymbol} placeholder="Auto from entered values" readOnly />
                  </div>
                </div>

                {/* Grain size curve SVG graph — drawn from entered values */}
                <div className="bg-bg-raised border border-border rounded-[7px] p-3 mb-3">
                  <div className="text-[9px] text-text-ter font-semibold uppercase tracking-[0.4px] mb-2">
                    Auto-generated Grain Size Distribution Curve
                  </div>
                  <div className="h-[140px] bg-bg-card rounded border border-border flex items-center justify-center p-2 relative">
                    {!gSiltClay && !gFineSand ? (
                      <div className="text-[10px] text-text-ter">Curve renders once grain-size values are entered</div>
                    ) : (
                      <svg width="100%" height="100%" viewBox="0 0 400 120" className="opacity-90">
                        <line x1="20" y1="10" x2="380" y2="10" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="20" y1="40" x2="380" y2="40" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="20" y1="70" x2="380" y2="70" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="20" y1="100" x2="380" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="20" y1="10" x2="20" y2="100" stroke="#444" strokeWidth="0.5" />
                        <line x1="110" y1="10" x2="110" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                        <line x1="200" y1="10" x2="200" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                        <line x1="290" y1="10" x2="290" y2="100" stroke="#444" strokeWidth="0.5" strokeDasharray="1,2" />
                        <line x1="380" y1="10" x2="380" y2="100" stroke="#444" strokeWidth="0.5" />
                        <path
                          d={`M 20,100 Q 110,${Math.max(100 - num(gSiltClay) * 0.9, 10)} 200,${Math.max(100 - (num(gSiltClay) + num(gFineSand)) * 0.9, 10)} T 380,${Math.max(100 - (num(gSiltClay) + num(gFineSand) + num(gMedSand) + num(gCoarseSand) + num(gGravel)) * 0.9, 10)}`}
                          fill="none"
                          stroke="var(--color-rust-mid)"
                          strokeWidth="2"
                        />
                        <text x="18" y="115" fontSize="7" fill="#6B6966">0.001mm</text>
                        <text x="105" y="115" fontSize="7" fill="#6B6966">0.075mm</text>
                        <text x="195" y="115" fontSize="7" fill="#6B6966">0.425mm</text>
                        <text x="285" y="115" fontSize="7" fill="#6B6966">2.0mm</text>
                        <text x="365" y="115" fontSize="7" fill="#6B6966">4.75mm</text>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="sl">Step 2 — Atterberg limits (IS 2720 Part 5)</div>
                <div className="grid3 mb-3">
                  <div className="fg">
                    <div className="fl">Liquid Limit — LL (%)</div>
                    <input type="number" className="fi" value={liquidLimit} placeholder="—" onChange={(e) => setLiquidLimit(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Plastic Limit — PL (%)</div>
                    <input type="number" className="fi" value={plasticLimit} placeholder="—" onChange={(e) => setPlasticLimit(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Plasticity Index — PI (Auto)</div>
                    <input className="fi font-mono" value={liquidLimit || plasticLimit ? plasticityIndex : ""} placeholder="Auto" readOnly />
                  </div>
                </div>
                {(liquidLimit || plasticLimit) && (
                  <div className="bg-bg-raised rounded-md p-2 mb-3 flex items-center justify-between border border-border">
                    <span className={`text-[10px] font-semibold ${isPlastic ? "text-green-d" : "text-amber-d"}`}>
                      {isPlastic ? "✓ Plastic soil — LL/PL recorded" : "○ Non-plastic (NP) soil layer"}
                    </span>
                    <span className="text-[8px] text-text-ter">Auto-classifies into plasticity charts</span>
                  </div>
                )}

                {/* Step 3 */}
                <div className="sl">Step 3 — Density + physical properties (IS 2720 Part 2 &amp; 3)</div>
                <div className="grid3 mb-3">
                  <div className="fg">
                    <div className="fl">Bulk Density (g/cc)</div>
                    <input type="number" className="fi" step="0.01" value={bulkDensity} placeholder="—" onChange={(e) => setBulkDensity(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Natural moisture content (%)</div>
                    <input type="number" className="fi" step="0.1" value={moistureContent} placeholder="—" onChange={(e) => setMoistureContent(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Dry Density — dry (g/cc)</div>
                    <input className="fi font-mono" value={dryDensity > 0 ? dryDensity : ""} placeholder="Auto" readOnly />
                  </div>
                  <div className="fg">
                    <div className="fl">Specific gravity (Gs)</div>
                    <input type="number" className="fi" step="0.01" value={specificGravity} placeholder="—" onChange={(e) => setSpecificGravity(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Void ratio — e (Auto)</div>
                    <input className="fi font-mono" value={voidRatio > 0 ? voidRatio : ""} placeholder="Auto" readOnly />
                  </div>
                  <div className="fg">
                    <div className="fl">Porosity — n % (Auto)</div>
                    <input className="fi font-mono" value={porosity > 0 ? porosity : ""} placeholder="Auto" readOnly />
                  </div>
                </div>

                {/* Step 4 */}
                <div className="sl">Step 4 — Shear strength (Triaxial UU / Consolidated CU / DST CD)</div>
                <div className="grid3 mb-3">
                  <div className="p-3 bg-green-900/5 border border-green-900/15 rounded-md">
                    <div className="text-[9px] font-semibold text-green-600 mb-1.5 uppercase">UU — Unconsolidated Undrained (IS 2720 Pt 11)</div>
                    <div className="flex gap-2">
                      <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={uuC} placeholder="—" onChange={(e) => setUuC(e.target.value)} disabled={sampleLocked} /></div>
                      <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={uuPhi} placeholder="—" onChange={(e) => setUuPhi(e.target.value)} disabled={sampleLocked} /></div>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-900/5 border border-amber-900/15 rounded-md">
                    <div className="text-[9px] font-semibold text-amber-600 mb-1.5 uppercase">CU — Consolidated Undrained (IS 2720 Pt 12)</div>
                    <div className="flex gap-2">
                      <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={cuC} placeholder="—" onChange={(e) => setCuC(e.target.value)} disabled={sampleLocked} /></div>
                      <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={cuPhi} placeholder="—" onChange={(e) => setCuPhi(e.target.value)} disabled={sampleLocked} /></div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-900/5 border border-blue-900/15 rounded-md">
                    <div className="text-[9px] font-semibold text-blue-600 mb-1.5 uppercase">CD — Consolidated Drained (IS 2720 Pt 13)</div>
                    <div className="flex gap-2">
                      <div className="fg flex-1"><span className="fl">c (kg/cm²)</span><input className="fi py-1 px-2 text-[10px]" type="number" step="0.01" value={cdC} placeholder="—" onChange={(e) => setCdC(e.target.value)} disabled={sampleLocked} /></div>
                      <div className="fg flex-1"><span className="fl">φ (deg)</span><input className="fi py-1 px-2 text-[10px]" type="number" value={cdPhi} placeholder="—" onChange={(e) => setCdPhi(e.target.value)} disabled={sampleLocked} /></div>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="sl">Step 5 — Consolidation (IS 2720 Part 15)</div>
                <div className="grid4 mb-3">
                  <div className="fg">
                    <div className="fl">Cc — Compression Index</div>
                    <input className="fi" type="number" step="0.01" value={cc} placeholder="—" onChange={(e) => setCc(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Cv (cm²/sec)</div>
                    <input className="fi" type="number" step="0.0001" value={cv} placeholder="—" onChange={(e) => setCv(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">mv (cm²/kg)</div>
                    <input className="fi" type="number" step="0.00001" value={mv} placeholder="—" onChange={(e) => setMv(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Pre-Consol. Pc (kg/cm²)</div>
                    <input className="fi" type="number" step="0.1" value={pc} placeholder="—" onChange={(e) => setPc(e.target.value)} disabled={sampleLocked} />
                  </div>
                </div>

                {/* Step 6 */}
                <div className="sl">Step 6 — Rock tests (IS 9143)</div>
                <div className="grid3 mb-3">
                  <div className="fg">
                    <div className="fl">UCS Strength (MPa)</div>
                    <input className="fi" type="number" value={ucs} placeholder="N/A — soil layer" onChange={(e) => setUcs(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Point Load Index Is(50) (MPa)</div>
                    <input className="fi" type="number" step="0.1" value={pointLoad} placeholder="N/A — soil layer" onChange={(e) => setPointLoad(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Rock Classification</div>
                    <input className="fi" value={rockClass} placeholder="N/A — soil layer" onChange={(e) => setRockClass(e.target.value)} disabled={sampleLocked} />
                  </div>
                </div>

                {/* Step 7 */}
                <div className="sl">Step 7 — Chemical Analysis (IS 2720 Part 22-27)</div>
                <div className="grid4 mb-3">
                  <div className="fg">
                    <div className="fl">pH Value</div>
                    <input className="fi" type="number" step="0.1" value={ph} placeholder="—" onChange={(e) => setPh(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Sulphates SO3 (%)</div>
                    <input className="fi" type="number" step="0.01" value={sulphates} placeholder="—" onChange={(e) => setSulphates(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Chlorides Cl (%)</div>
                    <input className="fi" type="number" step="0.01" value={chlorides} placeholder="—" onChange={(e) => setChlorides(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Organic matter (%)</div>
                    <input className="fi" type="number" step="0.1" value={organic} placeholder="—" onChange={(e) => setOrganic(e.target.value)} disabled={sampleLocked} />
                  </div>
                </div>

                {/* Submission details */}
                <div className="sl">Submission — NABL lab, report reference &amp; scan</div>
                <div className="grid3 mb-3">
                  <div className="fg">
                    <div className="fl">NABL Lab — Mandatory</div>
                    {nablLabs.length === 0 ? (
                      <input className="fi" value="No NABL lab registered yet" readOnly />
                    ) : (
                      <select className="fs" value={selectedLabId} onChange={(e) => setSelectedLabId(e.target.value)} disabled={sampleLocked}>
                        {nablLabs.map((lab: any) => (
                          <option key={lab.id} value={lab.id}>{lab.labName} — NABL {lab.nablCertNumber}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="fg">
                    <div className="fl">Lab Report Number — Mandatory</div>
                    <input className="fi" value={reportNumber} placeholder="e.g. GC/2026/0147" onChange={(e) => setReportNumber(e.target.value)} disabled={sampleLocked} />
                  </div>
                  <div className="fg">
                    <div className="fl">Report PDF URL — Mandatory</div>
                    <input className="fi" value={reportPdfUrl} placeholder="Link to scanned machine output" onChange={(e) => setReportPdfUrl(e.target.value)} disabled={sampleLocked} />
                    <div className="text-[8px] text-text-ter">Direct file upload is coming soon — paste a link to the scanned report for now.</div>
                  </div>
                </div>

                {/* Save buttons */}
                <div className="btn-row justify-end mt-4">
                  <button className="btn btn-w" disabled title="Coming soon — drafts are not stored on the server yet">Save Draft</button>
                  <button
                    onClick={handleLabSave}
                    className="btn btn-p flex items-center gap-1 cursor-pointer"
                    disabled={!canSubmitLab}
                    title={
                      sampleLocked
                        ? "Results already locked for this sample"
                        : nablLabs.length === 0
                          ? "No NABL lab registered yet"
                          : !reportNumber.trim() || !reportPdfUrl.trim()
                            ? "Lab report number and PDF URL are mandatory"
                            : undefined
                    }
                  >
                    <RiLock2Line /> {labBusy ? "Saving…" : sampleLocked ? "Locked & Saved" : "Lock & Save Results"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📄 REPORT TAB */}
        {activeTab === "report" && (
          <div className="animate-fade-in">
            <div className={`ib ${stats.total === 0 ? "ib-a" : "ib-g"} shadow-sm`}>
              {stats.total === 0
                ? "⚠ No boreholes yet — the report compiles automatically once field data is synced."
                : `✓ ${stats.completed} completed · ${stats.active} in progress · ${stats.pending} planned. Report preview compiles data from completed borings.`}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Generate Report parameters */}
              <div className="card shadow-sm">
                <div className="card-title">📄 Generate Report</div>
                <div className="fg mb-2">
                  <div className="fl">Scope</div>
                  <select className="fs">
                    <option>Completed borings ({stats.completed})</option>
                    <option>Full project ({stats.total} borings)</option>
                  </select>
                </div>
                <div className="fg mb-3">
                  <div className="fl">Format</div>
                  <select className="fs">
                    <option>IS 1892 — NHAI submission</option>
                    <option>IRC 78 — Bridge foundation</option>
                    <option>RDSO — Railway format</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 text-[10px] text-text-sec mb-3">
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure I — Borehole Location Map (GPS)</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure II — IS 1892 boring log sheets</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure III — Material characteristic table</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure IV — Grain size curves</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure V — Shear Strength Envelope curves</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure VI — Settlement &amp; Pile capacity</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Fig. N — SPT N-value vs depth graph (per BH)</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> Annexure C — Liquefaction assessment (CSR/CRR, IS 1893)</label>
                </div>
                <div className="border-t border-border pt-2 mb-3">
                  <div className="text-[9px] font-semibold text-text-ter uppercase mb-1">Settlement &amp; Failure criteria</div>
                  <div className="grid3">
                    <div className="fg">
                      <div className="fl">Allowable (mm)</div>
                      <input
                        type="number"
                        className="fi"
                        value={allowableSettlement}
                        onChange={(e) => setAllowableSettlement(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="fg">
                      <div className="fl">Rigidity Factor</div>
                      <input
                        type="number"
                        step="0.05"
                        className="fi"
                        value={rigidityFactor}
                        onChange={(e) => setRigidityFactor(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="fg">
                      <div className="fl">Shear failure mode</div>
                      <select className="fs" value={shearFailureMode} onChange={(e) => setShearFailureMode(e.target.value)}>
                        <option>General shear failure</option>
                        <option>Local shear failure</option>
                        <option>Punching shear failure</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="dl-btn flex-1 flex justify-center items-center gap-1 py-2 bg-rust-mid text-white rounded cursor-pointer text-[11px] disabled:opacity-45 disabled:cursor-not-allowed"
                    onClick={() => setReportGenerated(true)}
                    disabled={stats.total === 0}
                    title={stats.total === 0 ? "No borehole data to compile yet" : "Renders an on-screen preview from synced field data — PDF export is coming soon"}
                  >
                    <RiDownloadLine /> Generate Report Preview
                  </button>
                  {/* Real file downloads via the authenticated export proxy (REPORT_VIEW) */}
                  {reportBh ? (
                    <>
                      <a
                        href={`/api/boreholes/${reportBh.id}/export?format=csv`}
                        className="flex-1 flex justify-center items-center gap-1 py-2 border border-border-mid rounded text-text-sec text-[11px] bg-transparent no-underline cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all"
                        title={`Download ${reportBh.boreholeCode} field data as CSV`}
                      >
                        <RiDownloadLine /> Export CSV
                      </a>
                      <a
                        href={`/api/boreholes/${reportBh.id}/export?format=json`}
                        className="flex-1 flex justify-center items-center gap-1 py-2 border border-border-mid rounded text-text-sec text-[11px] bg-transparent no-underline cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all"
                        title={`Download ${reportBh.boreholeCode} field data as JSON`}
                      >
                        <RiDownloadLine /> Export JSON
                      </a>
                    </>
                  ) : (
                    <button
                      className="flex-1 flex justify-center items-center gap-1 py-2 border border-border-mid rounded text-text-sec text-[11px] bg-transparent disabled:opacity-45 disabled:cursor-not-allowed"
                      disabled
                      title="No borehole data to export yet"
                    >
                      Export Data
                    </button>
                  )}
                </div>
              </div>

              {/* Pile capacity annexure — requires lab results that don't exist yet */}
              <div className="card shadow-sm flex flex-col justify-between">
                <div>
                  <div className="card-title">🚧 Pile Capacity — Annexure VI</div>
                  <div className="empty-state mb-2">
                    <b>Requires lab results.</b><br />
                    Pile capacities (IS 2911 Pt 1 Sec 2) are computed from laboratory shear parameters (c, φ) and
                    densities. {labStats.entered > 0
                      ? "Lab results are being collected — the capacity calculation module is coming soon."
                      : "No lab results have been submitted yet — submit them from the Lab tab."}
                  </div>
                  <div className="text-[9px] text-text-ter leading-relaxed">
                    Safe pile load values will include skin friction and end bearing, per IS 2911 static formula.
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-p flex-1 py-1.5" disabled title="Coming soon — requires lab results">Add Pile Dia</button>
                  <button className="btn btn-w flex-1 py-1.5" disabled title="Coming soon — requires lab results">Recalculate Capacities</button>
                </div>
              </div>
            </div>

            {/* Liquefaction assessment & Graph */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Liquefaction card */}
              <div className="card shadow-sm">
                <div className="card-title">
                  <span>⚡ Liquefaction Assessment — IS 1893</span>
                  {mappedBoreholes.length > 0 && (
                    <select
                      className="bv-select font-mono text-[9px] py-0.5"
                      value={reportBh?.id ?? ""}
                      onChange={(e) => setSelectedReportBhId(e.target.value)}
                    >
                      {mappedBoreholes.map((bh: any) => (
                        <option key={bh.id} value={bh.id}>{bh.boreholeCode}</option>
                      ))}
                    </select>
                  )}
                </div>
                {!reportBh ? (
                  <div className="empty-state"><b>No boreholes yet.</b><br />Liquefaction assessment runs on synced SPT data.</div>
                ) : (
                  <>
                    <div className="ib ib-b py-2 mb-2">
                      {seismicZone} · PGA {pga}g · EQ Mw {earthquakeMag} · {reportBh.boreholeCode}
                    </div>
                    {liquefactionData.length === 0 ? (
                      <div className="empty-state">
                        <b>No SPT intervals with N-values yet.</b><br />
                        The CSR/CRR table appears when field teams sync SPT data.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border rounded">
                        <table className="dt">
                          <thead>
                            <tr>
                              <th>Depth</th>
                              <th>N1(60)</th>
                              <th>CSR</th>
                              <th>CRR</th>
                              <th>FS</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liquefactionData.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td>{item.depth}</td>
                                <td>{item.n160}</td>
                                <td>{item.csr}</td>
                                <td>{item.crr}</td>
                                <td className={`font-bold ${item.status === "Liquefiable" ? "text-red-500" : "text-green-d"}`}>
                                  {item.fs}
                                </td>
                                <td>
                                  <span className={`pill ${item.status === "Liquefiable" ? "p-red" : "p-g"}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="text-[8px] text-text-ter mt-2">Simplified CSR/CRR estimate from corrected N — refine with lab densities once available. FS &lt; 1.0 = liquefiable.</div>
                    <div className="btn-row justify-end mt-2">
                      <a
                        className="btn btn-w btn-sm no-underline"
                        href={`/api/boreholes/${reportBh.id}/export?format=csv`}
                        title={`Download ${reportBh.boreholeCode} field data as CSV`}
                      >
                        Export CSV
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* SPT N vs Depth Graph — real intervals, scaled axes */}
              <div className="card shadow-sm">
                <div className="card-title">📈 SPT N-value vs Depth {reportBh ? `— ${reportBh.boreholeCode}` : ""}</div>
                <div className="bg-bg-raised border border-border rounded-[7px] p-3">
                  <div className="h-[150px] bg-bg-card rounded border border-border flex items-center justify-center p-2 relative">
                    {!sptGraph ? (
                      <div className="text-[10px] text-text-ter text-center leading-relaxed">
                        No SPT intervals recorded yet —<br />the graph plots when field teams sync.
                      </div>
                    ) : (
                      <svg width="100%" height="100%" viewBox="0 0 300 120">
                        {/* vertical N gridlines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                          <g key={f}>
                            <line x1={30 + f * 240} y1="10" x2={30 + f * 240} y2="110" stroke="#444" strokeWidth="0.5" strokeDasharray={f === 0 || f === 1 ? undefined : "1,2"} />
                            <text x={26 + f * 240} y="118" fontSize="7" fill="#6B6966">{Math.round(f * sptGraph.maxN)}</text>
                          </g>
                        ))}
                        {/* horizontal depth gridlines */}
                        {[0, 1 / 3, 2 / 3, 1].map((f) => (
                          <g key={f}>
                            <line x1="30" y1={10 + f * 100} x2="270" y2={10 + f * 100} stroke="#444" strokeWidth="0.5" strokeDasharray="2,2" />
                            <text x="2" y={14 + f * 100} fontSize="6" fill="#888">{(f * sptGraph.maxD).toFixed(1)}m</text>
                          </g>
                        ))}
                        <path d={sptGraph.path} fill="none" stroke="var(--color-rust-mid)" strokeWidth="1.5" />
                        {sptGraph.pts.map((p: any, i: number) => (
                          <circle key={i} cx={sptGraph.x(p.n)} cy={sptGraph.y(p.depth)} r="2.5" fill="var(--color-rust-mid)" />
                        ))}
                      </svg>
                    )}
                  </div>
                  {sptGraph && (
                    <div className="flex gap-4 mt-2 text-[9px] text-text-ter justify-center">
                      <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rust-mid inline-block" /> {reportBh.boreholeCode} N (corrected where available)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tamper Certificate Card — real SHA-256 chain verification (GET /boreholes/:id/integrity) */}
            <div className="card shadow-sm">
              <div className="card-title flex justify-between items-center">
                <span>🛡️ Groundlense Tamper-Evident Certificate{reportBh ? ` — ${reportBh.boreholeCode}` : ""}</span>
                <button
                  className="btn btn-s btn-sm"
                  disabled={!integrity || !integrity.valid || integrity.intervalCount === 0}
                  onClick={() => setCertVisible(true)}
                  title={
                    !reportBh
                      ? "No borehole selected"
                      : integrityLoading
                        ? "Verifying SHA-256 hash chain…"
                        : !integrity
                          ? "Integrity could not be verified"
                          : integrity.intervalCount === 0
                            ? "No SPT intervals to certify yet"
                            : !integrity.valid
                              ? "Chain verification failed — certificate unavailable"
                              : "Issue the certificate from the verified hash chain"
                  }
                >
                  Generate Certificate
                </button>
              </div>

              {!reportBh ? (
                <div className="empty-state">
                  <b>No boreholes yet.</b><br />
                  Integrity verification runs once field data is synced.
                </div>
              ) : integrityLoading ? (
                <div className="rp-cert">
                  <div className="rp-cert-t flex items-center gap-1">
                    <RiShieldCheckLine className="text-text-ter" /> Verifying SHA-256 hash chain…
                  </div>
                  <div className="rp-cert-h">Recomputing interval and water-table hashes against stored field values.</div>
                </div>
              ) : !integrity ? (
                <div className="rp-cert">
                  <div className="rp-cert-t flex items-center gap-1">
                    <RiShieldCheckLine className="text-text-ter" /> Integrity could not be verified
                  </div>
                  <div className="rp-cert-h">
                    The verification request failed — it requires REPORT_VIEW permission and a reachable server. Reload to retry.
                  </div>
                </div>
              ) : (
                <>
                  <div className="rp-cert">
                    <div
                      className="rp-cert-t flex items-center gap-1"
                      style={{
                        color:
                          integrity.intervalCount === 0
                            ? "var(--color-text-sec)"
                            : integrity.valid
                              ? "var(--color-green-d)"
                              : "#F09595",
                      }}
                    >
                      <RiShieldCheckLine />
                      {integrity.intervalCount === 0
                        ? "No SPT intervals to verify yet — the chain starts with the first synced entry"
                        : integrity.valid
                          ? "SHA-256 chain intact — no tampering detected"
                          : `Chain verification FAILED at interval${integrity.brokenAt.length === 1 ? "" : "s"} ${integrity.brokenAt.join(", ")}`}
                    </div>
                    <div className="dr"><span className="dr-l">Intervals verified</span><span className="dr-v">{integrity.intervalCount}</span></div>
                    <div className="dr">
                      <span className="dr-l">Unhashed intervals</span>
                      <span className={`dr-v ${integrity.unhashed > 0 ? "warn" : "ok"}`}>{integrity.unhashed}</span>
                    </div>
                    <div className="dr">
                      <span className="dr-l">Water-table records</span>
                      <span className={`dr-v ${integrity.waterTable.invalid > 0 ? "warn" : ""}`}>
                        {integrity.waterTable.total} total · {integrity.waterTable.invalid} invalid · {integrity.waterTable.unhashed} unhashed
                      </span>
                    </div>
                    <div className="dr">
                      <span className="dr-l">Chain root (SHA-256)</span>
                      <span className="dr-v font-mono text-[9px]" title={integrity.chainRoot ?? undefined}>
                        {integrity.chainRoot ? `${integrity.chainRoot.slice(0, 12)}…${integrity.chainRoot.slice(-8)}` : "—"}
                      </span>
                    </div>
                  </div>

                  {integrity.unhashed > 0 && (
                    <div className="ib ib-a mt-2 mb-0">
                      ⚠ {integrity.unhashed} interval{integrity.unhashed === 1 ? " is" : "s are"} not hash-sealed yet (synced
                      before hashing was enabled) — {integrity.unhashed === 1 ? "it is" : "they are"} excluded from the
                      cryptographic guarantee.
                    </div>
                  )}

                  {certVisible && integrity.valid && integrity.intervalCount > 0 && (
                    <div className="rp-cert mt-2 animate-fade-in" style={{ borderColor: "rgba(59,109,17,.45)", background: "rgba(59,109,17,.06)" }}>
                      <div className="rp-cert-t" style={{ color: "var(--color-green-d)" }}>
                        ✓ Groundlense Tamper-Evident Certificate · {reportBh.boreholeCode} · {proj?.projectCode ?? "—"}
                      </div>
                      <div className="rp-cert-h font-mono break-all">SHA-256 chain root: {integrity.chainRoot ?? "—"}</div>
                      <div className="rp-cert-h">
                        {integrity.intervalCount} SPT interval{integrity.intervalCount === 1 ? "" : "s"} verified live against the
                        server hash chain · Issued {new Date().toLocaleString("en-IN")} · Any retroactive edit to raw field data
                        breaks this chain.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Report Preview card — compiled from real data */}
            {reportGenerated && (
              <div className="report-preview-box animate-fade-in shadow-xl">
                <div className="rp-header">
                  <div className="rp-title">Geotechnical Investigation Report</div>
                  <div className="font-semibold text-[11px] text-[#333333] tracking-[0.5px] uppercase mt-1">IS 1892 Standard Boring Logs Summary — Preview</div>
                  <div className="rp-subtitle">Draft preview · Compiled {new Date().toLocaleDateString("en-IN")}</div>
                </div>

                <div className="text-[10px] text-[#222] leading-relaxed mb-4">
                  <span className="font-bold">Project Name: </span> {proj?.name ?? "—"} <br />
                  <span className="font-bold">Client Authority: </span> {proj?.initiatedByCompany?.name ?? "—"} <br />
                  <span className="font-bold">EPC Contractor: </span> {proj?.epcOrganization?.name ?? "—"} <br />
                  <span className="font-bold">Assigned NABL Laboratory: </span>{" "}
                  {activeNablLab ? `${activeNablLab.labName} (Accreditation No: ${activeNablLab.nablCertNumber})` : "No NABL lab registered yet"}
                </div>

                <div className="font-bold text-[9px] uppercase tracking-[0.5px] text-[#1A1918] mb-1">1.0 Boring Locations Summary Table</div>
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Borehole ID</th>
                      <th>Sub-structure</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>RL (m)</th>
                      <th>Water Table</th>
                      <th>Final Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedBoreholes.filter((b: any) => b.status === "COMPLETED").length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#6B6966" }}>No completed borings yet — rows appear once borings are closed.</td>
                      </tr>
                    ) : (
                      mappedBoreholes.filter((b: any) => b.status === "COMPLETED").map((bh: any) => (
                        <tr key={bh.id}>
                          <td className="font-mono">{bh.boreholeCode}</td>
                          <td>{bh.name}</td>
                          <td>{bh.latitude ?? "—"}</td>
                          <td>{bh.longitude ?? "—"}</td>
                          <td>{fmtNum(bh.groundLevelRL, 3)}</td>
                          <td>{fmtNum(bh.waterTable, 2, "m")}</td>
                          <td>{fmtNum(bh.finalDepth, 1, "m")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="font-bold text-[9px] uppercase tracking-[0.5px] text-[#1A1918] mt-4 mb-1">2.0 SPT Resistance Profiles</div>
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Borehole</th>
                      <th>Depth (m)</th>
                      <th>Soil Strata Description</th>
                      <th>Raw N-value</th>
                      <th>Corrected N-value</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = mappedBoreholes
                        .filter((b: any) => b.status === "COMPLETED")
                        .flatMap((bh: any) =>
                          bh.intervals.map((iv: any) => ({ bh, iv }))
                        );
                      if (rows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "#6B6966" }}>
                              No SPT intervals recorded yet — data appears when field teams sync.
                            </td>
                          </tr>
                        );
                      }
                      return rows.slice(0, 20).map(({ bh, iv }: any) => (
                        <tr key={iv.id}>
                          <td className="font-mono">{bh.boreholeCode}</td>
                          <td>{iv.fromDepth.toFixed(1)}-{iv.toDepth.toFixed(1)}m</td>
                          <td>{iv.soilDescription ?? "—"}</td>
                          <td>{iv.isRefusal ? "Refusal" : (effectiveN(iv) ?? "—")}</td>
                          <td>{iv.nCorrected ?? "—"}</td>
                          <td>{appliedMods[iv.id]?.remarks ?? iv.remarks ?? "—"}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>

                <div className="text-[8px] text-[#6B6966] italic mt-4 border-t border-dashed pt-2">
                  Draft preview compiled on the GroundLense platform from field-synced data. Raw SPT entries are
                  chained with SHA-256 hashes — verify and issue the tamper-evident certificate from the card above.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIVITY LOG SLIDE-IN PANEL (Setup tab "View log") */}
      {logPanelUser && (
        <div className="log-panel">
          <div className="logp-header">
            <div>
              <div className="font-mono text-[9px] text-amber-d">{logPanelUser.code || "—"}</div>
              <div className="logp-title">{logPanelUser.name} — Activity Log</div>
            </div>
            <button className="logp-close" onClick={() => setLogPanelUser(null)} aria-label="Close">
              <RiCloseLine />
            </button>
          </div>
          <div className="logp-body">
            {logLoading ? (
              <div className="text-[10px] text-text-ter py-6 text-center">Loading activity…</div>
            ) : !logEntries || logEntries.length === 0 ? (
              <div className="empty-state">
                <b>No activity recorded yet.</b><br />
                Entries appear here once this member performs actions in the system.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-bg-card rounded-md p-2 text-center">
                    <div className="text-[18px] font-bold text-text-pri">{logEntries.length}</div>
                    <div className="text-[9px] text-text-ter">Logged entries</div>
                  </div>
                  <div className="bg-bg-card rounded-md p-2 text-center">
                    <div className="text-[18px] font-bold text-text-pri">{timeAgo(logEntries[0]?.createdAt)}</div>
                    <div className="text-[9px] text-text-ter">Last active</div>
                  </div>
                </div>
                <div className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.5px] mb-2">Activity Timeline</div>
                {logEntries.map((entry: any, i: number) => (
                  <div key={entry.id || i} className="log-entry">
                    <div className="log-dot" />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="log-action">{entry.action}</div>
                      <div className="log-detail">{entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ""}</div>
                    </div>
                    <div className="log-time">{fmtDateTime(entry.createdAt)}</div>
                  </div>
                ))}
              </>
            )}
            <div className="text-[8px] text-text-ter mt-4 border-t border-border pt-2 leading-relaxed">
              Handover and device-binding information is not recorded by the API yet.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
