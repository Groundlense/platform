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
  getLabResult,
  getOrgTeams,
  getUsers,
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
      const [membersRes, labsRes, logsRes, dashboardRes, usersRes] = await Promise.allSettled([
        getProjectMembers(projectId, token),
        getNablLabs(token),
        getRecentLogs(token),
        getProjectDashboard(projectId, token),
        getUsers(token),
      ]);
      members = membersRes.status === "fulfilled" ? membersRes.value : [];
      nablLabs = labsRes.status === "fulfilled" ? labsRes.value : [];
      activityLogs = logsRes.status === "fulfilled" ? logsRes.value : [];
      projectDashboard = dashboardRes.status === "fulfilled" ? dashboardRes.value : null;
      orgUsers = usersRes.status === "fulfilled" ? usersRes.value : [];

      // Fetch teams if organizationId is present
      const orgId = user?.organizationId as string | undefined;
      if (orgId) {
        try {
          teams = await getOrgTeams(orgId, token);
        } catch (err) {
          console.warn("Failed to fetch teams:", err);
        }
      }

      // Phase 3: Fetch full report data for each borehole (includes intervals, samples, labResults, media, waterTable)
      if (boreholes.length > 0) {
        const reportResults = await Promise.allSettled(
          boreholes.map((bh: any) => getBoreholeReportData(bh.id, token))
        );
        boreholeReportData = reportResults
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value != null)
          .map((r) => r.value);

        // Phase 4: attach real lab results to each sample (404 → no result yet)
        const sampleIds: string[] = boreholeReportData.flatMap((bh: any) =>
          (bh.intervals || []).flatMap((iv: any) => (iv.samples || []).map((s: any) => s.id))
        );
        if (sampleIds.length > 0) {
          const labResultsRes = await Promise.allSettled(
            sampleIds.map((id) => getLabResult(id, token))
          );
          const resultsBySample = new Map<string, any>();
          sampleIds.forEach((id, i) => {
            const r = labResultsRes[i];
            if (r.status === "fulfilled" && r.value != null) resultsBySample.set(id, r.value);
          });
          boreholeReportData = boreholeReportData.map((bh: any) => ({
            ...bh,
            intervals: (bh.intervals || []).map((iv: any) => ({
              ...iv,
              samples: (iv.samples || []).map((s: any) => ({
                ...s,
                labResult: resultsBySample.get(s.id) ?? null,
              })),
            })),
          }));
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
    />
  );
}
