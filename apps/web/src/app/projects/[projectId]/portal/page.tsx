import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects, getProjectBoreholes, getProjectSites } from "@/lib/api/endpoints";
import PortalClient from "@/components/portal/PortalClient";

export default async function PortalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const token = await getToken();
  const user = await getCurrentUser();

  let projects: any[] = [];
  let boreholes: any[] = [];
  let currentProject: any = null;
  let sites: any[] = [];

  if (token) {
    try {
      [projects, boreholes, sites] = await Promise.all([
        getProjects(token),
        getProjectBoreholes(projectId, token),
        getProjectSites(projectId, token),
      ]);
      currentProject = projects.find((p: any) => p.id === projectId) || null;
    } catch (err) {
      console.error("Portal fetch error:", err);
    }
  }

  return (
    <PortalClient
      project={currentProject}
      projects={projects}
      boreholes={boreholes}
      sites={sites}
      user={user}
    />
  );
}
