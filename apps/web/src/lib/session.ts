"use server";

import { cookies } from "next/headers";

const TOKEN_KEY = "gl_token";
const REFRESH_KEY = "gl_refresh";
const USER_KEY = "gl_user";

export async function setSession(accessToken: string, refreshToken: string, user: Record<string, unknown>) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  cookieStore.set(REFRESH_KEY, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  cookieStore.set(USER_KEY, JSON.stringify(user), {
    httpOnly: false, // Readable by client for UI display
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_KEY)?.value;
}

export async function getSessionUser(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_KEY)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
  cookieStore.delete(REFRESH_KEY);
  cookieStore.delete(USER_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
