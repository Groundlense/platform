import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects } from "@/lib/api/endpoints";
import PortalLayoutClient from "@/components/portal/PortalLayoutClient";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const token = await getToken();
  const user = await getCurrentUser();

  let projects: any[] = [];
  let currentProject: any = null;

  if (token) {
    try {
      projects = await getProjects(token);
      currentProject = projects.find((p: any) => p.id === projectId) || null;
    } catch (err) {
      console.error("Portal layout fetch error:", err);
    }
  }

  return (
    <PortalLayoutClient
      project={currentProject}
      projects={projects}
      user={user}
    >
      {children}
    </PortalLayoutClient>
  );
}
