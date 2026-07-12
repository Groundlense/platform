"use server";

import { apiGet, apiPost, ApiError } from "@/lib/api";
import { getToken } from "@/lib/session";

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export interface CreateCrewMemberForm {
  firstName: string;
  lastName?: string;
  mobile: string;
  employeeCode?: string;
  roleCode: string;
  designation?: string;
}

export interface CreateCrewMemberResult {
  success: boolean;
  user?: any;
  /** One-time credential for email/employee-code login. Null for already-registered users. */
  oneTimePassword?: string | null;
  /** True when the mobile number matched an already-registered user. */
  isExisting?: boolean;
  /** API error message, verbatim (e.g. "Project setup is locked"). */
  error?: string;
}

/**
 * Crew onboarding: creates the user in the caller's organization
 * (POST /users), then adds them to the project (POST /projects/:id/members).
 * organizationId is resolved server-side from the authenticated user.
 */
export async function createCrewMemberAction(
  projectId: string,
  form: CreateCrewMemberForm
): Promise<CreateCrewMemberResult> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated — please log in again." };

  let organizationId: string | undefined;
  try {
    const me = await apiGet<any>("/auth/me", token);
    organizationId = me?.organizationId;
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Could not load your profile.") };
  }
  if (!organizationId) {
    return { success: false, error: "Your account has no organization — cannot create crew members." };
  }

  let created: any;
  try {
    created = await apiPost<any>(
      "/users",
      {
        organizationId,
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        mobile: form.mobile,
        employeeCode: form.employeeCode || undefined,
        roleCode: form.roleCode,
        designation: form.designation || undefined,
      },
      token
    );
  } catch (err) {
    return { success: false, error: toErrorMessage(err, "Failed to create user.") };
  }

  // POST /users returns { user, oneTimePassword } for new users, or the
  // existing user object (with isExisting: true) when the mobile matched.
  const user = created?.user ?? created;
  const oneTimePassword: string | null = created?.oneTimePassword ?? null;
  const isExisting: boolean = created?.isExisting === true;

  if (!user?.id) {
    return { success: false, error: "User was created but no user ID was returned." };
  }

  try {
    await apiPost<any>(`/projects/${projectId}/members`, { userId: user.id }, token);
  } catch (err) {
    // User exists but could not join the project (e.g. setup locked, already a member).
    return {
      success: false,
      user,
      oneTimePassword,
      isExisting,
      error: toErrorMessage(err, "Failed to add the new user to the project."),
    };
  }

  return { success: true, user, oneTimePassword, isExisting };
}

/**
 * Members of one team (with user details incl. mobile) — [] on failure,
 * for honest empty states in the borehole-assignment share panel.
 */
export async function fetchTeamMembersAction(teamId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const team = await apiGet<any>(`/teams/${teamId}`, token);
    return Array.isArray(team?.members) ? team.members : [];
  } catch {
    return [];
  }
}
