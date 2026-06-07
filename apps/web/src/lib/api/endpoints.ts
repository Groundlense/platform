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

export async function getProjectMembers(projectId: string, token: string) {
  return apiGet<any[]>(`/projects/${projectId}/members`, token);
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

export async function getBoreholeReportData(id: string, token: string) {
  return apiGet<any>(`/boreholes/${id}/report-data`, token);
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
// SAMPLES
// ═══════════════════════════════════════
export async function getIntervalSamples(intervalId: string, token: string) {
  return apiGet<any[]>(`/intervals/${intervalId}/samples`, token);
}

export async function createSample(intervalId: string, data: Record<string, unknown>, token: string) {
  return apiPost(`/intervals/${intervalId}/samples`, data, token);
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
// TEAMS
// ═══════════════════════════════════════
export async function getOrgTeams(organizationId: string, token: string) {
  return apiGet<any[]>(`/organizations/${organizationId}/teams`, token);
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

// ═══════════════════════════════════════
// NABL LABS
// ═══════════════════════════════════════
export async function getNablLabs(token: string) {
  return apiGet<any[]>("/nabl-labs", token);
}
