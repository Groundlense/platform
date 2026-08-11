'use client';

import React, { useState } from 'react';
import { deleteAccountRequestAction } from '@/app/actions/account';

const inputClass =
  'bg-white/5 border border-white/15 rounded-lg px-3.5 py-3 text-[#F5F3EE] text-sm font-sans placeholder:text-[#6B6966] focus:border-[#D85A30] focus:outline-none transition';

export default function DeleteAccountForm() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await deleteAccountRequestAction({
        name: (fd.get('name') as string) || '',
        email: (fd.get('email') as string) || '',
        phone: (fd.get('phone') as string) || undefined,
        organization: (fd.get('organization') as string) || undefined,
        reason: (fd.get('reason') as string) || undefined,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-b from-[rgba(59,109,17,0.10)] to-white/2 border border-[rgba(59,109,17,0.28)] rounded-2xl p-8">
        <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#97C459] mb-3">
          Request received
        </div>
        <h2 className="font-display text-2xl font-semibold text-[#F5F3EE] mb-3">
          We&apos;ve logged your deletion request.
        </h2>
        <p className="text-sm text-[#B4B2A9] leading-relaxed">
          A confirmation has been sent to the email address you entered. We will verify
          that the request comes from the account owner and confirm deletion by email
          within 30 days. If you don&apos;t hear from us, write to{' '}
          <a href="mailto:info@groundlense.com" className="text-[#97C459] hover:underline">
            info@groundlense.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/4 border border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col gap-4.5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
          Full name (as on your account)
          <input name="name" type="text" required placeholder="Your name" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
          Organization (optional)
          <input name="organization" type="text" placeholder="Company name" className={inputClass} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
        Account email
        <input name="email" type="email" required placeholder="you@company.com" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
        Registered mobile number (optional — helps us find worker accounts)
        <input name="phone" type="tel" placeholder="+91 00000 00000" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
        Reason (optional)
        <textarea
          name="reason"
          rows={3}
          placeholder="Anything you'd like us to know"
          className={`${inputClass} resize-y`}
        ></textarea>
      </label>

      <label className="flex items-start gap-3 text-xs text-[#B4B2A9] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#D85A30] cursor-pointer"
        />
        <span>
          I am the owner of this account and I understand that deleting it permanently
          removes my profile and my access to GroundLense. This cannot be undone.
        </span>
      </label>

      <button
        type="submit"
        disabled={sending || !confirmed}
        className="mt-1.5 font-sans text-sm font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] border-none px-4 py-3.5 rounded-lg cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending…' : 'Request account deletion'}
      </button>

      {error && <div className="text-sm text-[#F09595]">⚠ {error}</div>}

      <p className="text-xs text-[#6B6966] leading-relaxed">
        Prefer email? Send your name and account email to{' '}
        <a href="mailto:info@groundlense.com?subject=Account%20deletion%20request" className="text-[#B4B2A9] hover:text-[#97C459] transition">
          info@groundlense.com
        </a>{' '}
        with the subject &quot;Account deletion request&quot;.
      </p>
    </form>
  );
}
