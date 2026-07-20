import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import {
  getProjects,
  getProjectBoreholes,
  getProjectSites,
  getProjectReportData,
  getProjectMembers,
  getNablLabs,
  getRecentLogs,
  getProjectDashboard,
  getOrgTeams,
  getUsers,
  getPendingProjectJoinRequests,
  getProjectSetupStatus,
} from "@/lib/api/endpoints";
import PortalClient from "@/components/portal/PortalClient";

export default async function PortalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const token = await getToken();
  const user = await getCurrentUser();

  let projects: any[] = [];
  let boreholes: any[] = [];
  let currentProject: any = null;
  let sites: any[] = [];
  let boreholeReportData: any[] = [];
  let members: any[] = [];
  let nablLabs: any[] = [];
  let activityLogs: any[] = [];
  let projectDashboard: any = null;
  let teams: any[] = [];
  let orgUsers: any[] = [];
  let pendingRequests: any[] = [];
  let setupLocked = false;

  if (token) {
    try {
      // Phase 1: Core data (parallel)
      const [projectsRes, boreholesRes, sitesRes, setupStatusRes] = await Promise.all([
        getProjects(token),
        getProjectBoreholes(projectId, token),
        getProjectSites(projectId, token),
        getProjectSetupStatus(projectId, token).catch(() => null),
      ]);
      projects = projectsRes;
      boreholes = boreholesRes;
      sites = sitesRes;
      setupLocked = setupStatusRes?.locked === true;
      currentProject = projects.find((p: any) => p.id === projectId) || null;

      // Phase 2: Extended data (parallel, wrapped in try-catch for graceful degradation)
      const [membersRes, labsRes, logsRes, dashboardRes, usersRes, requestsRes] = await Promise.allSettled([
        getProjectMembers(projectId, token),
        getNablLabs(token),
        getRecentLogs(token),
        getProjectDashboard(projectId, token),
        getUsers(token),
        getPendingProjectJoinRequests(token),
      ]);
      members = membersRes.status === "fulfilled" ? membersRes.value : [];
      nablLabs = labsRes.status === "fulfilled" ? labsRes.value : [];
      activityLogs = logsRes.status === "fulfilled" ? logsRes.value : [];
      projectDashboard = dashboardRes.status === "fulfilled" ? dashboardRes.value : null;
      orgUsers = usersRes.status === "fulfilled" ? usersRes.value : [];
      pendingRequests = requestsRes.status === "fulfilled" ? requestsRes.value : [];

      // Filter pending requests to show only ones for the current project
      pendingRequests = pendingRequests.filter((r: any) => r.projectId === projectId);


      // Fetch teams if organizationId is present
      const orgId = user?.organizationId as string | undefined;
      if (orgId) {
        try {
          teams = await getOrgTeams(orgId, token, projectId);
        } catch (err) {
          console.warn("Failed to fetch teams:", err);
        }
      }

      // Phase 3: Full report data for every borehole in one batched call
      // (intervals, samples incl. labResult, media, waterTable) — replaces
      // what used to be a separate HTTP round trip per borehole plus another
      // per sample, which got very heavy on projects with many boreholes and
      // re-ran on every 30s background poll.
      if (boreholes.length > 0) {
        try {
          boreholeReportData = await getProjectReportData(projectId, token);
        } catch (err) {
          console.warn("Failed to fetch project report data:", err);
        }
      }
    } catch (err) {
      console.error("Portal fetch error:", err);
    }
  }

  return (
    <PortalClient
      project={currentProject}
      projects={projects}
      boreholes={boreholeReportData.length > 0 ? boreholeReportData : boreholes}
      sites={sites}
      user={user}
      members={members}
      nablLabs={nablLabs}
      activityLogs={activityLogs}
      projectDashboard={projectDashboard}
      teams={teams}
      orgUsers={orgUsers}
      pendingRequests={pendingRequests}
      setupLocked={setupLocked}
    />
  );
}
