"use server";

import { getToken } from "@/lib/session";
import { createProject, createBorehole } from "@/lib/api/endpoints";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData) {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  const projectCode = formData.get("projectCode") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const geotechOrganizationId = formData.get("geotechOrganizationId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!projectCode || !name || !geotechOrganizationId) {
    return { error: "Project code, name, and geotech organization are required." };
  }

  try {
    const project = await createProject(
      {
        projectCode,
        name,
        description: description || undefined,
        geotechOrganizationId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      token
    );
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create project";
    return { error: message };
  }
}

export async function createBoreholeAction(formData: FormData) {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  const projectId = formData.get("projectId") as string;
  const boreholeCode = formData.get("boreholeCode") as string;
  const name = formData.get("name") as string;
  const plannedDepth = formData.get("plannedDepth") as string;
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;

  if (!projectId || !boreholeCode) {
    return { error: "Project ID and borehole code are required." };
  }

  try {
    const borehole = await createBorehole(
      projectId,
      {
        boreholeCode,
        name: name || undefined,
        plannedDepth: plannedDepth ? parseFloat(plannedDepth) : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      },
      token
    );
    revalidatePath(`/projects/${projectId}/portal`);
    return { success: true, borehole };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create borehole";
    return { error: message };
  }
}
