"use client";

import { useState, useEffect } from "react";
import DashboardTopbar from "./DashboardTopbar";
import ProjectSearch from "./ProjectSearch";
import SummaryRow from "./SummaryRow";
import ProjectCard from "./ProjectCard";
import NewProjectCard from "./NewProjectCard";
import NewProjectModal from "./NewProjectModal";
import { getJoinRequestsAction, approveJoinRequestAction, rejectJoinRequestAction } from "@/app/actions/auth";
import { getPendingProjectJoinRequestsAction, approveProjectJoinRequestAction, rejectProjectJoinRequestAction } from "@/app/actions/projects";
import { updateUserProfileAction, sendOtpAction, verifyOtpAction } from "@/app/actions/portal";

interface DashboardClientProps {
  projects: any[];
  summary: { projects: number; boreholes: number; intervals: number; samples: number; media: number };
  user: Record<string, unknown> | null;
  orgType: string | null;
  geotechOrgs: { id: string; name: string; type: string; city: string | null; state: string | null }[];
  epcOrgs?: { id: string; name: string; type: string; city: string | null; state: string | null }[];
  orgUsers?: any[];
}

export default function DashboardClient({ projects, summary, user, orgType, geotechOrgs, epcOrgs = [], orgUsers = [] }: DashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [projectRequests, setProjectRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  // ── Settings tab states ──
  const u = user as any;
  const userName = u
    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || (u.email as string) || "Engineer"
    : "Engineer";

  const [editEmail, setEditEmail] = useState(u?.email || "");
  const [editMobile, setEditMobile] = useState(u?.mobile || "");
  
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpCode, setMobileOtpCode] = useState("");
  const [mobileOtpVerified, setMobileOtpVerified] = useState(false);
  
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  useEffect(() => {
    if (u) {
      setEditEmail(u.email || "");
      setEditMobile(u.mobile || "");
      setEmailOtpSent(false);
      setEmailOtpVerified(false);
      setMobileOtpSent(false);
      setMobileOtpVerified(false);
      setSettingsError("");
      setSettingsSuccess("");
    }
  }, [u]);

  const handleSendEmailOtp = async () => {
    if (!editEmail.trim()) {
      setSettingsError("Please enter a valid email address.");
      return;
    }
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsSuccess("");
    const res = await sendOtpAction({
      type: "EMAIL",
      target: editEmail.trim(),
    });
    setSettingsBusy(false);
    if (res.success) {
      setEmailOtpSent(true);
      setSettingsSuccess("Email verification OTP sent (simulated code: 123456)");
    } else {
      setSettingsError(res.error || "Failed to send email OTP.");
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode.trim()) {
      setSettingsError("Please enter the verification code.");
      return;
    }
    if (emailOtpCode.trim() !== "123456") {
      setSettingsError("Invalid OTP code. Please enter 123456.");
      return;
    }
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsSuccess("");
    const res = await verifyOtpAction({
      type: "EMAIL",
      target: editEmail.trim(),
      code: emailOtpCode.trim(),
    });
    setSettingsBusy(false);
    if (res.success) {
      setEmailOtpVerified(true);
      setSettingsSuccess("Email verified successfully.");
    } else {
      setSettingsError(res.error || "Failed to verify email OTP.");
    }
  };

  const handleSendMobileOtp = async () => {
    if (!editMobile.trim()) {
      setSettingsError("Please enter a valid mobile number.");
      return;
    }
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsSuccess("");
    const res = await sendOtpAction({
      type: "MOBILE",
      target: editMobile.trim(),
    });
    setSettingsBusy(false);
    if (res.success) {
      setMobileOtpSent(true);
      setSettingsSuccess("Mobile verification OTP sent (simulated code: 123456)");
    } else {
      setSettingsError(res.error || "Failed to send mobile OTP.");
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtpCode.trim()) {
      setSettingsError("Please enter the verification code.");
      return;
    }
    if (mobileOtpCode.trim() !== "123456") {
      setSettingsError("Invalid OTP code. Please enter 123456.");
      return;
    }
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsSuccess("");
    const res = await verifyOtpAction({
      type: "MOBILE",
      target: editMobile.trim(),
      code: mobileOtpCode.trim(),
    });
    setSettingsBusy(false);
    if (res.success) {
      setMobileOtpVerified(true);
      setSettingsSuccess("Mobile number verified successfully.");
    } else {
      setSettingsError(res.error || "Failed to verify mobile OTP.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u?.id) return;
    
    const payload: { email?: string; mobile?: string } = {};
    const emailChanged = editEmail.trim() !== (u.email || "");
    const mobileChanged = editMobile.trim() !== (u.mobile || "");
    
    if (!emailChanged && !mobileChanged) {
      setSettingsSuccess("No changes detected.");
      return;
    }
    
    if (emailChanged) {
      if (!emailOtpVerified) {
        setSettingsError("Please verify your new email using OTP first.");
        return;
      }
      payload.email = editEmail.trim();
    }
    
    if (mobileChanged) {
      if (!mobileOtpVerified) {
        setSettingsError("Please verify your new mobile number using OTP first.");
        return;
      }
      payload.mobile = editMobile.trim();
    }
    
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsSuccess("");
    const res = await updateUserProfileAction(u.id, payload);
    setSettingsBusy(false);
    
    if (res.success) {
      setSettingsSuccess("Profile updated successfully!");
      setEmailOtpSent(false);
      setEmailOtpVerified(false);
      setMobileOtpSent(false);
      setMobileOtpVerified(false);
      window.location.reload();
    } else {
      setSettingsError(res.error || "Failed to update profile.");
    }
  };

  const isPmOrAdmin = user && (
    (user as any).roles?.includes("GEOTECH_ADMIN") ||
    (user as any).roles?.includes("EPC_ADMIN") ||
    (user as any).roles?.includes("GEOTECH_MANAGER") ||
    (user as any).roles?.includes("EPC_MANAGER")
  );

  useEffect(() => {
    if (isPmOrAdmin) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const [orgRes, projRes] = await Promise.all([
        getJoinRequestsAction(),
        getPendingProjectJoinRequestsAction()
      ]);
      setJoinRequests(orgRes || []);
      setProjectRequests(projRes || []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    try {
      const res = await approveJoinRequestAction(reqId);
      if (res.error) {
        alert(res.error);
      } else {
        setJoinRequests(joinRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const res = await rejectJoinRequestAction(reqId);
      if (res.error) {
        alert(res.error);
      } else {
        setJoinRequests(joinRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to reject request.");
    }
  };

  const handleApproveProject = async (reqId: string) => {
    try {
      const res = await approveProjectJoinRequestAction(reqId);
      if (res && "error" in res && res.error) {
        alert(res.error);
      } else {
        setProjectRequests(projectRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to approve project request.");
    }
  };

  const handleRejectProject = async (reqId: string) => {
    try {
      const res = await rejectProjectJoinRequestAction(reqId);
      if (res && "error" in res && res.error) {
        alert(res.error);
      } else {
        setProjectRequests(projectRequests.filter((r) => r.id !== reqId));
      }
    } catch {
      alert("Failed to reject project request.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <style dangerouslySetInnerHTML={{ __html: `
        .card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 9px; padding: 14px; margin-bottom: 12px; }
        .card-title { font-size: 10px; font-weight: 600; color: var(--color-text-ter); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
        .fg { display: flex; flex-direction: column; gap: 4px; }
        .fl { font-size: 9px; font-weight: 600; color: var(--color-text-ter); }
        .fi { font-size: 11px; padding: 6px 10px; border: 1.5px solid var(--color-border-mid); border-radius: 7px; background: var(--color-bg-card); color: var(--color-text-pri); outline: none; }
        .fi:focus { border-color: var(--color-rust-mid); }
        .ib { border-radius: 7px; padding: 7px 11px; font-size: 10px; line-height: 1.5; margin-bottom: 12px; }
        .ib-r { background: rgba(163,45,45,.08); border: 0.5px solid rgba(163,45,45,.25); color: #F09595; }
        .ib-g { background: rgba(59,109,17,.08); border: 0.5px solid rgba(59,109,17,.25); color: #97C459; }
        .dr { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; border-bottom: 0.5px solid var(--color-border); }
        .dr:last-child { border-bottom: none; }
        .dr-l { color: var(--color-text-ter); }
        .dr-v { color: var(--color-text-sec); font-weight: 500; }
        .btn { font-size: 10px; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: all 0.1s; border: none; }
        .btn:disabled { opacity: .45; cursor: not-allowed; }
        .btn-p { background: var(--color-rust-mid); color: #fff; }
        .btn-p:hover:not(:disabled) { background: var(--color-rust-d); }
        .btn-w { background: var(--color-bg-card); color: var(--color-text-sec); border: 0.5px solid var(--color-border-mid); }
        .btn-w:hover:not(:disabled) { border-color: var(--color-rust-mid); }
        .btn-s { background: rgba(59,109,17,.15); color: #97C459; border: 0.5px solid rgba(59,109,17,.3); }
        .btn-s:hover:not(:disabled) { background: rgba(59,109,17,.25); }
        .btn-b { background: rgba(24,95,165,.15); color: #85B7EB; border: 0.5px solid rgba(24,95,165,.3); }
        .btn-b:hover:not(:disabled) { background: rgba(24,95,165,.25); }
        .dt { width: 100%; border-collapse: collapse; font-size: 11px; }
        .dt th { background: var(--color-bg-surface); padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 8px; font-weight: 600; color: var(--color-text-ter); border-bottom: 1px solid var(--color-border); }
        .dt td { padding: 6px 8px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-sec); }
        .td-p { font-weight: 600; color: var(--color-text-pri) !important; }
        .pill-green { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 8px; font-size: 9px; font-weight: 500; background: rgba(59,109,17,.12); color: #97C459; border: 0.5px solid rgba(59,109,17,.25); }
        .pill-gray { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 8px; font-size: 9px; font-weight: 500; background: rgba(107,105,102,.12); color: #B4B2A9; border: 0.5px solid rgba(107,105,102,.3); }
      ` }} />
      <DashboardTopbar user={user} showSettings={showSettings} setShowSettings={setShowSettings} />

      {/* Dashboard body — matches .dash-body: padding 24px 28px */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
        {showSettings ? (
          <div className="animate-fade-in space-y-4">
            {settingsError && (
              <div className="ib ib-r shadow-sm">
                ❌ {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="ib ib-g shadow-sm">
                ✓ {settingsSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Card */}
              <div className="card shadow-sm">
                <div className="card-title">👤 Personal Profile</div>
                <div className="space-y-2">
                  <div className="dr">
                    <span className="dr-l">Full Name</span>
                    <span className="dr-v font-bold">{userName}</span>
                  </div>
                  <div className="dr">
                    <span className="dr-l">Designation</span>
                    <span className="dr-v">{u?.designation || "Geotechnical Engineer"}</span>
                  </div>
                  <div className="dr">
                    <span className="dr-l">Email Address</span>
                    <span className="dr-v">{u?.email || "—"}</span>
                  </div>
                  <div className="dr">
                    <span className="dr-l">Mobile Number</span>
                    <span className="dr-v flex items-center gap-1.5">
                      {u?.mobile || "—"}
                      {u?.mobileVerified ? (
                        <span className="pill-green text-[8px]">Verified</span>
                      ) : (
                        <span className="pill-gray text-[8px]">Not Verified</span>
                      )}
                    </span>
                  </div>
                  <div className="dr">
                    <span className="dr-l">Employee Code</span>
                    <span className="dr-v font-mono">{u?.employeeCode || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Edit Details Card */}
              <div className="card shadow-sm">
                <div className="card-title">✏️ Update Profile Details</div>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Email field */}
                  <div className="fg">
                    <span className="fl">Change Email Address</span>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        className="fi flex-1"
                        value={editEmail}
                        onChange={(e) => {
                          setEditEmail(e.target.value);
                          setEmailOtpSent(false);
                          setEmailOtpVerified(false);
                        }}
                        placeholder="new.email@example.com"
                        disabled={settingsBusy}
                      />
                      {editEmail.trim() !== (u?.email || "") && !emailOtpVerified && (
                        <button
                          type="button"
                          className="btn btn-b text-[10px]"
                          onClick={handleSendEmailOtp}
                          disabled={settingsBusy}
                        >
                          {emailOtpSent ? "Resend OTP" : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {emailOtpSent && !emailOtpVerified && (
                      <div className="flex gap-2 mt-1.5">
                        <input
                          type="text"
                          className="fi w-28"
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          className="btn btn-s text-[10px]"
                          onClick={handleVerifyEmailOtp}
                          disabled={settingsBusy}
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}
                    {emailOtpVerified && (
                      <span className="text-[10px] font-semibold mt-1 inline-block" style={{ color: "#97C459" }}>✓ Email verified with OTP</span>
                    )}
                  </div>

                  {/* Mobile field */}
                  <div className="fg">
                    <span className="fl">Change Mobile Number</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="fi flex-1"
                        value={editMobile}
                        onChange={(e) => {
                          setEditMobile(e.target.value);
                          setMobileOtpSent(false);
                          setMobileOtpVerified(false);
                        }}
                        placeholder="9876543210"
                        disabled={settingsBusy}
                      />
                      {editMobile.trim() !== (u?.mobile || "") && !mobileOtpVerified && (
                        <button
                          type="button"
                          className="btn btn-b text-[10px]"
                          onClick={handleSendMobileOtp}
                          disabled={settingsBusy}
                        >
                          {mobileOtpSent ? "Resend OTP" : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {mobileOtpSent && !mobileOtpVerified && (
                      <div className="flex gap-2 mt-1.5">
                        <input
                          type="text"
                          className="fi w-28"
                          value={mobileOtpCode}
                          onChange={(e) => setMobileOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          className="btn btn-s text-[10px]"
                          onClick={handleVerifyMobileOtp}
                          disabled={settingsBusy}
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}
                    {mobileOtpVerified && (
                      <span className="text-[10px] font-semibold mt-1 inline-block" style={{ color: "#97C459" }}>✓ Mobile verified with OTP</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-p w-full text-[11px] py-2"
                    disabled={
                      settingsBusy ||
                      (editEmail.trim() === (u?.email || "") && editMobile.trim() === (u?.mobile || "")) ||
                      (editEmail.trim() !== (u?.email || "") && !emailOtpVerified) ||
                      (editMobile.trim() !== (u?.mobile || "") && !mobileOtpVerified)
                    }
                  >
                    {settingsBusy ? "Saving..." : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            </div>

            {/* Organization Crew List */}
            <div className="card shadow-sm">
              <div className="card-title">👥 Organization Crew Members ({orgUsers.length})</div>
              <div className="overflow-x-auto">
                <table className="dt w-full">
                  <thead>
                    <tr>
                      <th>Employee Code</th>
                      <th>Name</th>
                      <th>Role / Designation</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-text-ter py-4">No crew members found.</td>
                      </tr>
                    ) : (
                      orgUsers.map((mUser: any) => {
                        const name = `${mUser.firstName ?? ""} ${mUser.lastName ?? ""}`.trim() || mUser.email || "—";
                        const role = mUser.roles?.[0]?.role?.name || mUser.designation || "Crew Member";
                        const st = mUser.status || "ACTIVE";
                        return (
                          <tr key={mUser.id}>
                            <td className="font-mono text-[9px] text-amber-d">{mUser.employeeCode || "—"}</td>
                            <td className="td-p">{name}</td>
                            <td>{role}</td>
                            <td>{mUser.email || "—"}</td>
                            <td>
                              <span className="flex items-center gap-1.5">
                                {mUser.mobile || "—"}
                                {mUser.mobileVerified && (
                                  <span className="pill-green text-[7px] px-1.5 py-0.5">Verified</span>
                                )}
                              </span>
                            </td>
                            <td>
                              <span className={`pill ${st === "ACTIVE" ? "p-g" : "p-gray"}`}>
                                {st}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ProjectSearch projects={projects} orgType={orgType} />

            {/* Pending Requests section */}
            {isPmOrAdmin && (joinRequests.length > 0 || projectRequests.length > 0) && (
              <div className="bg-bg-card border border-border rounded-xl p-5 mb-5 shadow-sm animate-fade-up">
                <h3 className="font-display text-[15px] font-semibold text-text-pri mb-3 flex items-center gap-[6px]">
                  <span>🔔</span> Pending Requests ({joinRequests.length + projectRequests.length})
                </h3>
                
                {joinRequests.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] text-text-sec uppercase tracking-wider mb-2 font-semibold">Organization Join Requests ({joinRequests.length})</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {joinRequests.map((req) => (
                        <div key={req.id} className="border border-border rounded-lg p-3 bg-bg-base flex items-center justify-between text-[11px]">
                          <div>
                            <div className="font-semibold text-text-pri">{req.user.firstName} {req.user.lastName || ""}</div>
                            <div className="text-text-sec mt-[2px]">{req.user.email} · {req.user.mobile}</div>
                            <div className="text-text-ter mt-[2px]">
                              Requested Role: <strong className="text-rust-d font-medium">{req.roleCode.replace("_", " ")}</strong>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="py-[6px] px-3 bg-green-600 hover:bg-green-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="py-[6px] px-3 bg-red-600 hover:bg-red-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projectRequests.length > 0 && (
                  <div>
                    <div className="text-[10px] text-text-sec uppercase tracking-wider mb-2 font-semibold">Project Invitations & Requests ({projectRequests.length})</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectRequests.map((req) => (
                        <div key={req.id} className="border border-border rounded-lg p-3 bg-bg-base flex items-center justify-between text-[11px]">
                          <div>
                            <div className="font-semibold text-text-pri">Project: {req.project.name} ({req.project.projectCode})</div>
                            {req.isInvitation ? (
                              <>
                                <div className="text-text-sec mt-[2px]"><span className="text-amber-d font-medium">📩 Project Link Invitation</span> to your organization</div>
                                <div className="text-text-ter mt-[2px]">Invited by: {req.project.createdBy?.firstName} {req.project.createdBy?.lastName || ""} ({req.project.createdBy?.email || "owner"})</div>
                              </>
                            ) : (
                              <>
                                <div className="text-text-sec mt-[2px]">Requesting Org: <strong>{req.organization.name}</strong> ({req.organization.type.replace("_", " ")})</div>
                                <div className="text-text-ter mt-[2px]">Requested by: {req.user?.firstName} {req.user?.lastName || ""} ({req.user?.email})</div>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveProject(req.id)}
                              className="py-[6px] px-3 bg-green-600 hover:bg-green-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                            >
                              {req.isInvitation ? "Accept" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectProject(req.id)}
                              className="py-[6px] px-3 bg-red-600 hover:bg-red-700 text-text-pri font-medium rounded cursor-pointer border-none text-[10px] transition-colors"
                            >
                              {req.isInvitation ? "Decline" : "Reject"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Welcome bar — matches .welcome-bar */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-[22px] font-semibold mb-[2px]">
                  {user ? `Welcome, ${(user as any).firstName || "User"}` : "Your projects"}
                </h2>
                <p className="text-[12px] text-text-sec">Monitor borings, track reports, manage teams</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-[7px] py-[9px] px-4 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors"
              >
                + New project
              </button>
            </div>

            <SummaryRow summary={summary} />

            {/* Project grid — matches .proj-grid: grid 3 cols, gap 10px */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-3 gap-[10px] mb-5">
                {projects.map((p: any) => (
                  <ProjectCard key={p.id} project={p} orgType={orgType} />
                ))}
                <NewProjectCard onClick={() => setModalOpen(true)} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-[36px] mb-4">📋</div>
                <div className="text-[16px] text-text-sec font-medium mb-1">No projects yet</div>
                <div className="text-[12px] text-text-ter leading-relaxed max-w-[300px] mx-auto mb-5">Create your first project to start managing borings, teams, and IS 1892 reports.</div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="py-[9px] px-4 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors"
                >
                  + Create project
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} geotechOrgs={geotechOrgs} epcOrgs={epcOrgs} user={user} orgType={orgType} />
    </div>
  );
}
