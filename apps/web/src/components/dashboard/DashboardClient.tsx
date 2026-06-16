"use client";

import { useState } from "react";
import DashboardTopbar from "./DashboardTopbar";
import ProjectSearch from "./ProjectSearch";
import SummaryRow from "./SummaryRow";
import ProjectCard from "./ProjectCard";
import NewProjectCard from "./NewProjectCard";
import NewProjectModal from "./NewProjectModal";

interface DashboardClientProps {
  projects: any[];
  summary: { projects: number; boreholes: number; intervals: number; samples: number; media: number };
  user: Record<string, unknown> | null;
  orgType: string | null;
  geotechOrgs: { id: string; name: string; type: string; city: string | null; state: string | null }[];
}

export default function DashboardClient({ projects, summary, user, orgType, geotechOrgs }: DashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <DashboardTopbar user={user} />

      {/* Dashboard body — matches .dash-body: padding 24px 28px */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>

        <ProjectSearch projects={projects} orgType={orgType} />

        {/* Welcome bar — matches .welcome-bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-[22px] font-semibold mb-[2px]">
              {user ? `Welcome, ${(user as any).firstName || "User"}` : "Your projects"}
            </h2>
            <p className="text-[12px] text-text-sec">Monitor borings, track reports, manage teams</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-[7px] py-[9px] px-4 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors"
          >
            + New project
          </button>
        </div>

        <SummaryRow summary={summary} />

        {/* Project grid — matches .proj-grid: grid 3 cols, gap 10px */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-3 gap-[10px] mb-5">
            {projects.map((p: any) => (
              <ProjectCard key={p.id} project={p} orgType={orgType} />
            ))}
            <NewProjectCard onClick={() => setModalOpen(true)} />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-[36px] mb-4">📋</div>
            <div className="text-[16px] text-text-sec font-medium mb-1">No projects yet</div>
            <div className="text-[12px] text-text-ter leading-relaxed max-w-[300px] mx-auto mb-5">Create your first project to start managing borings, teams, and IS 1892 reports.</div>
            <button
              onClick={() => setModalOpen(true)}
              className="py-[9px] px-4 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors"
            >
              + Create project
            </button>
          </div>
        )}
      </div>

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} geotechOrgs={geotechOrgs} user={user} orgType={orgType} />
    </div>
  );
}
