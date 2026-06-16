"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PortalLeftPanelProps {
  projects: any[];
  currentProjectId: string | null;
}

const STATUS_MAP: Record<string, { cls: string; text: string }> = {
  DRAFT: { cls: "b-rev", text: "Draft" },
  ACTIVE: { cls: "b-act", text: "Active" },
  ON_HOLD: { cls: "b-rev", text: "On hold" },
  COMPLETED: { cls: "b-done", text: "Done" },
  ARCHIVED: { cls: "b-done", text: "Archived" },
};

/* Matches .left: width 260px, bg-surface, border-right */
export default function PortalLeftPanel({ projects, currentProjectId }: PortalLeftPanelProps) {
  const [filter, setFilter] = useState("");
  const router = useRouter();

  const filtered = projects.filter((p: any) =>
    !filter || p.name?.toLowerCase().includes(filter.toLowerCase()) || p.projectCode?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="w-[260px] bg-bg-surface border-r border-border flex flex-col shrink-0">
      {/* Header — matches .lhdr: padding 12px 14px 8px */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--color-border)" }}>
        <div className="text-[10px] font-semibold text-text-ter uppercase tracking-[0.7px] mb-[7px]">Projects ({projects.length})</div>
        {/* Search — matches .search: padding 5px 8px, gap 5px */}
        <div className="flex items-center gap-[5px] bg-bg-card border-[0.5px] border-border-mid rounded-[5px]" style={{ padding: "5px 8px" }}>
          <span className="text-[11px] text-text-ter">🔍</span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-[11px] text-text-pri placeholder:text-text-ter"
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Project list — matches .plist: padding 6px, overflow-y auto */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "6px" }}>
        {filtered.map((p: any) => {
          const isActive = p.id === currentProjectId;
          const status = STATUS_MAP[p.status] || STATUS_MAP.DRAFT;
          return (
            <div
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}/portal`)}
              className={`rounded-[7px] cursor-pointer border transition-all duration-100 mb-[3px]
                ${isActive
                  ? "bg-[rgba(153,60,29,.1)] border-[rgba(153,60,29,.2)]"
                  : "border-transparent hover:bg-bg-card"
                }`}
              style={{ padding: "9px 10px" }}
            >
              <div className="font-mono text-[8px] text-amber-d mb-[2px]">{p.projectCode}</div>
              <div className="text-[11px] font-medium text-text-pri mb-[2px]">{p.name}</div>
              <div className="text-[9px] text-text-ter">{p.state || p.epcOrganization?.name || ""}</div>

              {/* Footer badges — matches .pi-foot */}
              <div className="flex items-center gap-[5px] mt-[5px]">
                <span className={`text-[8px] py-[1px] px-[5px] rounded-[3px] font-medium
                  ${status.cls === "b-act" ? "bg-[rgba(59,109,17,.15)] text-green-d border-[0.5px] border-[rgba(59,109,17,.25)]"
                    : status.cls === "b-rev" ? "bg-[rgba(186,117,23,.15)] text-amber-d border-[0.5px] border-[rgba(186,117,23,.25)]"
                    : "bg-[rgba(255,255,255,.05)] text-text-ter border-[0.5px] border-border"}`}>
                  {status.text}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-[10px] text-text-ter text-center py-6">No projects found.</div>
        )}
      </div>
    </div>
  );
}
