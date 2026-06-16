"use server";

import { getToken } from "@/lib/session";
import { createProject, createBorehole, createPayment } from "@/lib/api/endpoints";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData) {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  const name = (formData.get("name") as string | null)?.trim();
  const state = (formData.get("state") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const geotechOrganizationId = (formData.get("geotechOrganizationId") as string | null)?.trim();
  const startDate = formData.get("startDate") as string | null;
  const endDate = formData.get("endDate") as string | null;

  if (!name || !geotechOrganizationId) {
    return { error: "Project name and geotech organization are required." };
  }

  // The backend has no auto-generation for projectCode (it is a required,
  // unique column) — generate a real, persisted code here.
  const projectCode =
    (formData.get("projectCode") as string | null)?.trim() ||
    `GL-PRJ-${Date.now().toString(36).toUpperCase()}`;

  // NOTE: CreateProjectDto does not accept `state` (ValidationPipe runs with
  // forbidNonWhitelisted), so the selected state is preserved in description.
  const fullDescription =
    [description, state ? `State: ${state}` : null].filter(Boolean).join(" · ") || undefined;

  try {
    const project = await createProject(
      {
        projectCode,
        name,
        description: fullDescription,
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

export async function createPaymentAction(formData: FormData) {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  const projectId = formData.get("projectId") as string | null;
  const boringsPurchased = parseInt(formData.get("boringsPurchased") as string, 10);
  const amountPaid = parseFloat(formData.get("amountPaid") as string);

  if (!projectId || !Number.isFinite(boringsPurchased) || !Number.isFinite(amountPaid)) {
    return { error: "Project, boring count, and amount are required." };
  }

  try {
    // Razorpay checkout is not integrated yet, so no real Razorpay order id
    // exists. The backend requires the field; record a local reference and
    // leave the payment PENDING (verification requires a real Razorpay
    // signature and cannot be faked).
    const payment = await createPayment(
      {
        projectId,
        planType: "PER_BORING",
        boringsPurchased,
        amountPaid,
        razorpayOrderId: `local_${projectId}_${Date.now()}`,
      },
      token
    );
    revalidatePath("/dashboard");
    return { success: true, payment };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment";
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
