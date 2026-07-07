"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createPasswordAction } from "@/app/actions/auth";
import { RiShieldKeyholeLine, RiCellphoneLine, RiArrowRightLine, RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";

function CreateAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mobileParam = searchParams.get("mobile") || "";

  const [mobile, setMobile] = useState(mobileParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mobileParam) {
      setMobile(mobileParam);
    }
  }, [mobileParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    // Base64 encode password to match auth actions expectation
    const passwordEncoded = btoa(password);
    const res = await createPasswordAction(mobile.trim(), passwordEncoded);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || "Failed to activate account. Please check the mobile number.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1918] p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-[#222120] border border-white/5 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rust-mid/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rust/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-rust-light border border-rust-mid rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl text-rust-mid">⛏</span>
          </div>
          <h1 className="text-xl font-bold text-text-pri tracking-wide">Groundlense Activation</h1>
          <p className="text-xs text-text-sec mt-1">Set your password to activate your mobile app account</p>
        </div>

        {success ? (
          <div className="animate-fade-in text-center py-4">
            <div className="w-16 h-16 bg-green-d/15 border border-green-d/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <RiCheckboxCircleLine className="text-3xl text-green-d" />
            </div>
            <h2 className="text-lg font-bold text-text-pri">Account Activated!</h2>
            <p className="text-xs text-text-sec mt-2 leading-relaxed">
              Your account has been activated successfully. You can now open the **Groundlense Mobile App** and log in using your phone number and the password you just created.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => router.push("/login")}
                className="btn btn-primary w-full justify-center gap-2 py-2.5 rounded-lg text-xs"
              >
                Go to Web Portal Login
              </button>
              <div className="text-[10px] text-text-ter mt-2">
                Mobile app is required for field logs and SPT recording
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-mid/10 border border-red-mid/20 rounded-lg p-3 text-xs text-red-d flex items-start gap-2 animate-fade-in">
                <RiCloseCircleLine className="text-base flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-ter uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <RiCellphoneLine className="absolute left-3 top-2.5 text-text-ter text-sm" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  disabled={!!mobileParam}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-lg bg-[#2A2826] text-text-pri focus:border-rust-mid focus:outline-none disabled:opacity-60"
                  required
                />
              </div>
              {mobileParam && (
                <span className="text-[9px] text-text-ter">Your phone number is pre-verified by your supervisor.</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-ter uppercase tracking-wider">Create Password</label>
              <div className="relative">
                <RiShieldKeyholeLine className="absolute left-3 top-2.5 text-text-ter text-sm" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-lg bg-[#2A2826] text-text-pri focus:border-rust-mid focus:outline-none"
                  minLength={4}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-ter uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <RiShieldKeyholeLine className="absolute left-3 top-2.5 text-text-ter text-sm" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-lg bg-[#2A2826] text-text-pri focus:border-rust-mid focus:outline-none"
                  minLength={4}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center gap-2 py-2.5 rounded-lg text-xs mt-2 disabled:opacity-60"
            >
              {loading ? "Activating..." : "Activate Account"}
              {!loading && <RiArrowRightLine />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1A1918] p-4 text-text-sec text-xs">
        Loading...
      </div>
    }>
      <CreateAccountForm />
    </Suspense>
  );
}
