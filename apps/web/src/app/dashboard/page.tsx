import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects, getDashboardSummary, getOrganizations, getUsers } from "@/lib/api/endpoints";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GroundLense — Dashboard",
  description: "Manage your geotech boring projects.",
};

export default async function DashboardPage() {
  const token = await getToken();
  const user = await getCurrentUser();

  let projects: any[] = [];
  let summary = { projects: 0, boreholes: 0, intervals: 0, samples: 0, media: 0 };
  let geotechOrgs: any[] = [];
  let epcOrgs: any[] = [];
  let orgUsers: any[] = [];

  if (token) {
    try {
      [projects, summary, orgUsers] = await Promise.all([
        getProjects(token),
        getDashboardSummary(token),
        getUsers(token).catch(() => []),
      ]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }

    // Org directory for the new-project partner pickers — degrade to []
    try {
      [geotechOrgs, epcOrgs] = await Promise.all([
        getOrganizations(token, "GEOTECH_CONTRACTOR"),
        getOrganizations(token, "EPC_CONTRACTOR"),
      ]);
    } catch (err) {
      console.error("Organization directory fetch error:", err);
    }
  }

  const orgType: string | null = (user as any)?.organization?.type ?? null;

  return (
    <DashboardClient
      projects={projects}
      summary={summary}
      user={user}
      orgType={orgType}
      geotechOrgs={geotechOrgs}
      epcOrgs={epcOrgs}
      orgUsers={orgUsers}
    />
  );
}
