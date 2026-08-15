"use client";

import { RiLogoutBoxRLine } from "react-icons/ri";
import { logoutAction } from "@/app/actions/auth";
import { getInitials } from "@/lib/utils";
import NotificationBell from "../notifications/NotificationBell";

interface DashboardTopbarProps {
  user: Record<string, unknown> | null;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
}

/* Matches .topbar: height 48px, bg-surface, border-bottom, padding 0 16px, gap 12px */
export default function DashboardTopbar({ user, showSettings, setShowSettings }: DashboardTopbarProps) {
  const firstName = (user?.firstName as string) || "";
  const lastName = (user?.lastName as string) || "";
  const orgName = (user as any)?.organization?.name || (user?.organizationId as string) || "";
  const orgType = (user as any)?.organization?.type || "";
  const employeeCode = (user?.employeeCode as string) || "";
  const initials = getInitials(firstName, lastName);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User";

  const roleLabel = orgType === "EPC_CONTRACTOR" ? "CONTRACTOR"
    : orgType === "GEOTECH_CONTRACTOR" ? "GEOTECH"
    : orgType === "IE_FIRM" ? "ENGINEER"
    : orgType === "NABL_LAB" ? "NABL LAB"
    : orgType || "USER";

  return (
    <div className="bg-bg-surface border-b border-border flex items-center shrink-0 sticky top-0 z-40" style={{ height: "58px", padding: "0 22px", gap: "14px" }}>
      {/* Logo */}
      <span className="font-display text-[16px] text-rust-d tracking-[0.3px]">GroundLense</span>

      {/* Role badge */}
      <span className="font-mono text-[8.5px] tracking-[0.14em]" style={{ background: "rgba(153,60,29,.2)", color: "var(--color-rust-d)", padding: "3px 8px", borderRadius: "4px", border: "0.5px solid rgba(153,60,29,.3)" }}>{roleLabel}</span>

      {/* Separator */}
      <div className="hidden sm:block" style={{ width: "1px", height: "22px", background: "var(--color-border)" }} />

      {/* Org name */}
      <span className="hidden sm:block text-[11.5px] text-text-sec truncate max-w-[220px]">{orgName}</span>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-[10px]">
        <NotificationBell />

        {employeeCode && (
          <div className="hidden lg:block font-mono text-[9.5px] text-amber-d" style={{ padding: "5px 10px", background: "rgba(186,117,23,.08)", border: "0.5px solid rgba(186,117,23,.2)", borderRadius: "6px" }}>
            {employeeCode}
          </div>
        )}

        {/* User pill */}
        <div className="flex items-center gap-[8px] bg-bg-card rounded-lg" style={{ border: "0.5px solid var(--color-border)", padding: "5px 11px" }}>
          <div className="rounded-full flex items-center justify-center text-[8.5px] font-bold text-rust-d" style={{ width: "22px", height: "22px", background: "rgba(153,60,29,.25)" }}>
            {initials}
          </div>
          <span className="hidden sm:block text-[11.5px] text-text-sec">{displayName}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-[3px] bg-bg-card rounded-lg p-[3px]" style={{ border: "0.5px solid var(--color-border)" }}>
          <button
            onClick={() => setShowSettings(false)}
            className={`text-[10.5px] border-none rounded-md cursor-pointer transition-all
              ${!showSettings
                ? "text-rust-d font-semibold bg-[rgba(153,60,29,.14)]"
                : "text-text-ter hover:text-text-sec bg-transparent"
              }`}
            style={{ padding: "5px 11px" }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className={`text-[10.5px] border-none rounded-md cursor-pointer transition-all
              ${showSettings
                ? "text-rust-d font-semibold bg-[rgba(153,60,29,.14)]"
                : "text-text-ter hover:text-text-sec bg-transparent"
              }`}
            style={{ padding: "5px 11px" }}
          >
            ⚙ Settings
          </button>
        </div>

        {/* Sign out */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[10.5px] bg-transparent border border-border rounded-lg text-text-ter cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all flex items-center gap-[5px]"
            style={{ padding: "6px 11px" }}
          >
            <RiLogoutBoxRLine /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
