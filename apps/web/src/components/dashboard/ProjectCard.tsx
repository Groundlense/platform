"use client";

import { useRouter } from "next/navigation";

interface ProjectCardProps {
  project: any;
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
  const status = STATUS_MAP[project.status] || STATUS_MAP.DRAFT;
  const epcName = project.epcOrganization?.name || "—";
  const gtName = project.geotechOrganization?.name || "—";
  const isLocked = !!project.lockedAt;

  const chainage = project.chainageFrom != null && project.chainageTo != null
    ? `Ch.${project.chainageFrom} – ${project.chainageTo}`
    : project.state || "";

  return (
    <div
      className="relative bg-bg-surface border border-border rounded-[10px] overflow-hidden cursor-pointer transition-all duration-150 hover:border-border-mid hover:-translate-y-[1px] group"
      onClick={() => router.push(`/projects/${project.id}/portal`)}
    >
      {/* Locked overlay — matches .proj-locked-overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[10px]"
          style={{ background: "rgba(26,25,24,0.8)", backdropFilter: "blur(5px)" }}>
          <div className="text-[24px]">🔒</div>
          <div className="text-[11px] text-text-sec text-center leading-relaxed">
            Project locked<br />
            <span className="text-[10px] text-text-ter">{new Date(project.lockedAt).toLocaleDateString("en-IN")}</span>
          </div>
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

        {/* Stat row — matches .pc-stat-row: grid 3 cols, gap 6px */}
        {project.totalBoringsPlanned && (
          <div className="grid grid-cols-3 gap-[6px] mb-[10px]">
            <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
              <div className="font-mono text-[14px] font-medium text-text-pri">{project.totalBoringsPlanned}</div>
              <div className="text-[8px] text-text-ter mt-[2px]">Planned</div>
            </div>
            <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
              <div className="font-mono text-[14px] font-medium text-green-d">—</div>
              <div className="text-[8px] text-text-ter mt-[2px]">Active</div>
            </div>
            <div className="text-center rounded-[6px] bg-bg-card" style={{ padding: "7px 4px" }}>
              <div className="font-mono text-[14px] font-medium text-text-ter">—</div>
              <div className="text-[8px] text-text-ter mt-[2px]">Pending</div>
            </div>
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
