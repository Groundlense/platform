"use server";

import { apiPost, ApiError } from "@/lib/api";

export async function contactAction(data: {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
}) {
  try {
    await apiPost("/auth/contact", data);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to reach the server. Please try again." };
  }
}
