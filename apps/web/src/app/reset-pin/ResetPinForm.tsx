'use client';

import React, { useState } from 'react';
import { completePinResetAction } from '@/app/actions/account';

const inputClass =
  'bg-white/5 border border-white/15 rounded-lg px-3.5 py-3 text-[#F5F3EE] text-sm font-sans placeholder:text-[#6B6966] focus:border-[#D85A30] focus:outline-none transition';

export default function ResetPinForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="bg-gradient-to-b from-[rgba(216,90,48,0.08)] to-white/2 border border-[rgba(216,90,48,0.22)] rounded-2xl p-8">
        <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#D85A30] mb-3">
          Link incomplete
        </div>
        <p className="text-sm text-[#B4B2A9] leading-relaxed">
          This page only works when opened from a reset link sent to you on WhatsApp.
          Ask your supervisor to send the link again, then tap it directly.
          <span className="block mt-2">
            यह पेज सिर्फ WhatsApp पर मिले रीसेट लिंक से खुलता है। अपने सुपरवाइज़र से
            लिंक दोबारा मंगवाएँ।
          </span>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-gradient-to-b from-[rgba(59,109,17,0.10)] to-white/2 border border-[rgba(59,109,17,0.28)] rounded-2xl p-8">
        <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#97C459] mb-3">
          PIN reset
        </div>
        <h2 className="font-display text-2xl font-semibold text-[#F5F3EE] mb-3">
          Your new PIN is set.
        </h2>
        <p className="text-sm text-[#B4B2A9] leading-relaxed">
          Open the GroundLense Worker app and log in with your mobile number and the
          new PIN you just chose.
          <span className="block mt-2">
            अब GroundLense ऐप खोलें और अपने मोबाइल नंबर व नए पिन से लॉगिन करें।
          </span>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const mobile = ((fd.get('mobile') as string) || '').trim();
    const pin = (fd.get('pin') as string) || '';
    const pin2 = (fd.get('pin2') as string) || '';
    if (!mobile) {
      setError('Enter the mobile number your account is registered with.');
      return;
    }
    if (pin.length < 4) {
      setError('The new PIN must be at least 4 characters. / पिन कम से कम 4 अक्षर का हो।');
      return;
    }
    if (pin !== pin2) {
      setError('The two PINs do not match. / दोनों पिन मेल नहीं खाते।');
      return;
    }
    setSending(true);
    try {
      const res = await completePinResetAction({ token, mobile, newPassword: pin });
      if (res?.error) {
        setError(res.error);
      } else {
        setDone(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/4 border border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col gap-4.5"
    >
      <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
        Registered mobile number / रजिस्टर्ड मोबाइल नंबर
        <input
          name="mobile"
          type="tel"
          required
          placeholder="e.g. 9876543210"
          className={inputClass}
          autoComplete="tel"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
          New PIN / नया पिन
          <input
            name="pin"
            type="password"
            required
            minLength={4}
            placeholder="Choose a new PIN"
            className={inputClass}
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
          Confirm new PIN / पिन की पुष्टि करें
          <input
            name="pin2"
            type="password"
            required
            minLength={4}
            placeholder="Re-enter the new PIN"
            className={inputClass}
            autoComplete="new-password"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-1.5 font-sans text-sm font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] border-none px-4 py-3.5 rounded-lg cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? 'Setting new PIN…' : 'Set new PIN / नया पिन सेट करें'}
      </button>

      {error && <div className="text-sm text-[#F09595]">⚠ {error}</div>}

      <p className="text-xs text-[#6B6966] leading-relaxed">
        The reset link works once and expires after 24 hours. If it has expired, ask
        your supervisor to send a new one from the GroundLense dashboard.
      </p>
    </form>
  );
}
