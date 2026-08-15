"use client";

import { useState } from "react";
import { RiSettings4Line, RiRadarLine, RiCheckDoubleLine, RiFlaskLine, RiFileTextLine, RiSettingsLine, RiQuestionLine, RiCloseLine } from "react-icons/ri";
import { usePortalTab } from "./PortalContext";

const SIDEBAR_ITEMS = [
  { key: "setup" as const, icon: RiSettings4Line, label: "Setup" },
  { key: "monitor" as const, icon: RiRadarLine, label: "Monitor" },
  { key: "review" as const, icon: RiCheckDoubleLine, label: "Review" },
  { key: "lab" as const, icon: RiFlaskLine, label: "Lab" },
  { key: "report" as const, icon: RiFileTextLine, label: "Report" },
  { key: "settings" as const, icon: RiSettingsLine, label: "Settings" },
  { key: "requests" as const, icon: RiFileTextLine, label: "Requests" },
];

/* Legend rows mirror BH_STATUS in PortalClient — keep the two in sync. */
const BH_LEGEND: { cls: string; text: string; desc: string }[] = [
  { cls: "p-gr", text: "○ Planned", desc: "Created, fieldwork not started. Editable & assignable." },
  { cls: "p-a", text: "● In progress", desc: "Crew is actively boring right now." },
  { cls: "p-a", text: "⏸ Paused — resumable", desc: "Ended for the day from mobile; same crew resumes next shift." },
  { cls: "p-a", text: "❚❚ Suspended", desc: "Work halted temporarily (weather, access, instruction)." },
  { cls: "p-g", text: "✓ Complete", desc: "Target depth reached; record closed for review." },
  { cls: "p-red", text: "✗ Abandoned", desc: "Terminated permanently — will not be resumed." },
];

const REVIEW_LEGEND: { cls: string; text: string; desc: string }[] = [
  { cls: "p-g", text: "✓ Approved", desc: "Engineer reviewed and accepted the interval data." },
  { cls: "p-red", text: "✗ Rejected", desc: "Sent back to the field team for correction." },
  { cls: "p-gr", text: "○ Pending", desc: "Awaiting engineer review." },
];

const COLOR_LEGEND: { color: string; label: string; desc: string }[] = [
  { color: "var(--color-green-d)", label: "Green", desc: "Verified / complete / approved" },
  { color: "var(--color-amber-d)", label: "Amber", desc: "In progress / needs attention" },
  { color: "var(--color-red-d)", label: "Red", desc: "Flagged / rejected / abandoned" },
  { color: "var(--color-blue-d)", label: "Blue", desc: "Informational / external (lab, done)" },
  { color: "var(--color-text-ter)", label: "Gray", desc: "Not started / inactive" },
];

/* Matches .sidebar: width 48px, bg-surface, border-right, padding 10px 0, gap 2px */
export default function PortalSidebar() {
  const { activeTab, setActiveTab } = usePortalTab();
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className="w-12 bg-bg-surface border-r border-border flex flex-col items-center gap-[2px] shrink-0" style={{ padding: "10px 0" }}>
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-[15px] cursor-pointer border transition-all duration-100 relative group
              ${isActive
                ? "bg-[rgba(153,60,29,.2)] text-rust-d border-[rgba(153,60,29,.3)]"
                : "text-text-ter border-transparent hover:bg-bg-card hover:text-text-sec"
              }`}
          >
            <Icon />
            {/* Tooltip — matches .si .tip */}
            <span className="hidden group-hover:block absolute left-[42px] top-1/2 -translate-y-1/2 bg-bg-raised border-[0.5px] border-border-mid text-text-pri text-[10px] py-[3px] px-[7px] rounded-[3px] whitespace-nowrap z-[300]">
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Divider — matches .sdiv */}
      <div className="w-[22px] h-[1px] bg-border my-[3px]" />

      {/* Legend — status & colour reference */}
      <div className="mt-auto">
        <div
          onClick={() => setLegendOpen(true)}
          className={`w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-[15px] cursor-pointer border transition-all relative group
            ${legendOpen
              ? "bg-[rgba(153,60,29,.2)] text-rust-d border-[rgba(153,60,29,.3)]"
              : "text-text-ter border-transparent hover:bg-bg-card hover:text-text-sec"
            }`}
        >
          <RiQuestionLine />
          <span className="hidden group-hover:block absolute left-[42px] top-1/2 -translate-y-1/2 bg-bg-raised border-[0.5px] border-border-mid text-text-pri text-[10px] py-[3px] px-[7px] rounded-[3px] whitespace-nowrap z-[300]">
            Legend
          </span>
        </div>
      </div>

      {/* Legend panel */}
      {legendOpen && (
        <div
          className="fixed inset-0 z-[400]"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setLegendOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-14 bottom-3 w-[320px] max-h-[calc(100vh-24px)] overflow-y-auto bg-bg-surface border border-border-mid rounded-xl animate-fade-up"
            style={{ boxShadow: "0 18px 50px rgba(0,0,0,0.55)", padding: "16px 18px" }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-text-ter">
                Status legend
              </span>
              <button
                onClick={() => setLegendOpen(false)}
                className="bg-transparent border-none text-text-ter hover:text-text-sec cursor-pointer text-[14px] leading-none p-0"
                aria-label="Close"
              >
                <RiCloseLine />
              </button>
            </div>

            {/* Borehole statuses */}
            <div className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.5px] mb-2">
              Borehole status
            </div>
            <div className="flex flex-col gap-[7px] mb-4">
              {BH_LEGEND.map((row) => (
                <div key={row.text} className="flex items-start gap-2">
                  <span className={`pill ${row.cls} shrink-0 whitespace-nowrap`}>{row.text}</span>
                  <span className="text-[10px] text-text-sec leading-snug pt-[2px]">{row.desc}</span>
                </div>
              ))}
            </div>

            {/* Review states */}
            <div className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.5px] mb-2">
              Interval review
            </div>
            <div className="flex flex-col gap-[7px] mb-4">
              {REVIEW_LEGEND.map((row) => (
                <div key={row.text} className="flex items-start gap-2">
                  <span className={`pill ${row.cls} shrink-0 whitespace-nowrap`}>{row.text}</span>
                  <span className="text-[10px] text-text-sec leading-snug pt-[2px]">{row.desc}</span>
                </div>
              ))}
            </div>

            {/* Colour code */}
            <div className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.5px] mb-2">
              Colour code
            </div>
            <div className="flex flex-col gap-[6px]">
              {COLOR_LEGEND.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                  <span className="text-[10px] text-text-pri font-medium w-[38px] shrink-0">{row.label}</span>
                  <span className="text-[10px] text-text-sec leading-snug">{row.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
