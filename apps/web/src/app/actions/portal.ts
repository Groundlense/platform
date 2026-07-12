"use server";

import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api";
import { getToken } from "@/lib/session";


export interface PortalActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export type ReviewActionType = "APPROVE" | "REJECT" | "MODIFY_N";

/**
 * Engineer review on an interval — POST /intervals/:id/reviews.
 * APPROVE / REJECT persist the decision; MODIFY_N updates the interval's
 * nValue server-side (mandatory isCodeReason) and appends an audit remark.
 */
export async function createIntervalReview(
  intervalId: string,
  payload: {
    action: ReviewActionType;
    nValueNew?: number;
    isCodeReason?: string;
    comments?: string;
  }
): Promise<PortalActionResult> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const review = await apiPost<any>(`/intervals/${intervalId}/reviews`, payload, token);
    return { success: true, data: review };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to submit review.") };
  }
}

/**
 * Review history for one interval — [] on failure for honest empty states.
 */
export async function fetchIntervalReviews(intervalId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const reviews = await apiGet<any[]>(`/intervals/${intervalId}/reviews`, token);
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

/**
 * All engineer reviews for a borehole (interval-scoped reviews carry a
 * "[interval:<id>]" prefix in comments) — [] on failure.
 */
export async function fetchBoreholeReviews(boreholeId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const reviews = await apiGet<any[]>(`/boreholes/${boreholeId}/reviews`, token);
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

export interface BoreholeIntegrity {
  valid: boolean;
  intervalCount: number;
  brokenAt: number[];
  unhashed: number;
  chainRoot: string | null;
  waterTable: { total: number; invalid: number; unhashed: number };
}

/**
 * SHA-256 tamper-chain verification — GET /boreholes/:id/integrity.
 * Returns null on failure (e.g. missing REPORT_VIEW) so the report tab can
 * render an honest "could not verify" state.
 */
export async function fetchBoreholeIntegrity(boreholeId: string): Promise<BoreholeIntegrity | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await apiGet<BoreholeIntegrity>(`/boreholes/${boreholeId}/integrity`, token);
  } catch {
    return null;
  }
}

/**
 * Submit NABL lab results for a sample.
 * POST /samples/:sampleId/lab-results — all fields below are required by the API.
 */
export async function submitSampleLabResult(
  sampleId: string,
  payload: {
    nablLabId: string;
    testType: string;
    testValues: Record<string, unknown>;
    resultValues: Record<string, unknown>;
    reportNumber: string;
    reportPdfUrl: string;
    testedOn: string;
  }
): Promise<PortalActionResult> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const result = await apiPost<any>(`/samples/${sampleId}/lab-results`, payload, token);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to submit lab results.") };
  }
}

/**
 * Activity logs for one user (org-scoped on the server).
 * Returns [] on failure so the UI can render an honest empty state.
 */
export async function getUserActivityLogs(userId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const logs = await apiGet<any[]>(`/activity-logs/user/${userId}`, token);
    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

/**
 * Lab result for a sample — null when none exists (API returns 404) or on failure.
 */
export async function fetchSampleLabResult(sampleId: string): Promise<any | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await apiGet<any>(`/samples/${sampleId}/lab-results`, token);
  } catch {
    return null;
  }
}

export async function createTeamAction(
  organizationId: string,
  payload: { code: string; name: string; description?: string; projectId?: string }
): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const team = await apiPost<any>(`/organizations/${organizationId}/teams`, payload, token);
    return { success: true, data: team };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to create team.") };
  }
}

export async function addTeamMemberAction(
  teamId: string,
  userId: string
): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiPost<any>(`/teams/${teamId}/members`, { userId }, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to add team member.") };
  }
}

export async function fetchOrgTeams(organizationId: string, projectId?: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const query = projectId ? `?projectId=${projectId}` : "";
    const teams = await apiGet<any[]>(`/organizations/${organizationId}/teams${query}`, token);
    return Array.isArray(teams) ? teams : [];
  } catch {
    return [];
  }
}

export async function addProjectMemberAction(
  projectId: string,
  userId: string
): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiPost<any>(`/projects/${projectId}/members`, { userId }, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to add project member.") };
  }
}

export async function createUserAction(payload: {
  organizationId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  employeeCode?: string;
  roleCode: string;
  designation?: string;
  userType?: string;
  preferredLanguage?: string;
}): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiPost<any>("/users", payload, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to create user.") };
  }
}

export async function sendOtpAction(payload: {
  type: "EMAIL" | "MOBILE";
  target: string;
}): Promise<PortalActionResult<any>> {
  try {
    const res = await apiPost<any>("/auth/send-otp", payload);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to send OTP.") };
  }
}

export async function verifyOtpAction(payload: {
  type: "EMAIL" | "MOBILE";
  target: string;
  code: string;
}): Promise<PortalActionResult<any>> {
  try {
    const res = await apiPost<any>("/auth/verify-otp", payload);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to verify OTP.") };
  }
}

export async function deleteTeamAction(teamId: string): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiDelete<any>(`/teams/${teamId}`, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to delete team.") };
  }
}

export async function updateUserProfileAction(
  userId: string,
  payload: { email?: string; mobile?: string }
): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiPatch<any>(`/users/${userId}/profile`, payload, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to update profile.") };
  }
}

export async function deleteTeamMemberAction(teamId: string, userId: string): Promise<PortalActionResult<any>> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };
  try {
    const res = await apiDelete<any>(`/teams/${teamId}/members/${userId}`, token);
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to remove crew member.") };
  }
}



