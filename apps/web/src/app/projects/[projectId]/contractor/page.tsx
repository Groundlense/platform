import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects, getProjectBoreholes, getProjectDashboard, getProjectSites } from "@/lib/api/endpoints";
import { fetchProjectPayments, fetchProjectReportData } from "@/app/actions/contractor";
import ContractorClient from "@/components/contractor/ContractorClient";

export default async function ContractorPortalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const token = await getToken();
  const user = await getCurrentUser();

  let project: any = null;
  let boreholes: any[] = [];
  let dashboard: any = null;
  let sites: any[] = [];
  let payments: any[] = [];
  const reportData: Record<string, any> = {};

  if (token) {
    try {
      const [projects, bh, dash, s] = await Promise.all([
        getProjects(token),
        getProjectBoreholes(projectId, token),
        getProjectDashboard(projectId, token),
        getProjectSites(projectId, token),
      ]);
      project = projects.find((p: any) => p.id === projectId) || null;
      boreholes = bh;
      dashboard = dash;
      sites = s;
    } catch (err) {
      console.error("Contractor portal fetch error:", err);
    }

    try {
      const [pays, reports] = await Promise.all([
        fetchProjectPayments(projectId),
        fetchProjectReportData(projectId),
      ]);
      payments = pays;
      reports.forEach((report) => {
        if (report) reportData[report.id] = report;
      });
    } catch (err) {
      console.error("Contractor portal detail fetch error:", err);
    }
  }

  return (
    <ContractorClient
      project={project}
      boreholes={boreholes}
      dashboard={dashboard}
      sites={sites}
      user={user}
      payments={payments}
      reportData={reportData}
    />
  );
}
