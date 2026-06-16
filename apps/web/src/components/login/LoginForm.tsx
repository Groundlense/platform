"use client";

import { useState } from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import { loginAction, registerAction } from "@/app/actions/auth";

type RoleType = "contractor" | "engineer" | "gt";
type Screen = 0 | 1 | 2 | 3;

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

/** Maps the role tile to the backend OrganizationType. */
const ROLE_TO_ORG_TYPE: Record<RoleType, string> = {
  contractor: "EPC_CONTRACTOR",
  engineer: "GEOTECH_CONTRACTOR",
  gt: "GEOTECH_CONTRACTOR",
};

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [screen, setScreen] = useState<Screen>(0);
  const [role, setRole] = useState<RoleType>("contractor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Signup — Step 1 (Company)
  const [orgName, setOrgName] = useState("");
  const [gstin, setGstin] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  // Signup — Step 2 (Login details)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const goLogin = () => setScreen(1);

  const goCompanyStep = () => {
    setSignupError("");
    setScreen(2);
  };

  const goLoginDetailsStep = () => {
    if (!orgName.trim()) {
      setSignupError("Company name is required.");
      return;
    }
    setSignupError("");
    setScreen(3);
  };

  const doRegister = async () => {
    setSignupError("");

    if (!firstName.trim()) {
      setSignupError("First name is required.");
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError("Work email is required.");
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
      if (gstin.trim()) fd.set("gstin", gstin.trim());
      if (orgCity.trim()) fd.set("city", orgCity.trim());
      if (orgState.trim()) fd.set("state", orgState.trim());
      fd.set("firstName", firstName.trim());
      if (lastName.trim()) fd.set("lastName", lastName.trim());
      fd.set("email", signupEmail.trim());
      if (signupMobile.trim()) fd.set("mobile", signupMobile.trim());
      fd.set("password", signupPassword);

      const result = await registerAction(fd);
      // On success the server action redirects — we only land here on failure.
      if (result?.error) {
        setSignupError(result.error);
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
      formData.set("password", password);
      if (redirectTo) formData.set("redirect", redirectTo);

      const result = await loginAction(formData);
      // On success the server action redirects — we only land here on failure.
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong while signing in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Matches .lp-right: width 440px, padding 48px 40px, flex column, justify-center, bg-base */
    <div className="flex flex-col justify-center bg-bg-base !max-w-[440px] !p-[48px_40px]" >
      {/* Screen 0: Role Select */}
      {screen === 0 && (
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
          <div className="text-center !mt-3">
            <span className="text-[11px] text-text-ter">No account? </span>
            <span className="text-[11px] text-rust-d cursor-pointer" onClick={goCompanyStep}>Create account</span>
          </div>
        </div>
      )}

      {/* Screen 1: Login */}
      {screen === 1 && (
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
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Email address</label>
            <input className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Password</label>
            <input className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }} />
          </div>

          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-[5px] text-[11px] text-text-sec cursor-pointer">
              <input type="checkbox" className="accent-rust-mid" /> Remember me
            </label>
            <span className="text-[11px] text-rust-d cursor-pointer">Forgot password?</span>
          </div>

          <button onClick={doLogin} disabled={loading} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </div>
      )}

      {/* Screen 2: Signup Step 1 — Company */}
      {screen === 2 && (
        <div className="animate-fade-up">
          <button onClick={() => setScreen(0)} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <StepDots current={1} />
          <ProgressBar percent={50} />

          <div className="font-display text-[24px] font-semibold mb-[5px]">Company details</div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">Appears on all IS 1892 reports and GL certificates.</p>

          {/* Logo upload — backend storage not available yet */}
          <div className="border border-dashed border-border-mid rounded-lg p-[18px] text-center bg-bg-card cursor-not-allowed opacity-60 mb-3" title="Coming soon — logo upload is not available yet">
            <div className="text-[22px] mb-[5px]">🖼️</div>
            <div className="text-[11px] text-text-sec">Upload company logo</div>
            <div className="text-[9px] text-text-ter mt-[2px]">Coming soon — appears on GT reports</div>
          </div>

          <div className="font-mono text-[9px] text-amber-d mb-3 tracking-wider uppercase">
            Registering as: {ROLES.find((r) => r.key === role)?.name} · {ROLE_TO_ORG_TYPE[role]}
          </div>

          <FormField label="Company name" placeholder="Your company legal name" value={orgName} onChange={setOrgName} />
          <FormField label="GST number (optional)" placeholder="GSTIN" mono value={gstin} onChange={setGstin} />
          <div className="grid grid-cols-2 gap-[9px]">
            <FormField label="City (optional)" placeholder="City" value={orgCity} onChange={setOrgCity} />
            <FormField label="State (optional)" placeholder="State" value={orgState} onChange={setOrgState} />
          </div>

          {signupError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {signupError}
            </div>
          )}

          <button onClick={goLoginDetailsStep} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1">
            Next — Login details →
          </button>
        </div>
      )}

      {/* Screen 3: Signup Step 2 — Login Details */}
      {screen === 3 && (
        <div className="animate-fade-up">
          <button onClick={goCompanyStep} className="bg-transparent border-none text-[11px] text-text-ter cursor-pointer flex items-center gap-1 mb-[18px] p-0 hover:text-rust-d transition-colors">
            <RiArrowLeftLine /> Back
          </button>

          <StepDots current={2} />
          <ProgressBar percent={100} />

          <div className="font-display text-[24px] font-semibold mb-[5px]">Your login details</div>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">Personal account linked to your company.</p>

          <div className="grid grid-cols-2 gap-[9px]">
            <FormField label="First name" placeholder="First name" value={firstName} onChange={setFirstName} />
            <FormField label="Last name" placeholder="Last name" value={lastName} onChange={setLastName} />
          </div>
          <FormField label="Work email" placeholder="you@company.com" type="email" value={signupEmail} onChange={setSignupEmail} />
          <FormField label="Mobile (optional)" placeholder="+91" type="tel" value={signupMobile} onChange={setSignupMobile} />

          <div className="mb-3">
            <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">Password</label>
            <input
              className="w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
              type="password"
              placeholder="Min 8 characters"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doRegister(); }}
            />
            <PasswordStrengthBars password={signupPassword} />
          </div>

          {signupError && (
            <div className="info-banner info-banner-red mb-3">
              <span>⚠</span> {signupError}
            </div>
          )}

          <button onClick={doRegister} disabled={signupLoading} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {signupLoading ? "Creating account…" : "Complete registration →"}
          </button>
          <button onClick={() => { setSignupError(""); setScreen(1); }} className="w-full py-[10px] bg-transparent border border-border-mid rounded-[7px] text-[12px] font-medium text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all mt-[7px]">
            Already have an account? Sign in
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

/* Matches prototype pwStrength(): score from length / uppercase / digit / symbol,
   bars colored weak (red) / med (amber) / strong (green). */
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

function FormField({ label, placeholder, type = "text", mono = false, value, onChange }: {
  label: string;
  placeholder: string;
  type?: string;
  mono?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-[10px] font-medium text-text-sec mb-[5px] block tracking-wide uppercase">{label}</label>
      <input
        className={`w-full bg-bg-card border border-border rounded-[7px] py-[10px] px-[13px] text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter ${mono ? "font-mono text-[11px] tracking-wider" : ""}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
