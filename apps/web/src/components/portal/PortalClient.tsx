"use client";

interface PortalClientProps {
  project: any;
  projects: any[];
  boreholes: any[];
  sites: any[];
  user: Record<string, unknown> | null;
}

const BH_STATUS: Record<string, { cls: string; text: string }> = {
  PLANNED: { cls: "p-gr", text: "○ Planned" },
  IN_PROGRESS: { cls: "p-a", text: "● In progress" },
  COMPLETED: { cls: "p-g", text: "✓ Complete" },
  ABANDONED: { cls: "p-red", text: "✗ Abandoned" },
};

export default function PortalClient({ project, boreholes, sites }: PortalClientProps) {
  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-[28px] mb-3">⚠️</div>
          <div className="text-[14px] text-text-sec font-medium">Project not found</div>
          <div className="text-[11px] text-text-ter mt-1">Check the URL or select a project from the left panel.</div>
        </div>
      </div>
    );
  }

  const completed = boreholes.filter((b: any) => b.status === "COMPLETED").length;
  const inProgress = boreholes.filter((b: any) => b.status === "IN_PROGRESS").length;
  const planned = boreholes.filter((b: any) => b.status === "PLANNED").length;

  return (
    <div className="animate-fade-in">
      {/* Stat row — matches .stat-row: grid 4 cols, gap 8px, mb 12px */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <StatCard label="Boreholes" value={boreholes.length} sub="Total planned" accent="rust" />
        <StatCard label="Completed" value={completed} sub={`${boreholes.length > 0 ? Math.round((completed / boreholes.length) * 100) : 0}% done`} accent="green" />
        <StatCard label="In progress" value={inProgress} sub="Currently active" accent="amber" />
        <StatCard label="Planned" value={planned} sub="Yet to start" accent="blue" />
      </div>

      {/* Project Details — matches .card: bg-card, border, rounded-[9px], padding 14px, mb 12px */}
      <div className="bg-bg-card border border-border rounded-[9px] mb-3" style={{ padding: "14px" }}>
        <div className="text-[10px] font-semibold text-text-ter uppercase tracking-[0.6px] mb-3 pb-[5px] border-b border-border flex items-center gap-[7px]">
          📋 Project details
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0">
          <DetailRow label="Project code" value={project.projectCode} mono />
          <DetailRow label="Status" value={project.status} />
          <DetailRow label="Name" value={project.name} />
          <DetailRow label="EPC contractor" value={project.epcOrganization?.name || "—"} highlight />
          <DetailRow label="Geotech contractor" value={project.geotechOrganization?.name || "—"} highlight />
          {project.description && <DetailRow label="Description" value={project.description} />}
          {project.projectType && <DetailRow label="Type" value={project.projectType} />}
          {project.state && <DetailRow label="State" value={project.state} />}
          {project.district && <DetailRow label="District" value={project.district} />}
          {(project.chainageFrom != null || project.chainageTo != null) && (
            <DetailRow label="Chainage" value={`${project.chainageFrom ?? "—"} to ${project.chainageTo ?? "—"}`} mono />
          )}
          {project.totalBoringsPlanned && <DetailRow label="Borings planned" value={String(project.totalBoringsPlanned)} />}
          {project.startDate && <DetailRow label="Start date" value={new Date(project.startDate).toLocaleDateString("en-IN")} />}
          {project.endDate && <DetailRow label="End date" value={new Date(project.endDate).toLocaleDateString("en-IN")} />}
          <DetailRow label="Created" value={new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
        </div>
      </div>

      {/* Sites — matches .card */}
      {sites.length > 0 && (
        <div className="bg-bg-card border border-border rounded-[9px] mb-3" style={{ padding: "14px" }}>
          <div className="text-[10px] font-semibold text-text-ter uppercase tracking-[0.6px] mb-3 pb-[5px] border-b border-border flex items-center gap-[7px]">
            📍 Sites ({sites.length})
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Lat</th>
                  <th>Lng</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-mono text-[9px] text-amber-d">{s.code}</td>
                    <td className="text-text-pri font-medium">{s.name}</td>
                    <td>{s.description || "—"}</td>
                    <td className="font-mono text-[9px]">{s.latitude ?? "—"}</td>
                    <td className="font-mono text-[9px]">{s.longitude ?? "—"}</td>
                    <td><span className={`pill ${s.isActive ? "pill-green" : "pill-gray"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boreholes — matches .card */}
      <div className="bg-bg-card border border-border rounded-[9px] mb-3" style={{ padding: "14px" }}>
        <div className="text-[10px] font-semibold text-text-ter uppercase tracking-[0.6px] mb-3 pb-[5px] border-b border-border flex items-center gap-[7px]">
          ⛏️ Boreholes ({boreholes.length})
          {boreholes.length > 0 && (
            <span className="ml-auto text-[10px] text-rust-d cursor-pointer font-medium normal-case tracking-normal"
              style={{ background: "rgba(153,60,29,.12)", padding: "2px 7px", borderRadius: "3px", border: "0.5px solid rgba(153,60,29,.25)" }}>
              + Add borehole
            </span>
          )}
        </div>
        {boreholes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[24px] mb-2">⛏️</div>
            <div className="text-[11px] text-text-sec font-medium">No boreholes created yet</div>
            <div className="text-[10px] text-text-ter mt-1">Add boreholes to start tracking boring data for this project.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BH Code</th>
                  <th>Name</th>
                  <th>Planned</th>
                  <th>Final</th>
                  <th>Lat</th>
                  <th>Lng</th>
                  <th>RL</th>
                  <th>Status</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {boreholes.map((bh: any) => {
                  const st = BH_STATUS[bh.status] || BH_STATUS.PLANNED;
                  return (
                    <tr key={bh.id}>
                      <td className="font-mono text-[9px] text-amber-d">{bh.boreholeCode}</td>
                      <td className="text-text-pri font-medium">{bh.name || "—"}</td>
                      <td>{bh.plannedDepth ? `${bh.plannedDepth}m` : "—"}</td>
                      <td>{bh.finalDepth ? `${bh.finalDepth}m` : "—"}</td>
                      <td className="font-mono text-[9px]">{bh.latitude ?? "—"}</td>
                      <td className="font-mono text-[9px]">{bh.longitude ?? "—"}</td>
                      <td>{bh.groundLevelRL ?? "—"}</td>
                      <td><span className={`pill ${st.cls}`}>{st.text}</span></td>
                      <td className="text-[10px]">{bh.startedAt ? new Date(bh.startedAt).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* Stat card — matches .sc: bg-card, border, rounded-[7px], padding 10px 12px */
function StatCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  const borderMap: Record<string, string> = {
    rust: "border-t-rust",
    green: "border-t-green",
    amber: "border-t-amber",
    blue: "border-t-blue",
  };
  return (
    <div className={`bg-bg-card border border-border rounded-[7px] ${borderMap[accent] || ""}`} style={{ padding: "10px 12px" }}>
      <div className="text-[9px] text-text-ter mb-[3px]">{label}</div>
      <div className="text-[20px] font-bold text-text-pri">{value}</div>
      <div className="text-[9px] text-text-ter mt-[1px]">{sub}</div>
    </div>
  );
}

/* Detail row — matches .detail-row from globals.css */
function DetailRow({ label, value, mono = false, highlight = false }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="detail-row">
      <span className="text-text-ter">{label}</span>
      <span className={`text-right ${highlight ? "text-green-d" : "text-text-sec"} ${mono ? "font-mono text-[9px] tracking-wider text-amber-d" : ""}`}>{value}</span>
    </div>
  );
}
