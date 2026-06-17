"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getInviteDetailsAction, acceptInviteAction } from "@/app/actions/auth";

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Invite Details
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState("");

  // Input states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setInviteError("Invitation token is missing. Please check your invitation link.");
        setLoadingInvite(false);
        return;
      }

      try {
        const res = await getInviteDetailsAction(token);
        if (res.error) {
          setInviteError(res.error);
        } else {
          setInviteDetails(res);
        }
      } catch {
        setInviteError("Failed to fetch invitation details.");
      } finally {
        setLoadingInvite(false);
      }
    }
    loadInvite();
  }, [token]);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!firstName.trim()) {
      setSubmitError("First name is required.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("token", token || "");
      fd.set("firstName", firstName.trim());
      fd.set("lastName", lastName.trim());
      fd.set("password", password);

      const res = await acceptInviteAction(fd);
      if (res.error) {
        setSubmitError(res.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setSubmitError("Failed to complete registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-sec text-[13px]">
        Loading invitation details...
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <div className="bg-bg-card border border-border rounded-xl p-8 max-w-[400px] w-full text-center shadow-lg">
          <div className="text-[48px] mb-4">⚠️</div>
          <h2 className="font-display text-[20px] font-semibold text-text-pri mb-2">Invalid Invitation</h2>
          <p className="text-[12px] text-text-sec mb-6 leading-relaxed">{inviteError}</p>
          <button onClick={() => router.push("/login")} className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-all">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="bg-bg-card border border-border rounded-xl p-8 max-w-[440px] w-full shadow-lg animate-fade-up">
        <div className="text-center mb-6">
          <span className="text-[28px] block mb-2">👋</span>
          <h2 className="font-display text-[22px] font-semibold text-text-pri mb-1">Accept Invitation</h2>
          <p className="text-[12px] text-text-sec leading-relaxed">
            Join **{inviteDetails.organizationName}** as a **{inviteDetails.roleName}**
          </p>
        </div>

        <div className="mb-4">
          <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Email Address (Pre-filled)</label>
          <input
            type="text"
            value={inviteDetails.email}
            disabled
            className="w-full bg-bg-base border border-border rounded-[7px] py-[10px] px-3 text-[12px] text-text-sec opacity-75 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-[9px] mb-3">
          <div>
            <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">First name</label>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-[7px] py-[10px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Last name (optional)</label>
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-[7px] py-[10px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Create Password</label>
          <input
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-bg-base border border-border rounded-[7px] py-[10px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
          />
        </div>

        <div className="mb-5">
          <label className="text-[10px] font-semibold text-text-sec mb-[5px] block tracking-wide uppercase">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-bg-base border border-border rounded-[7px] py-[10px] px-3 text-[12px] text-text-pri outline-none focus:border-rust-mid transition-colors placeholder:text-text-ter"
          />
        </div>

        {submitError && (
          <div className="info-banner info-banner-red mb-3">
            <span>⚠</span> {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-rust-mid border-none rounded-[7px] text-[13px] font-medium text-text-pri cursor-pointer hover:bg-rust disabled:opacity-50 transition-colors"
        >
          {submitting ? "Joining Organization..." : "Complete Registration →"}
        </button>
      </div>
    </div>
  );
}

export default function RegisterInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-bg-base text-text-sec text-[13px]">
        Loading invitation details...
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}
