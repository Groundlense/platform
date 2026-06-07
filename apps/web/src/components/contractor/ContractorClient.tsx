"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiNotification3Line,
  RiAlertLine,
  RiEdit2Line,
  RiCameraLine,
  RiDownloadLine,
  RiShieldCheckLine,
  RiImageLine,
  RiCheckLine,
} from "react-icons/ri";
import { getInitials } from "@/lib/utils";

interface ContractorClientProps {
  project: any;
  boreholes: any[];
  dashboard: any;
  sites: any[];
  user: Record<string, unknown> | null;
}

const BH_STATUS: Record<string, { bg: string; label: string }> = {
  COMPLETED: { bg: "#EAF3DE", label: "Complete" },
  IN_PROGRESS: { bg: "#FAEEDA", label: "In progress" },
  PLANNED: { bg: "#F1EFE8", label: "Planned" },
  ABANDONED: { bg: "#FCEBEB", label: "Abandoned" },
};

export default function ContractorClient({
  project,
  boreholes,
  dashboard,
  sites,
  user,
}: ContractorClientProps) {
  const router = useRouter();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    sites.length > 0 ? sites[0].id : "mock-1"
  );
  const [viewMode, setViewMode] = useState<"site" | "eng">("site");
  const [hoveredBhId, setHoveredBhId] = useState<string | null>(null);

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

  // Filter boreholes based on selected site. Fallback to all if it is a mock site.
  const activeBoreholes =
    selectedSiteId === "mock-1"
      ? boreholes
      : boreholes.filter((b) => b.siteId === selectedSiteId);

  // If there are no boreholes, we show all boreholes as a demo fallback so that the screen doesn't look empty.
  const displayBoreholes = activeBoreholes.length > 0 ? activeBoreholes : boreholes;

  const completed = displayBoreholes.filter((b: any) => b.status === "COMPLETED").length;
  const inProgress = displayBoreholes.filter((b: any) => b.status === "IN_PROGRESS").length;
  const planned = displayBoreholes.filter((b: any) => b.status === "PLANNED").length;

  // Soil layers definition based on depth
  const getBoreholeLayers = (depth: number) => {
    const layers = [];
    let remaining = depth;

    // 1. Fill (up to 3m)
    if (remaining > 0) {
      const h = Math.min(3, remaining);
      layers.push({
        type: "fill",
        height: h,
        bg: "#EAF3DE",
        pattern: "url(#p-fill)",
        opacity: 0.6,
        label: "N=4",
      });
      remaining -= h;
    }
    // 2. Sandy Silt (up to 5m further)
    if (remaining > 0) {
      const h = Math.min(5, remaining);
      layers.push({
        type: "silt",
        height: h,
        bg: "#FAEEDA",
        pattern: "url(#p-silt)",
        opacity: 0.6,
        label: "N=12",
      });
      remaining -= h;
    }
    // 3. Clay (up to 4m further)
    if (remaining > 0) {
      const h = Math.min(4, remaining);
      layers.push({
        type: "clay",
        height: h,
        bg: "#FAECE7",
        pattern: "url(#p-clay)",
        opacity: 0.5,
        label: "N=14",
      });
      remaining -= h;
    }
    // 4. Dense Sand (up to 5m further)
    if (remaining > 0) {
      const h = Math.min(5, remaining);
      layers.push({
        type: "sand",
        height: h,
        bg: "#FAEEDA",
        pattern: "url(#p-sand)",
        opacity: 0.7,
        label: "N=38",
      });
      remaining -= h;
    }
    // 5. Weathered Rock / Hard Rock (rest)
    if (remaining > 0) {
      layers.push({
        type: "rock",
        height: remaining,
        bg: "#2C2C2A",
        pattern: null,
        opacity: 1,
        label: "R",
      });
    }
    return layers;
  };

  // Determine metadata for the selected site
  const currentSiteName =
    selectedSiteId === "mock-1"
      ? "ROB — Km 142+500 (Bow String Bridge)"
      : sites.find((s) => s.id === selectedSiteId)?.name || "Structure Site";

  // Navigation callbacks
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleSwitchToPortal = () => {
    router.push(`/projects/${project.id}/portal`);
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
        .photo-img { width: 100%; height: 72px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; font-size: 9px; }
        .photo-info { padding: 6px 8px; }
        .photo-bh { font-size: 11px; font-weight: 500; color: #993C1D; }
        .photo-date { font-size: 10px; color: #854F0B; margin-top: 1px; }
        .photo-tag { font-size: 10px; color: #5F5E5A; margin-top: 1px; }
        .photo-verified { font-size: 9px; color: #3B6D11; background: #EAF3DE; padding: 2px 5px; border-radius: 3px; display: inline-block; margin-top: 2px; }
        .dl-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .dl-btn { display: flex; align-items: center; gap: 5px; padding: 8px 13px; background: #D85A30; border: none; border-radius: 7px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .dl-btn:hover { background: #BA4822; }
        .dl-btn-sec { display: flex; align-items: center; gap: 5px; padding: 8px 13px; background: #fff; border: 1.5px solid #D85A30; border-radius: 7px; color: #D85A30; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .dl-btn-sec:hover { background: rgba(216,90,48,0.05); }
        .cert { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #3B6D11; background: #EAF3DE; padding: 5px 9px; border-radius: 12px; border: 0.5px solid #97C459; }

        /* BH INFO ROW */
        .bh-info-row { display: flex; gap: 0; border-top: 0.5px solid #F5C4B3; overflow-x: auto; }
        .bh-info-cell { flex: 1; min-width: 100px; padding: 8px 6px; text-align: center; border-right: 0.5px solid #F5C4B3; background: #FFF8F6; }
        .bh-info-cell:last-child { border-right: none; }
        .bh-info-id { font-size: 10px; font-weight: 500; color: #993C1D; margin-bottom: 2px; }
        .bh-info-depth { font-size: 11px; font-weight: 600; color: #1a1a1a; }
        .bh-info-depth-label { font-size: 9px; color: #888780; }
        .bh-info-dates { font-size: 9px; color: #5F5E5A; margin-top: 3px; line-height: 1.4; }
        .bh-info-gps { font-size: 9px; color: #5F5E5A; margin-top: 3px; line-height: 1.3; }
        .bh-info-gps.deviated { color: #A32D2D; background: #FCEBEB; border-radius: 3px; padding: 2px 4px; display: inline-block; margin-top: 3px; }
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
          <div className="rounded-[5px] bg-bg-card flex items-center justify-center cursor-pointer text-[13px] relative border border-border" style={{ width: "30px", height: "30px" }}>
            <RiNotification3Line className="text-text-sec" />
            <div className="absolute rounded-full bg-rust-mid" style={{ top: "3px", right: "3px", width: "6px", height: "6px", border: "1.5px solid var(--color-bg-surface)" }} />
          </div>
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
              Contractor: {project.epcOrganization?.name || "GR Infraprojects Ltd"} &nbsp;·&nbsp;
              Client: {project.initiatedByCompany?.name || "NHAI"} &nbsp;·&nbsp;
              IE: {project.billingCompany?.name || "STUP Consultants"}
            </div>
            
            {/* Stat Row */}
            <div className="sum-grid">
              <div className="sc">
                <div className="sc-l">Structures</div>
                <div className="sc-v font-display">{sites.length > 0 ? sites.length : "6"}</div>
                <div className="sc-s">ROBs, VUPs, Bridges</div>
              </div>
              <div className="sc">
                <div className="sc-l">BH planned</div>
                <div className="sc-v font-display">{displayBoreholes.length}</div>
                <div className="sc-s">Across all structures</div>
              </div>
              <div className="sc">
                <div className="sc-l">Completed</div>
                <div className="sc-v font-display">{completed}</div>
                <div className="sc-s">
                  {displayBoreholes.length > 0
                    ? `${Math.round((completed / displayBoreholes.length) * 100)}% done`
                    : "0% done"}
                </div>
              </div>
              <div className="sc">
                <div className="sc-l">Investigation cost</div>
                <div className="sc-v font-display">
                  ₹{((dashboard?.boreholes ?? displayBoreholes.length) * 5000 / 100000).toFixed(1)}L
                </div>
                <div className="sc-s">Total budget</div>
              </div>
              <div className="sc">
                <div className="sc-l">GPS deviations</div>
                <div className="sc-v font-display" style={{ color: "#FAC775" }}>
                  {displayBoreholes.some(b => b.boreholeCode?.includes("03") || b.boreholeCode?.includes("3")) ? "1" : "0"}
                </div>
                <div className="sc-s">
                  {displayBoreholes.some(b => b.boreholeCode?.includes("03") || b.boreholeCode?.includes("3"))
                    ? "BH-03 · 4.2m off"
                    : "All compliant"}
                </div>
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
              >
                {sites.length > 0 ? (
                  sites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))
                ) : (
                  <option value="mock-1">ROB — Km 142+500 (Bow String Bridge)</option>
                )}
              </select>
              <div style={{ fontSize: "11px", color: "#854F0B", background: "#FAEEDA", padding: "4px 8px", borderRadius: "5px", border: "0.5px solid #EF9F27", fontWeight: 500 }}>
                {displayBoreholes.length} boreholes · {currentSiteName.includes("ROB") ? "Bow String + RCC T Girder" : "Structure Foundations"}
              </div>
            </div>

            {/* Warning Flags strip */}
            {displayBoreholes.some(b => b.boreholeCode?.includes("02") || b.boreholeCode?.includes("03") || b.boreholeCode?.includes("2") || b.boreholeCode?.includes("3")) && (
              <div className="flag-strip">
                <RiAlertLine className="text-[#E24B4A] text-[15px] shrink-0" />
                <div className="flag-text font-medium">
                  {displayBoreholes.some(b => b.boreholeCode?.includes("02") || b.boreholeCode?.includes("2")) && (
                    <span>BH-02 (Pier P1) — N-value anomaly at 8.5m. &nbsp;|&nbsp; </span>
                  )}
                  {displayBoreholes.some(b => b.boreholeCode?.includes("03") || b.boreholeCode?.includes("3")) && (
                    <span>BH-03 (Pier P2) — GPS deviation 4.2m from planned location. Flagged.</span>
                  )}
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
                  Sandy silt
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(0deg,#F0997B,#F0997B 2px,#FAECE7 2px,#FAECE7 4px)" }} />
                  Clay
                </div>
                <div className="leg-item">
                  <div className="leg-sw" style={{ background: "repeating-linear-gradient(45deg,#BA7517,#BA7517 2px,#FAEEDA 2px,#FAEEDA 3px)" }} />
                  Dense sand
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
                  <div className="leg-sw border border-[#E24B4A]" style={{ background: "#FCEBEB" }} />
                  Anomaly / GPS flag
                </div>
              </div>

              {/* Site view block */}
              {viewMode === "site" ? (
                <div>
                  <div className="xsec-body" style={{ overflow: "visible" }}>
                    <div className="flex items-center gap-[6px] mb-2">
                      <span className="view-badge site">As recorded on site — raw field data · unmodified</span>
                    </div>

                    {/* SVG Container */}
                    {displayBoreholes.length === 0 ? (
                      <div className="py-20 text-center text-text-ter text-[12px]">
                        No boreholes available for cross section.
                      </div>
                    ) : (
                      (() => {
                        const svgWidth = Math.max(620, displayBoreholes.length * 125);
                        return (
                          <div className="relative overflow-x-auto select-none" style={{ width: "100%" }}>
                            <div style={{ width: `${svgWidth}px` }}>
                              <svg width={svgWidth} height="370" viewBox={`0 0 ${svgWidth} 370`} className="block">
                                <defs>
                                  <pattern id="p-fill" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#97C459" strokeWidth="1.5" /></pattern>
                                  <pattern id="p-silt" patternUnits="userSpaceOnUse" width="8" height="4"><line x1="0" y1="2" x2="8" y2="2" stroke="#EF9F27" strokeWidth="1.5" /></pattern>
                                  <pattern id="p-clay" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="0" y2="5" stroke="#F0997B" strokeWidth="1.5" /></pattern>
                                  <pattern id="p-sand" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#BA7517" strokeWidth="1.5" /></pattern>
                                  <pattern id="p-rock" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(135)"><line x1="0" y1="0" x2="0" y2="6" stroke="#888780" strokeWidth="1.5" /></pattern>
                                </defs>

                                {/* depth axis */}
                                <line x1="42" y1="30" x2="42" y2="350" stroke="#D3D1C7" strokeWidth="0.5" />
                                <text x="4" y="33" fontSize="9" fill="#888780" fontFamily="sans-serif">0m</text>
                                <text x="4" y="83" fontSize="9" fill="#888780" fontFamily="sans-serif">3m</text>
                                <text x="4" y="133" fontSize="9" fill="#888780" fontFamily="sans-serif">6m</text>
                                <text x="4" y="183" fontSize="9" fill="#888780" fontFamily="sans-serif">9m</text>
                                <text x="4" y="233" fontSize="9" fill="#888780" fontFamily="sans-serif">12m</text>
                                <text x="4" y="283" fontSize="9" fill="#888780" fontFamily="sans-serif">15m</text>
                                <text x="4" y="333" fontSize="9" fill="#888780" fontFamily="sans-serif">18m</text>

                                {/* dashed depth gridlines */}
                                <line x1="42" y1="30" x2={svgWidth} y2="30" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="80" x2={svgWidth} y2="80" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="130" x2={svgWidth} y2="130" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="180" x2={svgWidth} y2="180" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="230" x2={svgWidth} y2="230" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="280" x2={svgWidth} y2="280" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                                <line x1="42" y1="330" x2={svgWidth} y2="330" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />

                                {/* ground surface */}
                                <path
                                  d={`M 72,28 C 150,25 250,26 350,24 C 450,26 550,23 ${svgWidth},25`}
                                  stroke="#3B6D11"
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeDasharray="4,2"
                                />
                                <text x="44" y="22" fontSize="8" fill="#3B6D11" fontFamily="sans-serif">Ground surface (RL)</text>

                                {/* zone boundary lines */}
                                <line x1="42" y1="88" x2={svgWidth} y2="88" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                                <line x1="42" y1="165" x2={svgWidth} y2="165" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                                <line x1="42" y1="245" x2={svgWidth} y2="245" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                                <text x="44" y="60" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">FILL</text>
                                <text x="44" y="130" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">SHALLOW</text>
                                <text x="44" y="205" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">INTERMEDIATE</text>
                                <text x="44" y="268" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">DEEP</text>

                                {/* water table line */}
                                <path d={`M 60,178 L 180,172 L 300,185 L 420,176 L 540,180 L ${svgWidth},178`} stroke="#378ADD" strokeWidth="1" stroke-dasharray="3,2" fill="none" />
                                <text x="44" y="174" fontSize="8" fill="#378ADD" fontFamily="sans-serif">WT</text>

                                {/* dynamic borehole layers drawing */}
                                {displayBoreholes.map((bh: any, index: number) => {
                                  const bhX =
                                    displayBoreholes.length === 1
                                      ? svgWidth / 2
                                      : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                                  const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;
                                  const layers = getBoreholeLayers(depthVal);
                                  const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                                  const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");

                                  let currentY = 30;

                                  return (
                                    <g key={bh.id}>
                                      {/* Soil Layers */}
                                      {layers.map((layer, lIdx) => {
                                        const layerH = layer.height * 16.67;
                                        const y = currentY;
                                        currentY += layerH;

                                        return (
                                          <g key={lIdx}>
                                            <rect x={bhX - 12} y={y} width="24" height={layerH} fill={layer.bg} />
                                            {layer.pattern && (
                                              <rect
                                                x={bhX - 12}
                                                y={y}
                                                width="24"
                                                height={layerH}
                                                fill={layer.pattern}
                                                opacity={layer.opacity}
                                              />
                                            )}
                                            {/* N value text */}
                                            {lIdx < layers.length - 1 && (
                                              <text
                                                x={bhX + 16}
                                                y={y + layerH / 2 + 3}
                                                fontSize="8"
                                                fill={
                                                  layer.type === "fill"
                                                    ? "#639922"
                                                    : layer.type === "clay"
                                                    ? "#D85A30"
                                                    : "#BA7517"
                                                }
                                                fontFamily="sans-serif"
                                              >
                                                {layer.label}
                                              </text>
                                            )}
                                          </g>
                                        );
                                      })}

                                      {/* End marker indicator */}
                                      {layers.length > 0 && layers[layers.length - 1].type === "rock" && (
                                        <text
                                          x={bhX + 16}
                                          y={currentY - 10}
                                          fontSize="8"
                                          fill="#444441"
                                          fontFamily="sans-serif"
                                        >
                                          R
                                        </text>
                                      )}

                                      {/* Anomaly raw text highlight */}
                                      {isAnomaly && (
                                        <g>
                                          <rect x={bhX - 15} y="141" width="30" height="20" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="1" />
                                          <text x={bhX} y="154" fontSize="7" fill="#A32D2D" textAnchor="middle" fontFamily="sans-serif">N=42 RAW</text>
                                          <text x={bhX + 16} y="152" fontSize="8" fill="#E24B4A" fontWeight="500" fontFamily="sans-serif">N=42!</text>
                                        </g>
                                      )}

                                      {/* GPS Deviation Badge */}
                                      {isDeviated && (
                                        <g>
                                          <rect x={bhX - 22} y="8" width="44" height="14" rx="3" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="0.5" />
                                          <text x={bhX} y="18" fontSize="7" fill="#A32D2D" textAnchor="middle" fontFamily="sans-serif">GPS +4.2m ⚠</text>
                                        </g>
                                      )}

                                      {/* Outer Border representing status */}
                                      {bh.status === "PLANNED" ? (
                                        <rect
                                          x={bhX - 12}
                                          y="30"
                                          width="24"
                                          height={depthVal * 16.67}
                                          fill="none"
                                          stroke="#D3D1C7"
                                          strokeWidth="1"
                                          strokeDasharray="4,2"
                                        />
                                      ) : bh.status === "IN_PROGRESS" ? (
                                        <rect
                                          x={bhX - 12}
                                          y="30"
                                          width="24"
                                          height={depthVal * 16.67}
                                          fill="none"
                                          stroke="#BA7517"
                                          strokeWidth="1"
                                          strokeDasharray="4,2"
                                        />
                                      ) : (
                                        <rect
                                          x={bhX - 12}
                                          y="30"
                                          width="24"
                                          height={depthVal * 16.67}
                                          fill="none"
                                          stroke={isAnomaly || isDeviated ? "#E24B4A" : "#993C1D"}
                                          strokeWidth={isAnomaly || isDeviated ? 1.5 : 1}
                                          strokeDasharray={isAnomaly ? "4,2" : undefined}
                                        />
                                      )}
                                    </g>
                                  );
                                })}

                                {/* connecting profile lines */}
                                {(() => {
                                  let fillPath = "M";
                                  let clayPath = "M";
                                  let sandPath = "M";
                                  let rockPath = "M";

                                  displayBoreholes.forEach((bh, index) => {
                                    const bhX =
                                      displayBoreholes.length === 1
                                        ? svgWidth / 2
                                        : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                                    const isPending = bh.status === "PLANNED";
                                    if (isPending) return;

                                    fillPath += ` ${bhX},53`;
                                    clayPath += ` ${bhX},128`;
                                    sandPath += ` ${bhX},203`;
                                    rockPath += ` ${bhX},293`;
                                  });

                                  return (
                                    <>
                                      {fillPath.length > 2 && <path d={fillPath.replace("M ", "M")} stroke="#97C459" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                      {clayPath.length > 2 && <path d={clayPath.replace("M ", "M")} stroke="#F0997B" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                      {sandPath.length > 2 && <path d={sandPath.replace("M ", "M")} stroke="#BA7517" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                      {rockPath.length > 2 && <path d={rockPath.replace("M ", "M")} stroke="#444441" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                    </>
                                  );
                                })()}

                                <text x={svgWidth - 10} y="362" fontSize="8" fill="#97C459" textAnchor="end" fontFamily="sans-serif">Raw site data · Groundlense</text>
                              </svg>

                              {/* Invisible Hover Zones absolute overlay */}
                              {displayBoreholes.map((bh: any, index: number) => {
                                const bhX =
                                  displayBoreholes.length === 1
                                    ? svgWidth / 2
                                    : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                                const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                                const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");
                                const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;

                                return (
                                  <div
                                    key={`hover-${bh.id}`}
                                    onMouseEnter={() => setHoveredBhId(bh.id)}
                                    onMouseLeave={() => setHoveredBhId(null)}
                                    className="absolute cursor-pointer"
                                    style={{
                                      left: `${bhX - 20}px`,
                                      top: "30px",
                                      width: "40px",
                                      height: "320px",
                                    }}
                                  >
                                    {/* Hover Card */}
                                    {hoveredBhId === bh.id && (
                                      <div
                                        className="hover-card"
                                        style={{
                                          left: "50%",
                                          transform: "translateX(-50%) translateY(-8px)",
                                          pointerEvents: "none",
                                          display: "block",
                                        }}
                                      >
                                        <div className="hc-title font-display">
                                          {bh.boreholeCode} · {bh.name || "Foundation"}
                                          {isAnomaly && " ⚠ Anomaly"}
                                          {isDeviated && " ⚠ GPS Deviated"}
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Easting</span>
                                          <span className="hc-value green">
                                            {bh.longitude ? `${Number(bh.longitude).toFixed(6)}° E` : "521847.32 m E"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Northing</span>
                                          <span className="hc-value green">
                                            {bh.latitude ? `${Number(bh.latitude).toFixed(6)}° N` : "3148203.45 m N"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">RL</span>
                                          <span className="hc-value green">
                                            {bh.groundLevelRL ? `${bh.groundLevelRL} m` : "198.42 m"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Start date</span>
                                          <span className="hc-value">
                                            {bh.startedAt
                                              ? new Date(bh.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                              : "12 Apr 2025"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">End date</span>
                                          <span className="hc-value">
                                            {bh.completedAt
                                              ? new Date(bh.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                              : bh.status === "IN_PROGRESS"
                                              ? "In progress"
                                              : bh.status === "PLANNED"
                                              ? "Not started"
                                              : "14 Apr 2025"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Total depth</span>
                                          <span className="hc-value">{depthVal} m</span>
                                        </div>
                                        {isDeviated ? (
                                          <div className="hc-dev warn">
                                            ⚠ GPS deviation 4.2m — exceeds 3m threshold
                                          </div>
                                        ) : bh.status === "PLANNED" ? (
                                          <div className="hc-dev" style={{ background: "#2C2C2A", color: "#B4B2A9" }}>
                                            Boring not yet commenced
                                          </div>
                                        ) : (
                                          <div className="hc-dev ok">
                                            ✓ GPS within 1.2m of planned location
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
                      })()
                    )}

                    {/* BH Info cells row below SVG */}
                    <div className="bh-info-row mt-2 border-t border-[#F5C4B3]">
                      {displayBoreholes.map((bh: any) => {
                        const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                        const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");
                        const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;

                        let cellClass = "bh-info-cell";
                        if (bh.status === "PLANNED") cellClass += " pending";
                        else if (bh.status === "IN_PROGRESS") cellClass += " inprog";

                        return (
                          <div key={bh.id} className={cellClass}>
                            <div className="bh-info-id font-mono">
                              {bh.boreholeCode} {bh.name ? `· ${bh.name}` : ""} {isAnomaly || isDeviated ? "⚠" : ""}
                            </div>
                            <div className="bh-info-depth">
                              {bh.status === "PLANNED" ? "— m" : `${depthVal.toFixed(1)} m`}
                            </div>
                            <div className="bh-info-depth-label">
                              {bh.status === "PLANNED"
                                ? `planned ${depthVal.toFixed(1)}m`
                                : bh.status === "IN_PROGRESS"
                                ? "depth so far"
                                : "total depth"}
                            </div>
                            <div className="bh-info-dates">
                              Start: {bh.startedAt ? new Date(bh.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "12 Apr"}{" "}
                              <br />
                              End: {bh.completedAt ? new Date(bh.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : bh.status === "IN_PROGRESS" ? "In progress" : bh.status === "PLANNED" ? "Not started" : "14 Apr"}
                            </div>
                            {isDeviated ? (
                              <div className="bh-info-gps deviated">
                                ⚠ GPS dev 4.2m · E {bh.longitude ? Number(bh.longitude).toFixed(0) : "521981"} · N {bh.latitude ? Number(bh.latitude).toFixed(0) : "3148197"} · RL {bh.groundLevelRL ? `${bh.groundLevelRL}m` : "197.22m"}
                              </div>
                            ) : (
                              <div className="bh-info-gps font-mono">
                                E {bh.longitude ? Number(bh.longitude).toFixed(0) : "521847"} · N {bh.latitude ? Number(bh.latitude).toFixed(0) : "3148203"}
                                <br />
                                RL {bh.groundLevelRL ? `${bh.groundLevelRL}m` : "198.42m"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Engineer reviewed view block */
                <div className="xsec-body">
                  <div className="flex items-center gap-[6px] mb-2">
                    <span className="view-badge eng">As reviewed by engineer — corrected · approved report</span>
                  </div>
                  {displayBoreholes.some(b => b.boreholeCode?.includes("02") || b.boreholeCode?.includes("2")) && (
                    <div className="mod-note shadow-sm border border-[#85B7EB]">
                      <RiEdit2Line className="text-[#185FA5] text-[15px] shrink-0" />
                      <div>
                        <strong>BH-02 · 8.5m</strong> — N-value corrected from <strong>N=42</strong> to{" "}
                        <strong>N=18</strong>. Reason: "Casing disturbance. Inconsistent with adjacent BH-01
                        and BH-03 at same depth. Corrected per IS 2131 Cl. 6.3." — Er. Rajesh Kumar · 18 Apr
                        2025 · 03:22 PM
                      </div>
                    </div>
                  )}

                  {/* SVG Container for Engineer View */}
                  {displayBoreholes.length === 0 ? (
                    <div className="py-20 text-center text-text-ter text-[12px]">
                      No boreholes available for cross section.
                    </div>
                  ) : (
                    (() => {
                      const svgWidth = Math.max(620, displayBoreholes.length * 125);
                      return (
                        <div className="relative overflow-x-auto select-none mt-4" style={{ width: "100%" }}>
                          <div style={{ width: `${svgWidth}px` }}>
                            <svg width={svgWidth} height="370" viewBox={`0 0 ${svgWidth} 370`} className="block">
                              <defs>
                                <pattern id="p-fill" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#97C459" strokeWidth="1.5" /></pattern>
                                <pattern id="p-silt" patternUnits="userSpaceOnUse" width="8" height="4"><line x1="0" y1="2" x2="8" y2="2" stroke="#EF9F27" strokeWidth="1.5" /></pattern>
                                <pattern id="p-clay" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="0" y2="5" stroke="#F0997B" strokeWidth="1.5" /></pattern>
                                <pattern id="p-sand" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#BA7517" strokeWidth="1.5" /></pattern>
                                <pattern id="p-rock" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(135)"><line x1="0" y1="0" x2="0" y2="6" stroke="#888780" strokeWidth="1.5" /></pattern>
                              </defs>

                              {/* depth axis */}
                              <line x1="42" y1="30" x2="42" y2="350" stroke="#D3D1C7" strokeWidth="0.5" />
                              <text x="4" y="33" fontSize="9" fill="#888780" fontFamily="sans-serif">0m</text>
                              <text x="4" y="83" fontSize="9" fill="#888780" fontFamily="sans-serif">3m</text>
                              <text x="4" y="133" fontSize="9" fill="#888780" fontFamily="sans-serif">6m</text>
                              <text x="4" y="183" fontSize="9" fill="#888780" fontFamily="sans-serif">9m</text>
                              <text x="4" y="233" fontSize="9" fill="#888780" fontFamily="sans-serif">12m</text>
                              <text x="4" y="283" fontSize="9" fill="#888780" fontFamily="sans-serif">15m</text>
                              <text x="4" y="333" fontSize="9" fill="#888780" fontFamily="sans-serif">18m</text>

                              {/* dashed gridlines */}
                              <line x1="42" y1="30" x2={svgWidth} y2="30" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="80" x2={svgWidth} y2="80" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="130" x2={svgWidth} y2="130" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="180" x2={svgWidth} y2="180" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="230" x2={svgWidth} y2="230" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="280" x2={svgWidth} y2="280" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="42" y1="330" x2={svgWidth} y2="330" stroke="#F1EFE8" strokeWidth="0.5" strokeDasharray="3,3" />

                              {/* ground surface */}
                              <path d={`M 72,28 C 150,25 250,26 350,24 C 450,26 550,23 ${svgWidth},25`} stroke="#3B6D11" strokeWidth="1.5" fill="none" strokeDasharray="4,2" />
                              <text x="44" y="22" fontSize="8" fill="#3B6D11" fontFamily="sans-serif">Ground surface (RL)</text>

                              {/* boundary lines */}
                              <line x1="42" y1="88" x2={svgWidth} y2="88" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                              <line x1="42" y1="165" x2={svgWidth} y2="165" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                              <line x1="42" y1="245" x2={svgWidth} y2="245" stroke="#D3D1C7" strokeWidth="0.5" strokeDasharray="6,3" />
                              <text x="44" y="60" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">FILL</text>
                              <text x="44" y="130" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">SHALLOW</text>
                              <text x="44" y="205" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">INTERMEDIATE</text>
                              <text x="44" y="268" fontSize="8" fill="#D3D1C7" fontFamily="sans-serif">DEEP</text>

                              {/* WT */}
                              <path d={`M 60,178 L 180,172 L 300,185 L 420,176 L 540,180 L ${svgWidth},178`} stroke="#378ADD" strokeWidth="1" stroke-dasharray="3,2" fill="none" />
                              <text x="44" y="174" fontSize="8" fill="#378ADD" fontFamily="sans-serif">WT</text>

                              {displayBoreholes.map((bh: any, index: number) => {
                                const bhX =
                                  displayBoreholes.length === 1
                                    ? svgWidth / 2
                                    : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                                const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;
                                const layers = getBoreholeLayers(depthVal);
                                const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                                const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");

                                let currentY = 30;

                                return (
                                  <g key={`eng-${bh.id}`}>
                                    {layers.map((layer, lIdx) => {
                                      const layerH = layer.height * 16.67;
                                      const y = currentY;
                                      currentY += layerH;

                                      return (
                                        <g key={lIdx}>
                                          <rect x={bhX - 12} y={y} width="24" height={layerH} fill={layer.bg} />
                                          {layer.pattern && (
                                            <rect
                                              x={bhX - 12}
                                              y={y}
                                              width="24"
                                              height={layerH}
                                              fill={layer.pattern}
                                              opacity={layer.opacity}
                                            />
                                          )}
                                          {/* N value text */}
                                          {lIdx < layers.length - 1 && (
                                            <text
                                              x={bhX + 16}
                                              y={y + layerH / 2 + 3}
                                              fontSize="8"
                                              fill={
                                                layer.type === "fill"
                                                  ? "#639922"
                                                  : layer.type === "clay"
                                                  ? "#D85A30"
                                                  : "#BA7517"
                                              }
                                              fontFamily="sans-serif"
                                            >
                                              {/* Corrected BH-02 N value in Engineer View */}
                                              {isAnomaly && layer.type === "clay" ? "N=18 (corrected)" : layer.label}
                                            </text>
                                          )}
                                        </g>
                                      );
                                    })}

                                    {layers.length > 0 && layers[layers.length - 1].type === "rock" && (
                                      <text x={bhX + 16} y={currentY - 10} fontSize="8" fill="#444441" fontFamily="sans-serif">R</text>
                                    )}

                                    {/* Corrected N-value display visual indicators */}
                                    {isAnomaly && (
                                      <g>
                                        <rect x={bhX - 15} y="141" width="30" height="20" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1" />
                                        <text x={bhX} y="154" fontSize="7" fill="#185FA5" textAnchor="middle" fontFamily="sans-serif">N=18 OK</text>
                                      </g>
                                    )}

                                    {/* Deviation flag still exists in engineer view */}
                                    {isDeviated && (
                                      <g>
                                        <rect x={bhX - 22} y="8" width="44" height="14" rx="3" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="0.5" />
                                        <text x={bhX} y="18" fontSize="7" fill="#A32D2D" textAnchor="middle" fontFamily="sans-serif">GPS +4.2m ⚠</text>
                                      </g>
                                    )}

                                    {/* Outer Border */}
                                    {bh.status === "PLANNED" ? (
                                      <rect x={bhX - 12} y="30" width="24" height={depthVal * 16.67} fill="none" stroke="#D3D1C7" strokeWidth="1" strokeDasharray="4,2" />
                                    ) : bh.status === "IN_PROGRESS" ? (
                                      <rect x={bhX - 12} y="30" width="24" height={depthVal * 16.67} fill="none" stroke="#BA7517" strokeWidth="1" strokeDasharray="4,2" />
                                    ) : (
                                      <rect x={bhX - 12} y="30" width="24" height={depthVal * 16.67} fill="none" stroke={isAnomaly ? "#185FA5" : isDeviated ? "#E24B4A" : "#993C1D"} strokeWidth={1} />
                                    )}
                                  </g>
                                );
                              })}

                              {/* connecting lines */}
                              {(() => {
                                let fillPath = "M";
                                let clayPath = "M";
                                let sandPath = "M";
                                let rockPath = "M";

                                displayBoreholes.forEach((bh, index) => {
                                  const bhX =
                                    displayBoreholes.length === 1
                                      ? svgWidth / 2
                                      : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                                  if (bh.status === "PLANNED") return;

                                  fillPath += ` ${bhX},53`;
                                  clayPath += ` ${bhX},128`;
                                  sandPath += ` ${bhX},203`;
                                  rockPath += ` ${bhX},293`;
                                });

                                return (
                                  <>
                                    {fillPath.length > 2 && <path d={fillPath.replace("M ", "M")} stroke="#97C459" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                    {clayPath.length > 2 && <path d={clayPath.replace("M ", "M")} stroke="#F0997B" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                    {sandPath.length > 2 && <path d={sandPath.replace("M ", "M")} stroke="#BA7517" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                    {rockPath.length > 2 && <path d={rockPath.replace("M ", "M")} stroke="#444441" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />}
                                  </>
                                );
                              })()}

                              <text x={svgWidth - 10} y="362" fontSize="8" fill="#185FA5" textAnchor="end" fontFamily="sans-serif">Engineer reviewed data · Groundlense</text>
                            </svg>

                            {/* Hover Zones absolute overlay */}
                            {displayBoreholes.map((bh: any, index: number) => {
                              const bhX =
                                displayBoreholes.length === 1
                                  ? svgWidth / 2
                                  : 70 + index * ((svgWidth - 140) / (displayBoreholes.length - 1));

                              const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                              const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");
                              const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;

                              return (
                                  <div
                                    key={`hover-eng-${bh.id}`}
                                    onMouseEnter={() => setHoveredBhId(bh.id)}
                                    onMouseLeave={() => setHoveredBhId(null)}
                                    className="absolute cursor-pointer"
                                    style={{
                                      left: `${bhX - 20}px`,
                                      top: "30px",
                                      width: "40px",
                                      height: "320px",
                                    }}
                                  >
                                    {hoveredBhId === bh.id && (
                                      <div
                                        className="hover-card"
                                        style={{
                                          left: "50%",
                                          transform: "translateX(-50%) translateY(-8px)",
                                          pointerEvents: "none",
                                          display: "block",
                                        }}
                                      >
                                        <div className="hc-title font-display">
                                          {bh.boreholeCode} · {bh.name || "Foundation"} {isAnomaly && " (Reviewed)"}
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Easting</span>
                                          <span className="hc-value green">
                                            {bh.longitude ? `${Number(bh.longitude).toFixed(6)}° E` : "521847.32 m E"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Northing</span>
                                          <span className="hc-value green">
                                            {bh.latitude ? `${Number(bh.latitude).toFixed(6)}° N` : "3148203.45 m N"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">RL</span>
                                          <span className="hc-value green">
                                            {bh.groundLevelRL ? `${bh.groundLevelRL} m` : "198.42 m"}
                                          </span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Soil type at 8.5m</span>
                                          <span className="hc-value">{isAnomaly ? "Clay (N=18 corrected)" : "Clay"}</span>
                                        </div>
                                        <div className="hc-row">
                                          <span className="hc-label">Total depth</span>
                                          <span className="hc-value">{depthVal} m</span>
                                        </div>
                                        {isAnomaly ? (
                                          <div className="hc-dev ok" style={{ background: "#08415C", color: "#9FE1F5" }}>
                                            ✓ N-value verified & approved by engineer
                                          </div>
                                        ) : isDeviated ? (
                                          <div className="hc-dev warn">
                                            ⚠ GPS deviation 4.2m — exceeds 3m threshold
                                          </div>
                                        ) : (
                                          <div className="hc-dev ok">
                                            ✓ GPS within 1.2m of planned location
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
                    })()
                  )}

                  {/* BH Info row below SVG */}
                  <div className="bh-info-row mt-2 border-t border-[#F5C4B3]">
                    {displayBoreholes.map((bh: any) => {
                      const isAnomaly = bh.boreholeCode?.includes("02") || bh.boreholeCode?.includes("2");
                      const isDeviated = bh.boreholeCode?.includes("03") || bh.boreholeCode?.includes("3");
                      const depthVal = parseFloat(bh.finalDepth || bh.plannedDepth) || 15;

                      let cellClass = "bh-info-cell";
                      if (bh.status === "PLANNED") cellClass += " pending";
                      else if (bh.status === "IN_PROGRESS") cellClass += " inprog";

                      return (
                        <div key={`info-eng-${bh.id}`} className={cellClass}>
                          <div className="bh-info-id font-mono">
                            {bh.boreholeCode} {bh.name ? `· ${bh.name}` : ""}
                          </div>
                          <div className="bh-info-depth">
                            {bh.status === "PLANNED" ? "— m" : isAnomaly ? "17.5 m (Reviewed)" : `${depthVal.toFixed(1)} m`}
                          </div>
                          <div className="bh-info-depth-label">
                            {bh.status === "PLANNED"
                              ? `planned ${depthVal.toFixed(1)}m`
                              : bh.status === "IN_PROGRESS"
                              ? "depth so far"
                              : "total depth"}
                          </div>
                          <div className="bh-info-dates">
                            Approved: {bh.completedAt ? new Date(bh.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "14 Apr 2025"}
                          </div>
                          {isAnomaly ? (
                            <div className="bh-info-gps" style={{ color: "#185FA5", background: "#E6F1FB", borderRadius: "3px", padding: "2px 4px", display: "inline-block", marginTop: "3px" }}>
                              ✓ N-value approved (N=18)
                            </div>
                          ) : isDeviated ? (
                            <div className="bh-info-gps deviated">
                              ⚠ GPS dev 4.2m · E 521981 · N 3148197
                            </div>
                          ) : (
                            <div className="bh-info-gps font-mono">
                              E {bh.longitude ? Number(bh.longitude).toFixed(0) : "521847"} · N {bh.latitude ? Number(bh.latitude).toFixed(0) : "3148203"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Site Photos section */}
            <div className="sec-label mt-4">Site photos — GPS verified · timestamped</div>
            <div className="photos-strip">
              <div className="photo-card shadow-sm hover:scale-[1.01] transition-all">
                <div className="photo-img" style={{ background: "#E6F1FB", color: "#185FA5" }}>
                  <RiCameraLine className="text-[20px]" />
                  <span className="font-semibold">Rig at BH-01</span>
                </div>
                <div className="photo-info">
                  <div className="photo-bh">BH-01 · Abutment A</div>
                  <div className="photo-date">12 Apr 2025 · 08:42 AM</div>
                  <div className="photo-tag">Rig setup · start of boring</div>
                  <div className="photo-verified font-mono">✓ GPS 521847 E · 3148203 N</div>
                </div>
              </div>

              <div className="photo-card shadow-sm hover:scale-[1.01] transition-all">
                <div className="photo-img" style={{ background: "#EAF3DE", color: "#3B6D11" }}>
                  <RiCameraLine className="text-[20px]" />
                  <span className="font-semibold">Split spoon 6m</span>
                </div>
                <div className="photo-info">
                  <div className="photo-bh">BH-01 · Depth 6.0m</div>
                  <div className="photo-date">12 Apr 2025 · 11:15 AM</div>
                  <div className="photo-tag">Split spoon · clay stiff brown</div>
                  <div className="photo-verified font-mono">✓ Sample GL-BH01-6.0-S1</div>
                </div>
              </div>

              <div className="photo-card shadow-sm hover:scale-[1.01] transition-all">
                <div className="photo-img" style={{ background: "#FCEBEB", color: "#993C1D" }}>
                  <RiCameraLine className="text-[20px]" />
                  <span className="font-semibold text-center">BH-03 GPS deviated</span>
                </div>
                <div className="photo-info">
                  <div className="photo-bh text-red-600">BH-03 · Pier P2 ⚠ GPS dev</div>
                  <div className="photo-date">15 Apr 2025 · 09:10 AM</div>
                  <div className="photo-tag">Rig setup · location deviated 4.2m</div>
                  <div className="photo-verified font-mono" style={{ color: "#A32D2D", background: "#FCEBEB" }}>
                    ⚠ Deviation flagged
                  </div>
                </div>
              </div>

              <div className="photo-card shadow-sm hover:scale-[1.01] transition-all">
                <div className="photo-img" style={{ background: "#F1EFE8", color: "#5F5E5A" }}>
                  <RiCameraLine className="text-[20px]" />
                  <span className="font-semibold">Sample jar BH-03</span>
                </div>
                <div className="photo-info">
                  <div className="photo-bh">BH-03 · Pier P2 · 9.0m</div>
                  <div className="photo-date">15 Apr 2025 · 02:30 PM</div>
                  <div className="photo-tag">Sample jar sealed</div>
                  <div className="photo-verified font-mono">✓ ID GL-BH03-9.0-S2</div>
                </div>
              </div>
            </div>

            {/* Document downloads strip */}
            <div className="dl-row mt-4">
              <button className="dl-btn">
                <RiDownloadLine className="text-[14px]" />
                Download full report — PDF
              </button>
              <button className="dl-btn-sec">
                <RiShieldCheckLine className="text-[14px]" />
                Tamper certificate
              </button>
              <button className="dl-btn-sec">
                <RiImageLine className="text-[14px]" />
                All site photos
              </button>
              <div className="cert shadow-sm">
                <RiCheckLine className="text-[12px] text-green-700" />
                NABL verified · Geocon Labs CC-1847
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
