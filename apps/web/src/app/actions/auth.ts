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
    return { error: "Invalid credentials. Please check your email and password." };
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
