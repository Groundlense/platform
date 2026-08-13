"use server";

import { apiPost, ApiError } from "@/lib/api";

/** Completes a WhatsApp PIN-reset link — public, token-authenticated. */
export async function completePinResetAction(data: {
  token: string;
  mobile: string;
  newPassword: string;
}) {
  try {
    await apiPost("/auth/pin-reset/complete", data);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to reach the server. Please try again." };
  }
}

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
