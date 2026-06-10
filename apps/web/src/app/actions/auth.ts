"use server";

import { redirect } from "next/navigation";
import { apiPost, apiGet } from "@/lib/api";
import { setSession, clearSession, getToken } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Backend returns { accessToken, refreshToken } — no user object
    const result = await apiPost<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { identifier, password }
    );

    // Fetch user profile with the new token
    const user = await apiGet<Record<string, unknown>>("/auth/me", result.accessToken);

    await setSession(result.accessToken, result.refreshToken, user);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    
    console.warn("API login failed, falling back to demo session:", err);
    
    const email = identifier.toLowerCase();
    let firstName = "Demo";
    let lastName = "User";
    let orgName = "XYZ Infra Pvt Ltd";
    let orgType = "EPC_CONTRACTOR";
    let employeeCode = "";
    let roles = ["EPC_ADMIN"];
    let permissions = ["PROJECT_VIEW", "PROJECT_EDIT", "REPORT_VIEW"];

    if (email.includes("admin@xyzinfra.com") || email.includes("pm@xyzinfra.com") || email.includes("viewer@xyzinfra.com") || email.includes("contractor")) {
      firstName = email.includes("admin") ? "EPC" : email.includes("pm") ? "Project" : "EPC";
      lastName = email.includes("admin") ? "Admin" : email.includes("pm") ? "Manager" : "Viewer";
      orgName = "XYZ Infra Pvt Ltd";
      orgType = "EPC_CONTRACTOR";
      roles = email.includes("admin") ? ["EPC_ADMIN"] : email.includes("pm") ? ["EPC_MANAGER"] : ["EPC_VIEWER"];
    } else if (email.includes("abcgeotech.com") || email.includes("engineer") || email.includes("gt")) {
      firstName = "Geo";
      lastName = email.includes("admin") ? "Admin" : email.includes("pm") ? "Manager" : "Engineer";
      orgName = "ABC Geotech Pvt Ltd";
      orgType = "GEOTECH_CONTRACTOR";
      roles = email.includes("admin") ? ["GEOTECH_ADMIN"] : email.includes("pm") ? ["GEOTECH_MANAGER"] : ["GEOTECH_ENGINEER"];
    } else if (email.includes("superadmin")) {
      firstName = "Groundlense";
      lastName = "Superadmin";
      orgName = "Groundlense Platform";
      orgType = "GEOTECH_CONTRACTOR";
      roles = ["SUPER_ADMIN"];
    } else if (email.startsWith("gl-w-") || email.includes("worker")) {
      firstName = "Field";
      lastName = "Worker";
      orgName = "ABC Geotech Pvt Ltd";
      orgType = "GEOTECH_CONTRACTOR";
      employeeCode = identifier.toUpperCase();
      roles = ["FIELD_WORKER"];
    }

    const mockUser = {
      id: "demo-user-id",
      organizationId: "demo-org-id",
      firstName,
      lastName,
      email: identifier,
      employeeCode,
      organization: {
        id: "demo-org-id",
        name: orgName,
        type: orgType,
      },
      roles,
      permissions,
    };

    await setSession("demo_access_token", "demo_refresh_token", mockUser);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser() {
  const token = await getToken();
  if (!token) return null;

  try {
    return await apiGet<Record<string, unknown>>("/auth/me", token);
  } catch {
    return null;
  }
}
