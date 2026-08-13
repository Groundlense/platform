'use client';

import React, { useState } from 'react';
import {
  loginAction,
  registerAction,
  sendOtpAction,
  verifyOtpAction,
  verifyGstAction,
  joinRequestAction,
  forgotPasswordAction,
  resetPasswordAction,
} from '@/app/actions/auth';

type AgencyKey = 'epc' | 'geotech' | 'authority';
type Step = 'signin' | 'join' | 'company' | 'verify' | 'forgot' | 'reset' | 'joinSuccess';

const AGENCIES: { key: AgencyKey; label: string; orgType: string }[] = [
  { key: 'epc', label: 'EPC Contractor', orgType: 'EPC_CONTRACTOR' },
  { key: 'geotech', label: 'Geotech Agency', orgType: 'GEOTECH_CONTRACTOR' },
  { key: 'authority', label: 'Authority Engineer', orgType: 'GEOTECH_CONTRACTOR' },
];

const inputClass =
  'bg-white/5 border border-white/15 rounded-lg px-3.5 py-3 text-[#F5F3EE] text-sm font-sans placeholder:text-[#6B6966] focus:border-[#D85A30] focus:outline-none transition w-full';

const labelClass = 'flex flex-col gap-1.5 text-xs text-[#B4B2A9]';

const primaryBtnClass =
  'font-sans text-sm font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] border-none px-3.5 py-3.5 rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed';

const smallBtnClass =
  'font-sans text-xs font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] border-none px-3.5 py-2.5 rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const linkBtnClass =
  'bg-transparent border-none p-0 cursor-pointer text-[#97C459] hover:text-[#97C459]/80 transition text-[13px]';

function StepTag({ n, label }: { n: string; label: string }) {
  return (
    <div className="font-mono text-[10px] tracking-widest uppercase text-[#97C459] mb-4">
      Step {n} · {label}
    </div>
  );
}

export default function AuthModal({
  onClose,
  redirectTo,
  initialEmail = '',
  initialSignUp = false,
}: {
  onClose: () => void;
  redirectTo?: string;
  initialEmail?: string;
  initialSignUp?: boolean;
}) {
  const [step, setStep] = useState<Step>(initialSignUp ? 'join' : 'signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Shared
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  // Join — basics
  const [fullName, setFullName] = useState('');
  const [agency, setAgency] = useState<AgencyKey>('epc');

  // Join — company
  const [gstin, setGstin] = useState('');
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [joinOrgDetails, setJoinOrgDetails] = useState<any>(null);
  const [requestedRole, setRequestedRole] = useState('GEOTECH_ENGINEER');
  const [orgName, setOrgName] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgState, setOrgState] = useState('');

  // Join — verify
  const [mobile, setMobile] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Forgot / reset
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const go = (s: Step) => {
    setError('');
    setStep(s);
  };

  const [firstName, ...restName] = fullName.trim().split(/\s+/);
  const lastName = restName.join(' ');

  const doLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('identifier', email.trim());
      fd.set('password', btoa(password));
      if (redirectTo) fd.set('redirect', redirectTo);
      const result = await loginAction(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.href = redirectTo || '/dashboard';
      }
    } catch {
      setError('Something went wrong while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goCompany = () => {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    go('company');
  };

  const doGstVerify = async () => {
    if (!gstin.trim()) {
      setError('GSTIN is required.');
      return;
    }
    setGstVerifying(true);
    setError('');
    try {
      const res = await verifyGstAction(gstin.trim());
      if (res.error) {
        setError(res.error);
        setGstVerified(false);
        setJoinMode(false);
      } else if (res.exists) {
        setJoinMode(true);
        setJoinOrgDetails(res);
        setOrgName(res.legalName || '');
        setOrgState(res.state || '');
        setGstVerified(true);
        setRequestedRole(res.type === 'GEOTECH_CONTRACTOR' ? 'GEOTECH_ENGINEER' : 'EPC_MANAGER');
      } else {
        setJoinMode(false);
        setJoinOrgDetails(null);
        setOrgState(res.state || '');
        setGstVerified(true);
      }
    } catch {
      setError('Failed to verify GSTIN. Please try again.');
    } finally {
      setGstVerifying(false);
    }
  };

  const goVerify = () => {
    if (!gstVerified) {
      setError('Please verify your GSTIN number first.');
      return;
    }
    if (!joinMode && !orgName.trim()) {
      setError('Company name is required.');
      return;
    }
    go('verify');
  };

  const sendEmailOtp = async () => {
    setError('');
    setEmailVerifying(true);
    try {
      const res = await sendOtpAction('EMAIL', email.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setEmailOtpSent(true);
      }
    } catch {
      setError('Failed to send email OTP.');
    } finally {
      setEmailVerifying(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtpCode.trim()) {
      setError('OTP code is required.');
      return;
    }
    setError('');
    setEmailVerifying(true);
    try {
      const res = await verifyOtpAction('EMAIL', email.trim(), emailOtpCode.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setEmailOtpVerified(true);
      }
    } catch {
      setError('Failed to verify email OTP.');
    } finally {
      setEmailVerifying(false);
    }
  };

  const doRegister = async () => {
    setError('');
    if (!emailOtpVerified) {
      setError('Please verify your email via OTP first.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (joinMode) {
        fd.set('gstin', gstin.trim());
        fd.set('firstName', firstName);
        if (lastName) fd.set('lastName', lastName);
        fd.set('email', email.trim());
        if (mobile.trim()) fd.set('mobile', mobile.trim());
        fd.set('password', btoa(password));
        fd.set('roleCode', requestedRole);
        const result = await joinRequestAction(fd);
        if (result?.error) {
          setError(result.error);
        } else {
          go('joinSuccess');
        }
      } else {
        fd.set('orgName', orgName.trim());
        fd.set('orgType', AGENCIES.find((a) => a.key === agency)!.orgType);
        fd.set('gstin', gstin.trim());
        if (orgCity.trim()) fd.set('city', orgCity.trim());
        if (orgState.trim()) fd.set('state', orgState.trim());
        fd.set('firstName', firstName);
        if (lastName) fd.set('lastName', lastName);
        fd.set('email', email.trim());
        if (mobile.trim()) fd.set('mobile', mobile.trim());
        fd.set('password', btoa(password));
        const result = await registerAction(fd);
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          window.location.href = '/register/members';
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const doForgot = async () => {
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await forgotPasswordAction(email.trim());
      if (res?.error) {
        setError(res.error);
      } else {
        go('reset');
      }
    } catch {
      setError('Failed to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    if (!resetCode.trim()) {
      setError('Verification code is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('email', email.trim());
      fd.set('code', resetCode.trim());
      fd.set('newPassword', btoa(newPassword));
      const res = await resetPasswordAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setPassword('');
        setResetCode('');
        setNewPassword('');
        go('signin');
      }
    } catch {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Step, string> = {
    signin: 'Sign in',
    join: 'Join Groundlense',
    company: 'Company details',
    verify: 'Verify your email',
    forgot: 'Forgot password',
    reset: 'Reset password',
    joinSuccess: 'Request submitted',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] my-auto bg-[#222120] border border-white/10 rounded-2xl p-6 sm:p-9 shadow-2xl animate-fade-up"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 bg-transparent border-none text-white/50 hover:text-white/80 text-xl leading-none cursor-pointer"
        >
          ×
        </button>

        <img src="/groundlense-logo-wide.png" alt="Groundlense" className="h-10 w-auto block mb-3.5" />
        <h2 className="font-display text-2xl font-semibold mb-6 text-center text-[#F5F3EE]">
          {titles[step]}
        </h2>

        {error && (
          <div className="info-banner info-banner-red mb-4">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── SIGN IN ── */}
        {step === 'signin' && (
          <>
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Email or Employee Code
                <input
                  type="text"
                  placeholder="you@company.com or GL-CON-XXXX"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Password
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                  className={inputClass}
                />
              </label>
              <div className="text-right -mt-1">
                <button onClick={() => go('forgot')} className={linkBtnClass}>
                  Forgot password?
                </button>
              </div>
              <button onClick={doLogin} disabled={loading} className={primaryBtnClass}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
            <div className="mt-5 text-center text-[13px] text-[#B4B2A9]">
              Don&apos;t have an account?{' '}
              <button onClick={() => go('join')} className={linkBtnClass}>
                Join us
              </button>
            </div>
          </>
        )}

        {/* ── JOIN: BASICS ── */}
        {step === 'join' && (
          <>
            <StepTag n="1 of 3" label="Your details" />
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Full name
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Agency Type
                <select
                  value={agency}
                  onChange={(e) => setAgency(e.target.value as AgencyKey)}
                  className={`${inputClass} text-[#F5F3EE] bg-[#222120]`}
                >
                  {AGENCIES.map((a) => (
                    <option key={a.key} value={a.key} className="bg-[#222120] text-[#F5F3EE]">
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Email
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Password
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <button onClick={goCompany} className={primaryBtnClass}>
                Continue →
              </button>
            </div>
            <div className="mt-5 text-center text-[13px] text-[#B4B2A9]">
              Already have an account?{' '}
              <button onClick={() => go('signin')} className={linkBtnClass}>
                Sign in
              </button>
            </div>
          </>
        )}

        {/* ── JOIN: COMPANY ── */}
        {step === 'company' && (
          <>
            <StepTag n="2 of 3" label="Company" />
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                GSTIN Number
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value);
                      setGstVerified(false);
                      setJoinMode(false);
                    }}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                  <button
                    onClick={doGstVerify}
                    disabled={gstVerifying || !gstin.trim()}
                    className={smallBtnClass}
                  >
                    {gstVerifying ? 'Verifying…' : gstVerified ? '✓' : 'Verify'}
                  </button>
                </div>
              </label>

              {gstVerified && joinMode && (
                <div className="info-banner info-banner-amber">
                  ⚠ <span><strong>{orgName || 'This organization'}</strong> is already registered. You will request to join it.</span>
                </div>
              )}

              {joinMode ? (
                <label className={labelClass}>
                  Requested Role
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className={`${inputClass} bg-[#222120]`}
                  >
                    {joinOrgDetails?.type === 'GEOTECH_CONTRACTOR' ? (
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
                </label>
              ) : (
                <>
                  <label className={labelClass}>
                    Company name
                    <input
                      type="text"
                      placeholder="Company legal name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={labelClass}>
                      City
                      <input
                        type="text"
                        placeholder="City"
                        value={orgCity}
                        onChange={(e) => setOrgCity(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      State
                      <input
                        type="text"
                        placeholder="State"
                        value={orgState}
                        onChange={(e) => setOrgState(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </>
              )}

              <button onClick={goVerify} disabled={!gstVerified} className={primaryBtnClass}>
                {joinMode ? 'Next — Request to join →' : 'Continue →'}
              </button>
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => go('join')} className={linkBtnClass}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── JOIN: VERIFY + SUBMIT ── */}
        {step === 'verify' && (
          <>
            <StepTag n="3 of 3" label="Verification" />
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Work Email
                <div className="flex gap-2">
                  <input type="email" value={email} disabled className={`${inputClass} opacity-60`} />
                  <button
                    onClick={sendEmailOtp}
                    disabled={emailVerifying || emailOtpVerified}
                    className={smallBtnClass}
                  >
                    {emailOtpVerified ? '✓' : emailOtpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </label>

              {emailOtpSent && !emailOtpVerified && (
                <label className={labelClass}>
                  Email OTP
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value)}
                      className={`${inputClass} font-mono tracking-widest text-center`}
                    />
                    <button
                      onClick={verifyEmailOtp}
                      disabled={emailVerifying || !emailOtpCode.trim()}
                      className={smallBtnClass}
                    >
                      Verify
                    </button>
                  </div>
                </label>
              )}

              {emailOtpVerified && (
                <div className="text-[13px] text-[#97C459] font-mono">✓ Email verified</div>
              )}

              <label className={labelClass}>
                Mobile Phone (optional)
                <input
                  type="tel"
                  placeholder="+91"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={inputClass}
                />
              </label>

              <button
                onClick={doRegister}
                disabled={loading || !emailOtpVerified}
                className={primaryBtnClass}
              >
                {loading
                  ? joinMode
                    ? 'Submitting request…'
                    : 'Creating account…'
                  : joinMode
                    ? 'Submit join request'
                    : 'Create account →'}
              </button>
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => go('company')} className={linkBtnClass}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── JOIN SUCCESS ── */}
        {step === 'joinSuccess' && (
          <div className="text-center">
            <div className="text-5xl mb-4">📨</div>
            <p className="text-sm text-[#B4B2A9] leading-relaxed mb-6">
              Your request to join <strong className="text-[#F5F3EE]">{orgName}</strong> has been
              submitted. An administrator has been notified — once approved, you can sign in.
            </p>
            <button onClick={() => go('signin')} className={`${primaryBtnClass} w-full`}>
              Back to Sign in
            </button>
          </div>
        )}

        {/* ── FORGOT ── */}
        {step === 'forgot' && (
          <>
            <p className="text-[13px] text-[#B4B2A9] mb-5 -mt-2 text-center">
              Enter your work email and we&apos;ll send you an OTP to reset your password.
            </p>
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Email
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doForgot()}
                  className={inputClass}
                />
              </label>
              <button onClick={doForgot} disabled={loading || !email.trim()} className={primaryBtnClass}>
                {loading ? 'Sending OTP…' : 'Send reset OTP'}
              </button>
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => go('signin')} className={linkBtnClass}>
                ← Back to Sign in
              </button>
            </div>
          </>
        )}

        {/* ── RESET ── */}
        {step === 'reset' && (
          <>
            <p className="text-[13px] text-[#B4B2A9] mb-5 -mt-2 text-center">
              An OTP was sent to <strong className="text-[#F5F3EE]">{email}</strong>.
            </p>
            <div className="flex flex-col gap-4">
              <label className={labelClass}>
                Verification code
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className={`${inputClass} font-mono tracking-widest text-center`}
                />
              </label>
              <label className={labelClass}>
                New password
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doReset()}
                  className={inputClass}
                />
              </label>
              <button
                onClick={doReset}
                disabled={loading || !resetCode.trim() || newPassword.length < 8}
                className={primaryBtnClass}
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => go('forgot')} className={linkBtnClass}>
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
