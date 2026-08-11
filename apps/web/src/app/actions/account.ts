"use server";

import { apiPost, ApiError } from "@/lib/api";

export async function deleteAccountRequestAction(data: {
  name: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  organization?: string;
  reason?: string;
}) {
  try {
    await apiPost("/auth/delete-account-request", data);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to reach the server. Please try again." };
  }
}
