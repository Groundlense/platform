import { getToken } from "@/lib/session";
import { getCurrentUser } from "@/app/actions/auth";
import { getProjects, getDashboardSummary } from "@/lib/api/endpoints";
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

  if (token) {
    try {
      [projects, summary] = await Promise.all([
        getProjects(token),
        getDashboardSummary(token),
      ]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }

  return (
    <DashboardClient
      projects={projects}
      summary={summary}
      user={user}
    />
  );
}
