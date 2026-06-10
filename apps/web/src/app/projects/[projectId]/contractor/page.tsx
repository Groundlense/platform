import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects, getProjectBoreholes, getProjectDashboard, getProjectSites } from "@/lib/api/endpoints";
import ContractorClient from "@/components/contractor/ContractorClient";

export default async function ContractorPortalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const token = await getToken();
  const user = await getCurrentUser();

  let project: any = null;
  let boreholes: any[] = [];
  let dashboard: any = null;
  let sites: any[] = [];

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
  }

  return (
    <ContractorClient
      project={project}
      boreholes={boreholes}
      dashboard={dashboard}
      sites={sites}
      user={user}
    />
  );
}
