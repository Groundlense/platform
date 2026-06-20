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
    <div className="bg-bg-surface border-b border-border flex items-center shrink-0" style={{ height: "48px", padding: "0 16px", gap: "12px" }}>
      {/* Logo — matches .tb-logo */}
      <span className="font-display text-[15px] text-rust-d tracking-[0.3px]">GroundLense</span>

      {/* Badge — matches .tb-badge */}
      <span className="text-[8px] font-mono tracking-[0.5px]" style={{ background: "rgba(153,60,29,.2)", color: "var(--color-rust-d)", padding: "2px 6px", borderRadius: "3px", border: "0.5px solid rgba(153,60,29,.3)" }}>{roleLabel}</span>

      {/* Separator — matches .tb-sep */}
      <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />

      {/* Org name */}
      <span className="text-[11px] text-text-sec">{orgName}</span>

      {/* Right side — matches .tb-right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification — matches .tb-notif */}
        <NotificationBell />

        {/* GL Code — matches .tb-gl */}
        {employeeCode && (
          <div className="font-mono text-[9px] text-amber-d" style={{ padding: "3px 8px", background: "rgba(186,117,23,.08)", border: "0.5px solid rgba(186,117,23,.2)", borderRadius: "4px" }}>
            {employeeCode}
          </div>
        )}

        {/* User pill — matches .tb-user */}
        <div className="flex items-center gap-[6px] bg-bg-card rounded-[5px]" style={{ border: "0.5px solid var(--color-border)", padding: "3px 9px" }}>
          <div className="rounded-full flex items-center justify-center text-[8px] font-bold text-rust-d" style={{ width: "20px", height: "20px", background: "rgba(153,60,29,.25)" }}>
            {initials}
          </div>
          <span className="text-[11px] text-text-sec">{displayName}</span>
        </div>

        {/* Dashboard button */}
        <button
          onClick={() => setShowSettings(false)}
          className={`text-[10px] bg-transparent border rounded-[5px] cursor-pointer transition-all hover:border-rust-mid hover:text-rust-d flex items-center gap-1
            ${!showSettings
              ? "border-rust-mid text-rust-d font-semibold bg-[rgba(153,60,29,.1)]"
              : "border-border text-text-ter hover:text-text-sec"
            }`}
          style={{ padding: "4px 9px" }}
        >
          Dashboard
        </button>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className={`text-[10px] bg-transparent border rounded-[5px] cursor-pointer transition-all hover:border-rust-mid hover:text-rust-d flex items-center gap-1
            ${showSettings
              ? "border-rust-mid text-rust-d font-semibold bg-[rgba(153,60,29,.1)]"
              : "border-border text-text-ter hover:text-text-sec"
            }`}
          style={{ padding: "4px 9px" }}
        >
          ⚙ Settings
        </button>

        {/* Sign out — matches .tb-signout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[10px] bg-transparent border border-border rounded-[5px] text-text-ter cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all flex items-center gap-1"
            style={{ padding: "4px 9px" }}
          >
            <RiLogoutBoxRLine /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
