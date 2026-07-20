import { apiGet, apiPost, apiPatch } from "../api";

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
export async function login(identifier: string, password: string) {
  return apiPost<{ accessToken: string; refreshToken: string }>("/auth/login", { identifier, password });
}

export async function refreshTokens(refreshToken: string) {
  return apiPost<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken });
}

export async function logoutApi(refreshToken: string) {
  return apiPost<{ success: boolean }>("/auth/logout", { refreshToken });
}

export async function getMe(token: string) {
  return apiGet<Record<string, unknown>>("/auth/me", token);
}

// ═══════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════
/** Company directory for pickers — optional ?type= filter (e.g. GEOTECH_CONTRACTOR). */
export async function getOrganizations(token: string, type?: string) {
  return apiGet<{ id: string; name: string; type: string; city: string | null; state: string | null }[]>(
    `/organizations${type ? `?type=${encodeURIComponent(type)}` : ""}`,
    token
  );
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
export async function getDashboardSummary(token: string) {
  return apiGet<{ projects: number; boreholes: number; intervals: number; samples: number; media: number }>("/dashboard/summary", token);
}

export async function getProjectDashboard(projectId: string, token: string) {
  return apiGet<{
    projectId: string;
    projectName: string;
    boreholes: number;
    intervals: number;
    completedIntervals: number;
    completionPercentage: number;
    samples: number;
    media: number;
  }>(`/dashboard/projects/${projectId}`, token);
}

// ═══════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════
export async function getProjects(token: string) {
  return apiGet<any[]>("/projects", token);
}

export async function getMyProjects(token: string) {
  return apiGet<any[]>("/projects/my-projects", token);
}

export async function createProject(data: Record<string, unknown>, token: string) {
  return apiPost<any>("/projects", data, token);
}

export async function updateProject(projectId: string, data: Record<string, unknown>, token: string) {
  return apiPatch<any>(`/projects/${projectId}`, data, token);
}

export async function getProjectMembers(projectId: string, token: string) {
  return apiGet<any[]>(`/projects/${projectId}/members`, token);
}

/** Whether project setup (boreholes/members/assignments) is frozen because fieldwork started. */
export async function getProjectSetupStatus(projectId: string, token: string) {
  return apiGet<{ locked: boolean }>(`/projects/${projectId}/setup-status`, token);
}

export async function addProjectMember(projectId: string, userId: string, token: string) {
  return apiPost(`/projects/${projectId}/members`, { userId }, token);
}

// ═══════════════════════════════════════
// BOREHOLES
// ═══════════════════════════════════════
export async function getProjectBoreholes(projectId: string, token: string) {
  return apiGet<any[]>(`/projects/${projectId}/boreholes`, token);
}

export async function getBorehole(id: string, token: string) {
  return apiGet<any>(`/boreholes/${id}`, token);
}

export async function createBorehole(projectId: string, data: Record<string, unknown>, token: string) {
  return apiPost<any>(`/projects/${projectId}/boreholes`, data, token);
}

export async function updateBoreholeStatus(id: string, status: string, token: string) {
  return apiPatch(`/boreholes/${id}/status`, { status }, token);
}

export async function assignBorehole(id: string, data: Record<string, unknown>, token: string) {
  return apiPatch(`/boreholes/${id}/assignment`, data, token);
}

/** Corrects a borehole's coordinates in place (already-converted decimal degrees). */
export async function updateBoreholeLocation(id: string, data: { latitude: string; longitude: string }, token: string) {
  return apiPatch(`/boreholes/${id}/location`, data, token);
}

export async function getBoreholeReportData(id: string, token: string) {
  return apiGet<any>(`/boreholes/${id}/report-data`, token);
}

/** Batched report data for every borehole in a project (one call, includes
 *  labResult per sample) — use instead of getBoreholeReportData per-borehole. */
export async function getProjectReportData(projectId: string, token: string) {
  return apiGet<any[]>(`/projects/${projectId}/report-data`, token);
}

// ═══════════════════════════════════════
// INTERVALS
// ═══════════════════════════════════════
export async function getBoreholeIntervals(boreholeId: string, token: string) {
  return apiGet<any[]>(`/boreholes/${boreholeId}/intervals`, token);
}

export async function updateInterval(intervalId: string, data: Record<string, unknown>, token: string) {
  return apiPatch(`/intervals/${intervalId}`, data, token);
}

// ═══════════════════════════════════════
// SOIL DESCRIPTIONS
// ═══════════════════════════════════════
export async function getSoilDescription(intervalId: string, token: string) {
  return apiGet<any>(`/intervals/${intervalId}/soil-description`, token);
}

export async function upsertSoilDescription(intervalId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/intervals/${intervalId}/soil-description`, data, token);
}

// ═══════════════════════════════════════
// SAMPLES
// ═══════════════════════════════════════
export async function getIntervalSamples(intervalId: string, token: string) {
  return apiGet<any[]>(`/intervals/${intervalId}/samples`, token);
}

export async function createSample(intervalId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/intervals/${intervalId}/samples`, data, token);
}

// ═══════════════════════════════════════
// LAB RESULTS
// ═══════════════════════════════════════
export async function getLabResult(sampleId: string, token: string) {
  return apiGet<any>(`/samples/${sampleId}/lab-results`, token);
}

export async function submitLabResult(sampleId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/samples/${sampleId}/lab-results`, data, token);
}

// ═══════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════
export async function getIntervalMedia(intervalId: string, token: string) {
  return apiGet<any[]>(`/intervals/${intervalId}/media`, token);
}

// ═══════════════════════════════════════
// WATER TABLE
// ═══════════════════════════════════════
export async function getWaterTableObservations(boreholeId: string, token: string) {
  return apiGet<any[]>(`/boreholes/${boreholeId}/water-table`, token);
}

export async function createWaterTableObservation(boreholeId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/boreholes/${boreholeId}/water-table`, data, token);
}

// ═══════════════════════════════════════
// BORING SESSIONS
// ═══════════════════════════════════════
export async function getBoreholesSessions(boreholeId: string, token: string) {
  return apiGet<any[]>(`/boreholes/${boreholeId}/sessions`, token);
}

// ═══════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════
export async function getOrgTeams(organizationId: string, token: string, projectId?: string) {
  const query = projectId ? `?projectId=${projectId}` : "";
  return apiGet<any[]>(`/organizations/${organizationId}/teams${query}`, token);
}

export async function createTeam(organizationId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/organizations/${organizationId}/teams`, data, token);
}

export async function getTeam(teamId: string, token: string) {
  return apiGet<any>(`/teams/${teamId}`, token);
}

export async function addTeamMember(teamId: string, userId: string, token: string) {
  return apiPost(`/teams/${teamId}/members`, { userId }, token);
}

export async function getTeamDashboard(teamId: string, token: string) {
  return apiGet<any>(`/teams/${teamId}/dashboard`, token);
}

// ═══════════════════════════════════════
// SITES
// ═══════════════════════════════════════
export async function getProjectSites(projectId: string, token: string) {
  return apiGet<any[]>(`/projects/${projectId}/sites`, token);
}

export async function createSite(projectId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/projects/${projectId}/sites`, data, token);
}

export async function getSite(siteId: string, token: string) {
  return apiGet<any>(`/sites/${siteId}`, token);
}

export async function getSiteDashboard(siteId: string, token: string) {
  return apiGet<any>(`/sites/${siteId}/dashboard`, token);
}

// ═══════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════
export async function getActivityLogs(token: string) {
  return apiGet<any[]>("/activity-logs", token);
}

export async function getRecentLogs(token: string) {
  return apiGet<any[]>("/activity-logs/recent", token);
}

export async function getUserActivityLogs(userId: string, token: string) {
  return apiGet<any[]>(`/activity-logs/user/${userId}`, token);
}

// ═══════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════
export async function createPayment(data: Record<string, unknown>, token: string) {
  return apiPost<any>("/payments", data, token);
}

export async function verifyPayment(paymentId: string, data: Record<string, unknown>, token: string) {
  return apiPatch(`/payments/${paymentId}/verify`, data, token);
}

// ═══════════════════════════════════════
// USERS
// ═══════════════════════════════════════
export async function getUsers(token: string) {
  return apiGet<any[]>("/users", token);
}

export async function createUser(data: Record<string, unknown>, token: string) {
  return apiPost("/users", data, token);
}

/** Lookup-only check used to autofill name fields before creating a crew member. */
export async function findUserByMobile(mobile: string, token: string) {
  return apiGet<{ found: boolean; user: any | null }>(`/users/by-mobile/${encodeURIComponent(mobile)}`, token);
}

// ═══════════════════════════════════════
// NABL LABS
// ═══════════════════════════════════════
export async function getNablLabs(token: string) {
  return apiGet<any[]>("/nabl-labs", token);
}

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════
export async function getNotifications(token: string) {
  return apiGet<any[]>("/notifications", token);
}

export async function markNotificationAsRead(id: string, token: string) {
  return apiPatch<any>(`/notifications/${id}/read`, {}, token);
}

// ═══════════════════════════════════════
// GLOBAL SEARCH & PROJECT JOIN REQUESTS
// ═══════════════════════════════════════
export async function globalSearchProjects(query: string, token: string) {
  return apiGet<any[]>(`/projects/global-search?query=${encodeURIComponent(query)}`, token);
}

export async function requestJoinProject(projectId: string, token: string) {
  return apiPost<any>(`/projects/${projectId}/join-request`, {}, token);
}

export async function getPendingProjectJoinRequests(token: string) {
  return apiGet<any[]>("/projects/join-requests/pending", token);
}

export async function approveProjectJoinRequest(requestId: string, token: string) {
  return apiPost<any>(`/projects/join-requests/${requestId}/approve`, {}, token);
}

export async function rejectProjectJoinRequest(requestId: string, token: string) {
  return apiPost<any>(`/projects/join-requests/${requestId}/reject`, {}, token);
}
