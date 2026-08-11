'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { contactAction } from '@/app/actions/contact';

const inputClass =
  'bg-white/5 border border-white/15 rounded-lg px-3.5 py-3 text-[#F5F3EE] text-sm font-sans placeholder:text-[#6B6966] focus:border-[#97C459] focus:outline-none transition';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await contactAction({
        name: (fd.get('name') as string) || '',
        company: (fd.get('company') as string) || undefined,
        email: (fd.get('email') as string) || '',
        phone: (fd.get('phone') as string) || undefined,
        message: (fd.get('message') as string) || '',
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

  return (
    <div className="bg-[#1A1918] min-h-screen">
      {/* ================= NAV ================= */}
      <nav className="sticky top-0 z-50 bg-[#1A1918]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <img
              src="/groundlense-logo.png"
              alt="Groundlense"
              className="h-12 sm:h-16 w-auto"
            />
          </Link>
          <Link
            href="/login"
            className="font-sans text-xs font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] px-4.5 py-2.5 rounded-lg whitespace-nowrap transition transform hover:scale-105"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ================= CONTACT ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1918] via-[#222120] to-[#1A1918] px-5 sm:px-6 py-12 md:py-20">
        <div className="max-w-[1160px] mx-auto">
          <div className="max-w-[640px] mb-14">
            <div className="font-mono text-xs tracking-widest text-[#97C459] mb-4 uppercase">
              Get in touch
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight font-semibold tracking-tight text-[#F5F3EE] mb-4">
              Let&apos;s talk about your next investigation.
            </h1>
            <p className="text-base text-[#B4B2A9] font-light">
              Questions about pricing, a pilot project, or the platform itself — reach out and we&apos;ll get back within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-start">
            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="bg-white/4 border border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col gap-4.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
                  Full name
                  <input name="name" type="text" required placeholder="Your name" className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
                  Company
                  <input name="company" type="text" placeholder="Company name" className={inputClass} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
                Email
                <input name="email" type="email" required placeholder="you@company.com" className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
                Phone (optional)
                <input name="phone" type="tel" placeholder="+91 00000 00000" className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-[#B4B2A9]">
                Message
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Tell us about your project or question"
                  className={`${inputClass} resize-y`}
                ></textarea>
              </label>
              <button
                type="submit"
                disabled={sending || submitted}
                className="mt-1.5 font-sans text-sm font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] border-none px-4 py-3.5 rounded-lg cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitted ? 'Sent ✓' : sending ? 'Sending…' : 'Send message'}
              </button>
              {error && (
                <div className="text-sm text-[#F09595]">⚠ {error}</div>
              )}
              {submitted && (
                <div className="text-sm text-[#97C459] font-mono">
                  ✓ Thanks — we&apos;ll be in touch shortly.
                </div>
              )}
            </form>

            {/* DETAILS */}
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-b from-[rgba(59,109,17,0.08)] to-white/2 border border-[rgba(59,109,17,0.22)] rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#97C459] mb-4">
                  Direct contact
                </div>
                <div className="flex flex-col gap-3.5">
                  <a
                    href="mailto:info@groundlense.com"
                    className="flex items-center gap-3 text-[#F5F3EE] text-sm hover:text-[#97C459] transition"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[rgba(59,109,17,0.14)] flex items-center justify-center text-[15px]">
                      ✉
                    </span>
                    info@groundlense.com
                  </a>
                  <a
                    href="tel:+919218107330"
                    className="flex items-center gap-3 text-[#F5F3EE] text-sm hover:text-[#97C459] transition"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[rgba(59,109,17,0.14)] flex items-center justify-center text-[15px]">
                      ☎
                    </span>
                    +91 92181 07330
                  </a>
                  <a
                    href="https://wa.me/919218107330"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#F5F3EE] text-sm hover:text-[#97C459] transition"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[rgba(37,211,102,0.16)] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.78.47 3.45 1.29 4.9L2 22l5.29-1.39c1.4.76 3 1.2 4.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.92 6.45 17.5 2 12.04 2m0 18.15h-.01c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.16 8.16 0 0 1-1.26-4.36c0-4.51 3.67-8.19 8.19-8.19 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.51-3.68 8.26-8.06 8.26m4.48-6.13c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.12-.5.13-.12.29-.32.44-.48.14-.16.19-.27.29-.45.1-.19.05-.35-.02-.48-.08-.12-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.46.06-.7.32-.25.25-.94.92-.94 2.24s.97 2.6 1.1 2.78c.14.19 1.9 2.9 4.62 3.95 2.71 1.05 2.71.7 3.2.65.49-.05 1.58-.65 1.8-1.28.22-.63.22-1.17.15-1.28-.06-.11-.24-.18-.5-.31" />
                      </svg>
                    </span>
                    WhatsApp us
                  </a>
                </div>
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-3.5">
                  Registered office
                </div>
                <div className="text-sm text-[#B4B2A9] leading-relaxed">
                  Groundlense Technologies
                  <br />
                  Private Limited
                  <br />
                  Gurugram, Haryana
                </div>
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-2.5">
                  Response time
                </div>
                <div className="text-sm text-[#B4B2A9]">
                  We typically reply within <strong className="text-[#97C459]">24 hours</strong>, Monday to Saturday.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
