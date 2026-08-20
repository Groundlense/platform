import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

/** Standard rate charged per borehole. Used by project creation and the dashboard cards. */
export const PRICE_PER_BORING = 15000;

/**
 * Volume packs — the discount is applied automatically once the boring count
 * reaches a pack's threshold. MUST stay in sync with the server-side table in
 * apps/api/src/payments/payments.service.ts (the server is authoritative for
 * the actual charge).
 */
export interface BoringPack {
  name: string;
  /** Minimum borings to qualify for this pack's rate. */
  minBorings: number;
  discountPct: number;
  pricePerBoring: number;
  tagline: string;
}

export const BORING_PACKS: BoringPack[] = [
  { name: "Starter Pack", minBorings: 20, discountPct: 10, pricePerBoring: 13500, tagline: "For single-site investigations" },
  { name: "Growth Pack", minBorings: 50, discountPct: 20, pricePerBoring: 12000, tagline: "For multi-site packages" },
  { name: "Mega Pack", minBorings: 100, discountPct: 40, pricePerBoring: 9000, tagline: "For highway & rail corridors" },
];

export interface BoringPricing {
  /** Pack the count qualifies for, or null at the standard rate. */
  pack: BoringPack | null;
  pricePerBoring: number;
  discountPct: number;
  /** Full price before any pack discount. */
  subtotal: number;
  savings: number;
  total: number;
}

/** Resolves the effective per-boring rate and totals for a given count. */
export function getBoringPricing(count: number): BoringPricing {
  let pack: BoringPack | null = null;
  for (const p of BORING_PACKS) {
    if (count >= p.minBorings) pack = p;
  }
  const pricePerBoring = pack ? pack.pricePerBoring : PRICE_PER_BORING;
  const subtotal = count * PRICE_PER_BORING;
  const total = count * pricePerBoring;
  return {
    pack,
    pricePerBoring,
    discountPct: pack ? pack.discountPct : 0,
    subtotal,
    savings: subtotal - total,
    total,
  };
}

export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
}

export function formatGLCode(type: string, id: string): string {
  return `GL-${type}-${id}`;
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Bounds mirror the API DTOs (0.5–10 m); one decimal place because the DB
// column is DECIMAL(4,1) and Postgres would otherwise round silently.
export function validateSptIntervalM(raw: string): string | null {
  const value = parseFloat(raw);
  if (!Number.isFinite(value) || value < 0.5 || value > 10) {
    return "SPT test interval must be between 0.5 and 10 m.";
  }
  if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-9) {
    return "SPT test interval supports at most one decimal place (e.g. 1.5 m).";
  }
  return null;
}
