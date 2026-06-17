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

  redirect("/register/members");
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

export async function sendOtpAction(type: 'EMAIL' | 'MOBILE', target: string) {
  try {
    return await apiPost<any>("/auth/send-otp", { type, target });
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function verifyOtpAction(type: 'EMAIL' | 'MOBILE', target: string, code: string) {
  try {
    return await apiPost<any>("/auth/verify-otp", { type, target, code });
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function verifyGstAction(gstin: string) {
  try {
    return await apiGet<any>(`/auth/verify-gst/${gstin}`);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function uploadLogoAction(fd: FormData) {
  const token = await getToken();
  const file = fd.get("file");
  if (!file) return { error: "No file provided" };

  try {
    const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/auth/upload-logo`, {
      method: 'POST',
      headers,
      body: fd,
    });

    if (!res.ok) {
      const body = await res.json();
      return { error: body?.message || "Upload failed" };
    }

    return await res.json();
  } catch (err: any) {
    return { error: err.message || "Upload failed" };
  }
}

export async function joinRequestAction(fd: FormData) {
  const gstin = fd.get("gstin") as string;
  const firstName = fd.get("firstName") as string;
  const lastName = fd.get("lastName") as string;
  const email = fd.get("email") as string;
  const mobile = fd.get("mobile") as string;
  const password = fd.get("password") as string;
  const roleCode = fd.get("roleCode") as string;

  try {
    return await apiPost<any>("/auth/join-request", {
      gstin,
      firstName,
      lastName,
      email,
      mobile,
      password,
      roleCode
    });
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getInviteDetailsAction(token: string) {
  try {
    return await apiGet<any>(`/auth/invite/${token}`);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function acceptInviteAction(fd: FormData) {
  const token = fd.get("token") as string;
  const firstName = fd.get("firstName") as string;
  const lastName = fd.get("lastName") as string;
  const password = fd.get("password") as string;

  try {
    const result = await apiPost<{ accessToken: string; refreshToken: string }>(
      "/auth/accept-invite",
      { token, firstName, lastName, password }
    );

    const user = await apiGet<Record<string, unknown>>("/auth/me", result.accessToken);
    await setSession(result.accessToken, result.refreshToken, user);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function inviteMembersAction(members: any[]) {
  const token = await getToken();
  if (!token) return { error: "Unauthorized" };

  try {
    return await apiPost<any>("/organizations/invite-members", { members }, token);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getJoinRequestsAction() {
  const token = await getToken();
  if (!token) return [];

  try {
    return await apiGet<any[]>("/organizations/join-requests", token);
  } catch {
    return [];
  }
}

export async function approveJoinRequestAction(requestId: string) {
  const token = await getToken();
  if (!token) return { error: "Unauthorized" };

  try {
    return await apiPost<any>(`/organizations/join-requests/${requestId}/approve`, {}, token);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function rejectJoinRequestAction(requestId: string) {
  const token = await getToken();
  if (!token) return { error: "Unauthorized" };

  try {
    return await apiPost<any>(`/organizations/join-requests/${requestId}/reject`, {}, token);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    return await apiPost<any>("/auth/forgot-password", { email });
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function resetPasswordAction(fd: FormData) {
  const email = fd.get("email") as string;
  const code = fd.get("code") as string;
  const newPassword = fd.get("newPassword") as string;

  try {
    return await apiPost<any>("/auth/reset-password", { email, code, newPassword });
  } catch (err: any) {
    return { error: err.message };
  }
}
