"use client";

import { useState } from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import {
  loginAction,
  registerAction,
  sendOtpAction,
  verifyOtpAction,
  verifyGstAction,
  uploadLogoAction,
  joinRequestAction,
  forgotPasswordAction,
  resetPasswordAction
} from "@/app/actions/auth";

type RoleType = "contractor" | "engineer" | "gt";
type Screen = 0 | 1 | 2 | 3 | 4 | 5;

const ROLES = [
  { key: "contractor" as RoleType, emoji: "🏗️", name: "Contractor", desc: "EPC / HAM firm", code: "GL-CON-XXXX" },
  { key: "engineer" as RoleType, emoji: "🔬", name: "IE Firm / Engineer", desc: "Review + IS 1892 reports", code: "GL-ENG-XXXX" },
  { key: "gt" as RoleType, emoji: "⛏️", name: "Geotech Contractor", desc: "Field teams + boring data", code: "GL-GTC-XXXX" },
];

const ROLE_META: Record<RoleType, [string, string]> = {
  contractor: ["Contractor login", "Access your project dashboard, boring monitor, and reports."],
  engineer: ["IE Firm / Engineer login", "Access the engineer review portal and IS 1892 report tools."],
  gt: ["Geotech Contractor login", "Manage your field teams and boring submissions."],
};

const ROLE_TO_ORG_TYPE: Record<RoleType, string> = {
  contractor: "EPC_CONTRACTOR",
  engineer: "GEOTECH_CONTRACTOR",
  gt: "GEOTECH_CONTRACTOR",
};

export default function LoginForm({
  redirectTo,
  initialEmail = "",
  initialRegister = false,
}: {
  redirectTo?: string;
  initialEmail?: string;
  initialRegister?: boolean;
}) {
  const [screen, setScreen] = useState<Screen>(initialRegister ? 2 : 0);
  const [role, setRole] = useState<RoleType>("contractor");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Signup — Step 1 (Company)
  const [orgName, setOrgName] = useState("");
  const [gstin, setGstin] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  // Local object-URL of the picked file — previewing via the API origin
  // breaks on deployed hosts (the browser can't reach it pre-login).
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  // GST Verification States
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstError, setGstError] = useState("");

  // Join request workflow
  const [joinMode, setJoinMode] = useState(false);
  const [joinOrgDetails, setJoinOrgDetails] = useState<any>(null);
  const [requestedRole, setRequestedRole] = useState("GEOTECH_ENGINEER");
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Signup — Step 2 (Login details)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState(initialEmail);
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  // OTP States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpCode, setMobileOtpCode] = useState("");
  const [mobileOtpVerified, setMobileOtpVerified] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);

  const goLogin = () => setScreen(1);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Email address is required.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await forgotPasswordAction(forgotEmail.trim());
      if (res?.error) {
        setForgotError(res.error);
      } else {
        alert("Password reset OTP sent to your email.");
        setScreen(5); // Switch to reset password screen
      }
    } catch {
      setForgotError("Failed to send reset OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetCode.trim()) {
      setForgotError("Verification code is required.");
      return;
    }
    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const fd = new FormData();
      fd.set("email", forgotEmail.trim());
      fd.set("code", resetCode.trim());
      fd.set("newPassword", btoa(newPassword));

      const res = await resetPasswordAction(fd);
      if (res?.error) {
        setForgotError(res.error);
      } else {
        alert("Password reset successfully. Please login with your new password.");
        setForgotEmail("");
        setResetCode("");
        setNewPassword("");
        setScreen(0); // Go back to login screen
      }
    } catch {
      setForgotError("Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const goCompanyStep = () => {
    setSignupError("");
    setScreen(2);
  };

  const goLoginDetailsStep = () => {
    if (!gstVerified) {
      setSignupError("Please verify your GSTIN number first.");
      return;
    }
    if (!orgName.trim()) {
      setSignupError("Company name is required.");
      return;
    }
    setSignupError("");
    setScreen(3);
  };

  const handleGstVerify = async () => {
    if (!gstin.trim()) {
      setGstError("GSTIN is required.");
      return;
    }
    setGstVerifying(true);
    setGstError("");
    setSignupError("");
    try {
      const res = await verifyGstAction(gstin.trim());
      if (res.error) {
        setGstError(res.error);
        setGstVerified(false);
        setJoinMode(false);
      } else {
        if (res.exists) {
          setJoinMode(true);
          setJoinOrgDetails(res);
          setOrgName("");
          setOrgCity("");
          setOrgState(res.state || "");
          setGstVerified(true);
          // Set default requested role based on org type
          setRequestedRole(res.type === "GEOTECH_CONTRACTOR" ? "GEOTECH_ENGINEER" : "EPC_MANAGER");
        } else {
          setJoinMode(false);
          setJoinOrgDetails(null);
          setOrgName("");
          setOrgCity("");
          setOrgState(res.state || "");
          setGstVerified(true);
        }
      }
    } catch {
      setGstError("Failed to verify GSTIN. Please try again.");
    } finally {
      setGstVerifying(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLogoUploading(true);
    setSignupError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadLogoAction(fd);
      if (res.error) {
        setSignupError(res.error);
      } else {
        setLogoUrl(res.url);
        setLogoPreview(URL.createObjectURL(file));
      }
    } catch {
      setSignupError("Failed to upload company logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!signupEmail.trim()) {
      setSignupError("Work email is required.");
      return;
    }
    setSignupError("");
    setEmailVerifying(true);
    try {
      const res = await sendOtpAction("EMAIL", signupEmail.trim());
      if (res.error) {
        setSignupError(res.error);
      } else {
        setEmailOtpSent(true);
        const isMock = res.isMock ?? true;
        alert(
          isMock
            ? "OTP sent successfully (simulated code: 123456). Please check your email inbox."
            : "OTP sent successfully. Please check your email inbox."
        );
      }
    } catch {
      setSignupError("Failed to send email OTP.");
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode.trim()) {
      setSignupError("OTP code is required.");
      return;
    }
    setSignupError("");
    setEmailVerifying(true);
    try {
      const res = await verifyOtpAction("EMAIL", signupEmail.trim(), emailOtpCode.trim());
      if (res.error) {
        setSignupError(res.error);
      } else {
        setEmailOtpVerified(true);
      }
    } catch {
      setSignupError("Failed to verify email OTP.");
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSendMobileOtp = async () => {
    if (!signupMobile.trim()) {
      setSignupError("Mobile number is required.");
      return;
    }
    setSignupError("");
    setMobileVerifying(true);
    try {
      const res = await sendOtpAction("MOBILE", signupMobile.trim());
      if (res.error) {
        setSignupError(res.error);
      } else {
        setMobileOtpSent(true);
        const isMock = res.isMock ?? true;
        alert(
          isMock
            ? "OTP sent successfully (simulated code: 123456). Please check your mobile device."
            : "OTP sent successfully. Please check your mobile device."
        );
      }
    } catch {
      setSignupError("Failed to send mobile OTP.");
    } finally {
      setMobileVerifying(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtpCode.trim()) {
      setSignupError("OTP code is required.");
      return;
    }
    setSignupError("");
    setMobileVerifying(true);
    try {
      const res = await verifyOtpAction("MOBILE", signupMobile.trim(), mobileOtpCode.trim());
      if (res.error) {
        setSignupError(res.error);
      } else {
        setMobileOtpVerified(true);
      }
    } catch {
      setSignupError("Failed to verify mobile OTP.");
    } finally {
      setMobileVerifying(false);
    }
  };

  const doJoinRequest = async () => {
    setSignupError("");
    if (!firstName.trim()) {
      setSignupError("First name is required.");
      return;
    }
    if (!signupEmail.trim() || !emailOtpVerified) {
      setSignupError("Work email must be verified via OTP.");
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      return;
    }

    try {
      const fd = new FormData();
      fd.set("gstin", gstin.trim());
      fd.set("firstName", firstName.trim());
      if (lastName.trim()) fd.set("lastName", lastName.trim());
      fd.set("email", signupEmail.trim());
      if (signupMobile.trim()) fd.set("mobile", signupMobile.trim());
      fd.set("password", btoa(signupPassword));
      fd.set("roleCode", requestedRole);

      const result = await joinRequestAction(fd);
      if (result?.error) {
        setSignupError(result.error);
      } else {
        setJoinSuccess(true);
      }
    } catch {
      setSignupError("Failed to submit join request. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const doRegister = async () => {
    setSignupError("");

    if (!firstName.trim()) {
      setSignupError("First name is required.");
      return;
    }
    if (!signupEmail.trim() || !emailOtpVerified) {
      setSignupError("Work email must be verified via OTP.");
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      return;
    }

    setSignupLoading(true);
    try {
      const fd = new FormData();
      fd.set("orgName", orgName.trim());
      fd.set("orgType", ROLE_TO_ORG_TYPE[role]);
      fd.set("gstin", gstin.trim());
      if (orgCity.trim()) fd.set("city", orgCity.trim());
      if (orgState.trim()) fd.set("state", orgState.trim());
      if (logoUrl) fd.set("logoUrl", logoUrl);
      fd.set("firstName", firstName.trim());
      if (lastName.trim()) fd.set("lastName", lastName.trim());
      fd.set("email", signupEmail.trim());
      if (signupMobile.trim()) fd.set("mobile", signupMobile.trim());
      fd.set("password", btoa(signupPassword));

      const result = await registerAction(fd);
      if (result?.error) {
        setSignupError(result.error);
      } else if (result?.success) {
        window.location.href = "/register/members";
      }
    } catch {
      setSignupError("Something went wrong while creating your account. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const doLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("identifier", email.trim());
      formData.set("password", btoa(password));
      if (redirectTo) formData.set("redirect", redirectTo);

      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.href = redirectTo || "/dashboard";
      }
    } catch {
      setError("Something went wrong while signing in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center bg-bg-base !max-w-[440px] !p-[48px_40px] w-full" >
      {joinSuccess && (
        <div className="animate-fade-up text-center py-6">
          <div className="text-[48px] mb-4">📨</div>
          <div className="font-display text-[22px] font-semibold mb-2 text-text-pri">Request Submitted!</div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">
            Your request to join **{orgName}** as a **{requestedRole.replace("_", " ")}** has been submitted successfully.
            <br />
            An administrator has been notified to approve your request. Once approved, you can sign in to your account.
          </p>
          <button onClick={() => { setJoinSuccess(false); setScreen(1); }} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all">
            Back to Sign in
          </button>
        </div>
      )}

      {!joinSuccess && screen === 0 && (
        <div className="animate-fade-up">
          <div className="font-display text-[24px] font-semibold !mb-[5px]">Welcome</div>
          <p className="text-[12px] text-text-sec !mb-6 leading-relaxed">Select your role to continue.</p>

          <div className="!grid !grid-cols-3 !gap-[7px] !mb-5">
            {ROLES.map((r) => (
              <div
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`relative !p-[14px_12px] border rounded-lg bg-bg-card cursor-pointer transition-all duration-150
                  ${role === r.key ? "border-rust-mid bg-[rgba(153,60,29,.08)]" : "border-border hover:border-border-mid"}`}
              >
                {role === r.key && (
                  <span className="absolute top-2 right-[10px] text-[10px] text-rust-d font-semibold">✓</span>
                )}
                <div className="text-[18px] mb-[7px]">{r.emoji}</div>
                <div className="text-[11px] font-medium text-text-pri mb-[3px]">{r.name}</div>
                <div className="text-[10px] text-text-ter leading-snug">{r.desc}</div>
                <div className="font-mono text-[8px] text-amber-d mt-[5px] tracking-wider">{r.code}</div>
              </div>
            ))}
          </div>

          <button onClick={goLogin} className="w-full !py-3 bg-rust-mid !rounded-[7px] !text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all">
            Continue →
          </button>
          {/* <div className="text-center !mt-3">
            <span className="text-[11px] text-text-ter">No account? </span>
            <span className="text-[11px] text-rust-d cursor-pointer" onClick={goCompanyStep}>Create account</span>
          </div> */}
        </div>
      )}

      {!joinSuccess && screen === 1 && (
        <div className="animate-fade-up">
          <button onClick={() => setScreen(0)} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <div className="flex mb-5 border-b border-border">
            <div className="py-[7px] px-[14px] text-[12px] font-medium text-rust-d cursor-pointer border-b-2 border-rust-mid -mb-[1px]">Sign in</div>
            <div className="py-[7px] px-[14px] text-[12px] font-medium text-text-ter cursor-pointer border-b-2 border-transparent -mb-[1px]" onClick={goCompanyStep}>Create account</div>
          </div>

          <div className="font-display text-[24px] font-semibold mb-[5px]">{ROLE_META[role][0]}</div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">{ROLE_META[role][1]}</p>

          {error && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Email address or Employee Code</label>
            <input className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter" type="text" placeholder="you@company.com or GL-CON-XXXX" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Password</label>
            <input className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }} />
          </div>

          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-[5px] text-[11px] text-text-sec cursor-pointer">
              <input type="checkbox" className="accent-rust-mid" /> Remember me
            </label>
            <span onClick={() => { setForgotError(""); setScreen(4); }} className="text-[11px] text-rust-d cursor-pointer hover:underline">Forgot password?</span>
          </div>

          <button onClick={doLogin} disabled={loading} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </div>
      )}

      {!joinSuccess && screen === 2 && (
        <div className="animate-fade-up">
          <button onClick={() => setScreen(0)} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <StepDots current={1} />
          <ProgressBar percent={50} />

          <div className="font-display text-[24px] font-semibold mb-[5px]">Company details</div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">Required GSTIN validation for all geotech boring management.</p>

          <div className="font-mono text-[9px] text-amber-d mb-3 tracking-wider uppercase">
            Registering as: {ROLES.find((r) => r.key === role)?.name} · {ROLE_TO_ORG_TYPE[role]}
          </div>

          {/* GSTIN Field with Verify Button */}
          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">GSTIN Number (Mandatory)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter font-mono tracking-wider"
                type="text"
                placeholder="15-character GSTIN (e.g. 27AAPCG6174D1Z2)"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value);
                  setGstVerified(false);
                  setJoinMode(false);
                }}
              />
              <button
                type="button"
                onClick={handleGstVerify}
                disabled={gstVerifying || !gstin.trim()}
                className="py-[10px] px-4 bg-rust-mid text-text-pri rounded-[7px] text-[12px] font-medium cursor-pointer hover:bg-rust disabled:opacity-50 transition-colors"
              >
                {gstVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
            {gstError && <p className="text-[10px] text-red-500 mt-[5px]">⚠ {gstError}</p>}
            {gstVerified && !joinMode && (
              <p className="text-[10px] text-green-600 mt-[5px]">✓ Verified business: <strong>{orgName}</strong></p>
            )}
            {gstVerified && joinMode && (
              <div className="info-banner info-banner-yellow mt-2 text-[11px] p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                ⚠ <strong>{orgName}</strong> is already registered. You will request to join this organization.
              </div>
            )}
          </div>

          {/* Logo upload (only if not join mode) */}
          {!joinMode && (
            <div className="border border-dashed border-border-mid rounded-lg p-[18px] text-center bg-bg-card mb-3 relative overflow-hidden">
              {logoUrl ? (
                <div className="flex flex-col items-center">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="h-[50px] object-contain mb-2" />
                  ) : (
                    <div className="text-[22px] mb-1">🖼️</div>
                  )}
                  <span className="text-[10px] text-text-sec">Logo uploaded successfully</span>
                  <button type="button" onClick={() => { setLogoUrl(""); setLogoPreview(""); }} className="text-[10px] text-rust-d hover:underline mt-1">Remove logo</button>
                </div>
              ) : (
                <div>
                  <div className="text-[22px] mb-[5px]">🖼️</div>
                  <div className="text-[11px] text-text-sec">Upload company logo</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-[9px] text-text-ter mt-[2px]">{logoUploading ? "Uploading..." : "Click to select logo (JPEG/PNG/WEBP)"}</div>
                </div>
              )}
            </div>
          )}

          <FormField label="Company name" placeholder="Company legal name" value={orgName} onChange={setOrgName} disabled={false} />
          <div className="grid grid-cols-2 gap-[9px]">
            <FormField label="City" placeholder="City" value={orgCity} onChange={setOrgCity} disabled={false} />
            <FormField label="State" placeholder="State" value={orgState} onChange={setOrgState} disabled={false} />
          </div>

          {signupError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {signupError}
            </div>
          )}

          <button
            onClick={goLoginDetailsStep}
            disabled={!gstVerified}
            className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joinMode ? "Next — Request to Join →" : "Next — Login details →"}
          </button>
        </div>
      )}

      {!joinSuccess && screen === 3 && (
        <div className="animate-fade-up">
          <button onClick={goCompanyStep} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <StepDots current={2} />
          <ProgressBar percent={100} />

          <div className="font-display text-[24px] font-semibold mb-[5px]">
            {joinMode ? "Request to join details" : "Your login details"}
          </div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">
            {joinMode ? `Join ${orgName} as a team member.` : "Personal account linked to your company."}
          </p>

          {/* Role select dropdown (only in join request mode) */}
          {joinMode && (
            <div className="mb-3">
              <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Requested Role</label>
              <select
                className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
              >
                {joinOrgDetails?.type === "GEOTECH_CONTRACTOR" ? (
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
          )}

          <div className="grid grid-cols-2 gap-[9px]">
            <FormField label="First name" placeholder="First name" value={firstName} onChange={setFirstName} />
            <FormField label="Last name" placeholder="Last name" value={lastName} onChange={setLastName} />
          </div>

          {/* Email verification with OTP */}
          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Work Email</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter disabled:opacity-60"
                type="email"
                placeholder="you@company.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={emailOtpVerified}
              />
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={emailVerifying || emailOtpVerified || !signupEmail.trim()}
                className="py-[10px] px-3 bg-rust-mid text-text-pri rounded-[7px] text-[11px] font-medium cursor-pointer hover:bg-rust disabled:opacity-50 transition-colors"
              >
                {emailOtpVerified ? "✓" : emailOtpSent ? "Resend" : "Send OTP"}
              </button>
            </div>
            {emailOtpSent && !emailOtpVerified && (
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 bg-bg-card border border-border rounded-[7px] py-[8px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter font-mono tracking-widest text-center"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={emailVerifying || !emailOtpCode.trim()}
                  className="py-[8px] px-3 bg-[rgba(153,60,29,.1)] border border-rust-mid text-rust-d rounded-[7px] text-[11px] font-semibold cursor-pointer hover:bg-[rgba(153,60,29,.25)] transition-colors"
                >
                  Verify
                </button>
              </div>
            )}
            {emailOtpVerified && <p className="text-[10px] text-green-600 mt-[5px]">✓ Email verified</p>}
          </div>

          {/* Mobile Phone (Optional) */}
          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Mobile Phone (Optional)</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
              type="tel"
              placeholder="+91"
              value={signupMobile}
              onChange={(e) => setSignupMobile(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Password</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
              type="password"
              placeholder="Min 8 characters"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (joinMode) doJoinRequest();
                  else doRegister();
                }
              }}
            />
            <PasswordStrengthBars password={signupPassword} />
          </div>

          {signupError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {signupError}
            </div>
          )}

          {joinMode ? (
            <button
              onClick={doJoinRequest}
              disabled={signupLoading || !emailOtpVerified}
              className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signupLoading ? "Submitting request…" : "Submit join request"}
            </button>
          ) : (
            <button
              onClick={doRegister}
              disabled={signupLoading || !emailOtpVerified}
              className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signupLoading ? "Creating account…" : "Complete registration →"}
            </button>
          )}

          <button onClick={() => { setSignupError(""); setScreen(1); }} className="w-full py-[10px] bg-transparent border border-border-mid rounded-[7px] text-[12px] font-medium text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all mt-[7px]">
            Already have an account? Sign in
          </button>
        </div>
      )}

      {screen === 4 && (
        <div className="animate-fade-up">
          <button onClick={() => { setForgotError(""); setScreen(0); }} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back to Sign In
          </button>

          <h2 className="text-[17px] font-semibold text-text-pri mb-1">Forgot Password</h2>
          <p className="text-[11px] text-text-sec mb-5">Enter your work email address and we will send you an OTP to reset your password.</p>

          {forgotError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {forgotError}
            </div>
          )}

          <div className="mb-4">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Email Address</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
              type="email"
              placeholder="you@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleForgotPasswordSubmit(); }}
            />
          </div>

          <button
            onClick={handleForgotPasswordSubmit}
            disabled={forgotLoading || !forgotEmail.trim()}
            className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forgotLoading ? "Sending OTP..." : "Send Reset OTP"}
          </button>
        </div>
      )}

      {screen === 5 && (
        <div className="animate-fade-up">
          <button onClick={() => { setForgotError(""); setScreen(4); }} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <h2 className="text-[17px] font-semibold text-text-pri mb-1">Reset Password</h2>
          <p className="text-[11px] text-text-sec mb-5">An OTP has been sent to <strong>{forgotEmail}</strong>. Please enter the OTP and your new password.</p>

          {forgotError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {forgotError}
            </div>
          )}

          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Verification Code (OTP)</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter font-mono tracking-widest text-center"
              type="text"
              placeholder="6-digit OTP"
              maxLength={6}
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">New Password</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
              type="password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleResetPasswordSubmit(); }}
            />
            <PasswordStrengthBars password={newPassword} />
          </div>

          <button
            onClick={handleResetPasswordSubmit}
            disabled={forgotLoading || !resetCode.trim() || newPassword.length < 8}
            className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forgotLoading ? "Resetting password..." : "Reset Password"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══ Sub-components ══ */

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-[5px] mb-5">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={`h-[5px] rounded-full transition-all duration-250
            ${i === current ? "w-[18px] bg-rust-mid rounded-sm" : i < current ? "w-[5px] bg-[rgba(153,60,29,.3)] border border-rust-mid" : "w-[5px] bg-border-mid"}`}
        />
      ))}
      <span className="font-mono text-[9px] text-text-ter ml-[7px] tracking-wider">
        STEP {current} OF 2 — {current === 1 ? "COMPANY" : "LOGIN"}
      </span>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-[2px] bg-border rounded-sm mb-5 overflow-hidden">
      <div className="h-full bg-rust-mid rounded-sm transition-all duration-350 ease-out" style={{ width: `${percent}%` }} />
    </div>
  );
}

function PasswordStrengthBars({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (!password.length) score = 0;

  const color =
    score <= 1 ? "var(--color-red-d)" : score <= 2 ? "var(--color-amber-d)" : "var(--color-green-d)";

  return (
    <div className="flex gap-[3px] mt-[5px]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-1 h-[2px] rounded-sm transition-colors duration-250"
          style={{ background: password.length && i < score ? color : "var(--color-border)" }}
        />
      ))}
    </div>
  );
}

function FormField({ label, placeholder, type = "text", mono = false, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  type?: string;
  mono?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">{label}</label>
      <input
        className={`w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter disabled:opacity-60 ${mono ? "font-mono text-[11px] tracking-wider" : ""}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
