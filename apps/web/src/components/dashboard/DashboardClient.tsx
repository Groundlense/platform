"use client";

import { useState, useEffect } from "react";
import DashboardTopbar from "./DashboardTopbar";
import ProjectSearch from "./ProjectSearch";
import SummaryRow from "./SummaryRow";
import ProjectCard from "./ProjectCard";
import NewProjectCard from "./NewProjectCard";
import NewProjectModal from "./NewProjectModal";
import { getJoinRequestsAction, approveJoinRequestAction, rejectJoinRequestAction } from "@/app/actions/auth";

interface DashboardClientProps {
  projects: any[];
  summary: { projects: number; boreholes: number; intervals: number; samples: number; media: number };
  user: Record<string, unknown> | null;
  orgType: string | null;
  geotechOrgs: { id: string; name: string; type: string; city: string | null; state: string | null }[];
}

export default function DashboardClient({ projects, summary, user, orgType, geotechOrgs }: DashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const isAdmin = user && ((user as any).roles?.includes("GEOTECH_ADMIN") || (user as any).roles?.includes("EPC_ADMIN"));

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await getJoinRequestsAction();
      setJoinRequests(res);
    } catch (err) {
      console.error("Failed to load join requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    try {
      const res = await approveJoinRequestAction(reqId);
      if (res.error) {
        alert(res.error);
      } else {
        setJoinRequests(joinRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const res = await rejectJoinRequestAction(reqId);
      if (res.error) {
        alert(res.error);
      } else {
        setJoinRequests(joinRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to reject request.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <DashboardTopbar user={user} />

      {/* Dashboard body — matches .dash-body: padding 24px 28px */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>

        <ProjectSearch projects={projects} orgType={orgType} />

        {/* Pending Join Requests section */}
        {isAdmin && joinRequests.length > 0 && (
          <div className="bg-bg-card border border-border rounded-xl p-5 mb-5 shadow-sm animate-fade-up">
            <h3 className="font-display text-[15px] font-semibold text-text-pri mb-3 flex items-center gap-[6px]">
              <span>🔔</span> Pending Join Requests ({joinRequests.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {joinRequests.map((req) => (
                <div key={req.id} className="border border-border rounded-lg p-3 bg-bg-base flex items-center justify-between text-[11px]">
                  <div>
                    <div className="font-semibold text-text-pri">{req.user.firstName} {req.user.lastName || ""}</div>
                    <div className="text-text-sec mt-[2px]">{req.user.email} · {req.user.mobile}</div>
                    <div className="text-text-ter mt-[2px]">
                      Requested Role: <strong className="text-rust-d font-medium">{req.roleCode.replace("_", " ")}</strong>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="py-[6px] px-3 bg-green-600 hover:bg-green-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="py-[6px] px-3 bg-red-600 hover:bg-red-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
