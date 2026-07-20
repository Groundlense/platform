"use server";

import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/session";

/**
 * Payments for a project. Returns [] when unauthenticated or the API call fails
 * so the portal can render an honest empty state instead of crashing.
 */
export async function fetchProjectPayments(projectId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const payments = await apiGet<any[]>(`/projects/${projectId}/payments`, token);
    return Array.isArray(payments) ? payments : [];
  } catch {
    return [];
  }
}

/**
 * Full report data for one borehole (intervals incl. media + water table observations).
 * Returns null on failure (e.g. missing REPORT_VIEW permission) — callers treat that
 * as "no field data yet".
 */
export async function fetchBoreholeReportData(boreholeId: string): Promise<any | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await apiGet<any>(`/boreholes/${boreholeId}/report-data`, token);
  } catch {
    return null;
  }
}

/**
 * Batched report data for every borehole in a project — one call instead of
 * one fetchBoreholeReportData per borehole. Returns [] on failure.
 */
export async function fetchProjectReportData(projectId: string): Promise<any[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const reports = await apiGet<any[]>(`/projects/${projectId}/report-data`, token);
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}
