"use client";

import { RiNotification3Line } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface PortalTopbarProps {
  project: any;
  user: Record<string, unknown> | null;
}

/* Matches portal .topbar: height 50px, gap 14px */
export default function PortalTopbar({ project, user }: PortalTopbarProps) {
  const router = useRouter();
  const firstName = (user?.firstName as string) || "";
  const lastName = (user?.lastName as string) || "";
  const initials = getInitials(firstName, lastName);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const orgType = (user as any)?.organization?.type || "";
  const roleLabel = orgType === "EPC_CONTRACTOR" ? "CONTRACTOR"
    : orgType === "GEOTECH_CONTRACTOR" ? "GEOTECH"
    : orgType === "IE_FIRM" ? "ENGINEER"
    : orgType || "USER";

  return (
    <div className="bg-bg-surface border-b border-border flex items-center shrink-0" style={{ height: "50px", padding: "0 16px", gap: "14px" }}>
      {/* Logo — matches .logo */}
      <span className="font-display text-[15px] text-rust-d tracking-[0.3px] cursor-pointer" onClick={() => router.push("/dashboard")}>GroundLense</span>

      {/* Badge — matches .badge */}
      <span className="text-[9px] text-rust-d font-mono" style={{ background: "rgba(153,60,29,.2)", padding: "2px 7px", borderRadius: "3px", border: "0.5px solid rgba(153,60,29,.3)" }}>{roleLabel}</span>

      {/* Project pill — matches .proj-pill */}
      {project && (
        <div className="flex items-center gap-2 bg-bg-card rounded-[5px] cursor-pointer" style={{ border: "0.5px solid var(--color-border-mid)", padding: "4px 10px", maxWidth: "360px" }}>
          <span className="font-mono text-[9px] text-amber-d">{project.projectCode}</span>
          <span className="text-[11px] text-text-pri font-medium truncate">{project.name}</span>
        </div>
      )}

      {/* Right — matches .topbar-right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notif — matches .notif */}
        <div className="rounded-[5px] bg-bg-card flex items-center justify-center cursor-pointer text-[13px] relative" style={{ width: "30px", height: "30px", border: "0.5px solid var(--color-border)" }}>
          <RiNotification3Line className="text-text-sec" />
          <div className="absolute rounded-full bg-rust-mid" style={{ top: "3px", right: "3px", width: "6px", height: "6px", border: "1.5px solid var(--color-bg-surface)" }} />
        </div>

        {/* User pill — matches .user-pill */}
        <div className="flex items-center gap-[7px] bg-bg-card rounded-[5px]" style={{ border: "0.5px solid var(--color-border)", padding: "4px 9px" }}>
          <div className="rounded-full flex items-center justify-center text-[9px] font-bold text-rust-d" style={{ width: "22px", height: "22px", background: "rgba(153,60,29,.3)" }}>{initials}</div>
          <span className="text-[11px] text-text-sec">{displayName}</span>
        </div>

        {/* Back button — matches .tb-back */}
        <button onClick={() => router.push("/dashboard")} className="text-[10px] bg-transparent border border-border rounded-[5px] text-text-ter cursor-pointer transition-all hover:border-rust-mid hover:text-rust-d" style={{ padding: "4px 9px" }}>
          ← Dashboard
        </button>
      </div>
    </div>
  );
}
