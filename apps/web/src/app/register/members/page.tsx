"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, inviteMembersAction } from "@/app/actions/auth";
import { RiFileCopyLine, RiCheckLine } from "react-icons/ri";

export default function RegisterMembersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form states
  const [emailOrCode, setEmailOrCode] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Members list
  const [members, setMembers] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        setCurrentUser(user);
        
        // Default role selection based on org type
        const orgType = (user as any).organization?.type;
        setRoleCode(orgType === "GEOTECH_CONTRACTOR" ? "GEOTECH_ENGINEER" : "EPC_MANAGER");
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, [router]);

  const handleAddMember = async () => {
    if (!emailOrCode.trim()) {
      setInviteError("Please enter an email address or employee code.");
      return;
    }
    setInviteError("");
    setInviteLoading(true);

    try {
      const res = await inviteMembersAction([{ emailOrCode: emailOrCode.trim(), roleCode }]);
      if (res.error) {
        setInviteError(res.error);
      } else {
        const inviteResult = res[0];
        if (inviteResult.error) {
          setInviteError(inviteResult.error);
        } else {
          // Success! Add to list
          const formattedRole = roleCode.replace("GEOTECH_", "Geotech ").replace("EPC_", "EPC ").replace("_", " ");
          const newMember = {
            emailOrCode: inviteResult.emailOrCode,
            employeeCode: inviteResult.employeeCode || "N/A",
            role: formattedRole,
            status: inviteResult.status === "EXISTING" ? "Active" : "Invited",
            inviteLink: inviteResult.inviteLink || ""
          };
          setMembers([...members, newMember]);
          setEmailOrCode("");
        }
      }
    } catch {
      setInviteError("Failed to add organization member.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = (link: string, index: number) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-sec text-[13px]">
        Loading setup details...
      </div>
    );
  }

  const orgName = currentUser?.organization?.name || "your Organization";
  const orgType = currentUser?.organization?.type;

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="bg-bg-card border border-border rounded-xl p-8 max-w-[520px] w-full shadow-lg animate-fade-up">
        <div className="text-center mb-6">
          <span className="text-[28px] block mb-2">🤝</span>
          <h2 className="font-display text-[22px] font-semibold text-text-pri mb-1">Add Organization Members</h2>
          <p className="text-[12px] text-text-sec max-w-[400px] mx-auto leading-relaxed">
            Invite colleagues to **{orgName}** to manage borings, review reports, and collaborate.
          </p>
        </div>

        {/* Invite Form */}
        <div className="bg-bg-base border border-border rounded-lg p-[18px] mb-5">
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Email or Employee Code</label>
            <input
              type="text"
              placeholder="you@company.com or GL-GEO-XXXX"
              value={emailOrCode}
              onChange={(e) => setEmailOrCode(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-[7px] py-[9px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
            />
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Role / Position</label>
            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-[7px] py-[9px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors cursor-pointer"
            >
              {orgType === "GEOTECH_CONTRACTOR" ? (
                <>
                  <option value="GEOTECH_ADMIN">Geotech Admin</option>
                  <option value="GEOTECH_MANAGER">Geotech Manager</option>
                  <option value="GEOTECH_ENGINEER">Geotech Engineer</option>
                </>
              ) : (
                <>
                  <option value="EPC_ADMIN">EPC Admin</option>
                  <option value="EPC_MANAGER">EPC Manager</option>
                  <option value="EPC_VIEWER">EPC Viewer</option>
                </>
              )}
            </select>
          </div>

          {inviteError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {inviteError}
            </div>
          )}

          <button
            onClick={handleAddMember}
            disabled={inviteLoading || !emailOrCode.trim()}
            className="w-full py-[10px] bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {inviteLoading ? "Adding member..." : "+ Add to Organization"}
          </button>
        </div>

        {/* Invited Members List */}
        {members.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-semibold text-text-sec mb-2 uppercase tracking-wider">Members Added ({members.length})</h3>
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-[220px] overflow-y-auto bg-bg-card">
              {members.map((m, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-[11px]">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-medium text-text-pri truncate">{m.emailOrCode}</div>
                    <div className="text-text-ter mt-[2px] flex items-center gap-[6px]">
                      <span>Code: <strong className="font-mono text-amber-d">{m.employeeCode}</strong></span>
                      <span>·</span>
                      <span>{m.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-[2px] rounded-full text-[9px] font-medium ${
                      m.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {m.status}
                    </span>
                    {m.inviteLink && (
                      <button
                        onClick={() => handleCopyLink(m.inviteLink, idx)}
                        title="Copy Invitation Link"
                        className="p-[5px] bg-bg-base border border-border rounded hover:border-rust-mid text-text-sec hover:text-rust-d transition-colors"
                      >
                        {copiedIndex === idx ? <RiCheckLine size={13} className="text-green-600" /> : <RiFileCopyLine size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors text-center"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
