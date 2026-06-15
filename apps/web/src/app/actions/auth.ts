"use server";

import { redirect } from "next/navigation";
import { apiPost, apiGet, ApiError } from "@/lib/api";
import { setSession, clearSession, getToken } from "@/lib/session";

/** Only allow same-origin path redirects (e.g. "/projects/abc/portal"). */
function safeRedirectTarget(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/dashboard";
}

export async function loginAction(formData: FormData) {
  const identifier = (formData.get("identifier") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const redirectTo = safeRedirectTarget(formData.get("redirect"));

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
    if (err instanceof ApiError) {
      return {
        error:
          err.status === 401
            ? "Invalid email or password."
            : err.message,
      };
    }
    return { error: "Unable to reach the server. Please try again." };
  }

  // redirect() is called outside the try/catch so its control-flow error
  // (NEXT_REDIRECT) is never swallowed.
  redirect(redirectTo);
}

/**
 * Public company self-registration: creates the organization + first admin
 * user via POST /auth/register, then starts a session exactly like loginAction.
 */
export async function registerAction(formData: FormData) {
  const orgName = (formData.get("orgName") as string | null)?.trim();
  const orgType = (formData.get("orgType") as string | null)?.trim();
  const gstin = (formData.get("gstin") as string | null)?.trim();
  const city = (formData.get("city") as string | null)?.trim();
  const state = (formData.get("state") as string | null)?.trim();
  const firstName = (formData.get("firstName") as string | null)?.trim();
  const lastName = (formData.get("lastName") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const mobile = (formData.get("mobile") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!orgName) return { error: "Company name is required." };
  if (!orgType) return { error: "Organization type is required." };
  if (!firstName) return { error: "First name is required." };
  if (!email) return { error: "Work email is required." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const result = await apiPost<{ accessToken: string; refreshToken: string }>(
      "/auth/register",
      {
        organization: {
          name: orgName,
          type: orgType,
          ...(gstin ? { gstin } : {}),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
        },
        admin: {
          firstName,
          ...(lastName ? { lastName } : {}),
          email,
          password,
          ...(mobile ? { mobile } : {}),
        },
      }
    );

    // Same session bootstrap as loginAction
    const user = await apiGet<Record<string, unknown>>("/auth/me", result.accessToken);
    await setSession(result.accessToken, result.refreshToken, user);
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      // 409 carries the duplicate email / GSTIN message from the server
      return { error: err.message };
    }
    return { error: "Unable to reach the server. Please try again." };
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
