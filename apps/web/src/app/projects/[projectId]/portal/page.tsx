import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import {
  getProjects,
  getProjectBoreholes,
  getProjectSites,
  getBoreholeReportData,
  getProjectMembers,
  getNablLabs,
  getRecentLogs,
  getProjectDashboard,
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

  if (token) {
    try {
      // Phase 1: Core data (parallel)
      [projects, boreholes, sites] = await Promise.all([
        getProjects(token),
        getProjectBoreholes(projectId, token),
        getProjectSites(projectId, token),
      ]);
      currentProject = projects.find((p: any) => p.id === projectId) || null;

      // Phase 2: Extended data (parallel, wrapped in try-catch for graceful degradation)
      const [membersRes, labsRes, logsRes, dashboardRes] = await Promise.allSettled([
        getProjectMembers(projectId, token),
        getNablLabs(token),
        getRecentLogs(token),
        getProjectDashboard(projectId, token),
      ]);
      members = membersRes.status === "fulfilled" ? membersRes.value : [];
      nablLabs = labsRes.status === "fulfilled" ? labsRes.value : [];
      activityLogs = logsRes.status === "fulfilled" ? logsRes.value : [];
      projectDashboard = dashboardRes.status === "fulfilled" ? dashboardRes.value : null;

      // Phase 3: Fetch full report data for each borehole (includes intervals, samples, labResults, media, waterTable)
      if (boreholes.length > 0) {
        const reportResults = await Promise.allSettled(
          boreholes.map((bh: any) => getBoreholeReportData(bh.id, token))
        );
        boreholeReportData = reportResults
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value != null)
          .map((r) => r.value);
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
    />
  );
}
