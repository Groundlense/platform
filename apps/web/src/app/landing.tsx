'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/landing/AuthModal';

export default function LandingPage({
  initialAuthOpen = false,
  redirectTo,
  initialEmail,
  initialSignUp = false,
}: {
  initialAuthOpen?: boolean;
  redirectTo?: string;
  initialEmail?: string;
  initialSignUp?: boolean;
}) {
  const [showAuth, setShowAuth] = useState(initialAuthOpen);

  return (
    <div className="bg-[#1A1918] min-h-screen">

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          redirectTo={redirectTo}
          initialEmail={initialEmail}
          initialSignUp={initialSignUp}
        />
      )}

      {/* ================= NAV ================= */}
      <nav className="sticky top-0 z-50 bg-[#1A1918]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-[1220px] mx-auto px-6 py-3 flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <img
              src="/groundlense-logo.png"
              alt="Groundlense"
              className="h-[64px] w-auto"
            />
          </div>
          <div className="flex items-center gap-7 flex-wrap justify-end">
            <Link
              href="/overview"
              className="font-sans text-sm font-medium text-[#B4B2A9] hover:text-[#97C459] transition whitespace-nowrap"
            >
              Overview
            </Link>
            <Link
              href="/contact"
              className="font-sans text-sm font-medium text-[#B4B2A9] hover:text-[#97C459] transition whitespace-nowrap"
            >
              Contact us
            </Link>
            <button
              onClick={() => setShowAuth(true)}
              className="relative font-sans text-xs font-semibold text-white bg-[#D85A30] hover:bg-[#993C1D] px-4.5 py-2.5 rounded-lg whitespace-nowrap transition transform hover:scale-105 border-none cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="sticky top-[82px] z-10 overflow-hidden bg-gradient-to-br from-[#1A1918] via-[#222120] to-[#1A1918]">
        <div className="max-w-[1220px] mx-auto px-6 py-20 flex flex-wrap gap-14 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="inline-flex items-center gap-2.5 font-mono text-[11px] letter-spacing-wide text-[#97C459] mb-7">
              <span className="w-2 h-2 rounded-full bg-[#97C459] animate-pulse"></span>
              Geotech field intelligence Platform
            </div>

            <p className="text-lg leading-relaxed text-[#B4B2A9] max-w-[560px] mb-10 font-light">
              Geotechnical boring data captured live at the rig — GPS-stamped, IS-code tagged and certified as it happens. The investigation you already pay for, delivered as a complete, verifiable record you own.
            </p>

            <div className="flex flex-wrap gap-5 text-xs font-mono text-[#6B6966] mt-10">
              <span>IS 1892</span>
              <span>· IS 2131</span>
              <span>· SHA-256 tamper-evident</span>
              <span>· NABL integration</span>
            </div>
          </div>
        </div>

        {/* WORKFLOW PIPELINE */}
        <div className="max-w-[1220px] mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { icon: '◆', label: 'GT crew', title: 'Field capture' },
              { icon: '◎', label: 'Engineer', title: 'QC review' },
              { icon: '▣', label: 'Contractor', title: 'Live monitor' },
              { icon: '▤', label: 'Authority / IE', title: 'Verified PDF' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center gap-3.5"
              >
                <span className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                  idx % 2 === 0
                    ? 'bg-[rgba(59,109,17,0.12)] text-[#97C459]'
                    : 'bg-[rgba(216,90,48,0.12)] text-[#D85A30]'
                }`}>
                  {item.icon}
                </span>
                <div>
                  <div className="font-mono text-[10px] text-[#6B6966] uppercase">
                    {item.label}
                  </div>
                  <div className="text-sm font-semibold text-[#F5F3EE]">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="relative z-20 bg-[#222120] px-6 py-20 border-t border-white/5 rounded-t-7xl">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-[840px] mx-auto mb-16 text-center">
            <div className="font-mono text-xs tracking-widest text-[#BA7517] mb-5 uppercase">
              The Pain
            </div>
            <p className="font-display text-3xl md:text-4xl leading-tight font-normal tracking-tight text-[#F5F3EE]">
              You pay in full for your geotechnical investigation — and receive interpolated numbers you never saw measured, weeks later, with founding-depth decisions resting on them.
            </p>
          </div>

          <div className="flex flex-wrap gap-7 justify-center items-stretch max-w-6xl mx-auto">
            <div className="flex-1 min-w-[300px] max-w-[440px] flex flex-col">
              <div className="flex-1 bg-white/4 border-2 border-dashed border-white/20 rounded-3xl p-6 transform -rotate-1 relative overflow-hidden">
                <div className="blur-sm opacity-45">
                  {['55%', '100%', '92%', '78%', '88%', '64%'].map((width, i) => (
                    <div
                      key={i}
                      className="h-2.5 bg-white/20 rounded-full mb-4"
                      style={{ width }}
                    ></div>
                  ))}
                </div>
                <div className="absolute left-0 right-0 bottom-0 p-3.5 bg-gradient-to-t from-[#222120]">
                  <span className="font-mono text-xs text-[#6B6966]">
                    Interpolated report · received weeks later
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[300px] max-w-[440px] flex flex-col">
              <div className="flex-1 bg-gradient-to-b from-[rgba(59,109,17,0.08)] to-white/2 border border-[rgba(59,109,17,0.22)] rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <div className="font-display text-xl font-semibold text-[#F5F3EE]">
                    Verified record
                  </div>
                  <span className="font-mono text-xs text-[#97C459] bg-[rgba(59,109,17,0.14)] px-3 py-1.5 rounded-full">
                    LIVE
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    'GPS + timestamp on every entry',
                    'Photo-documented at the rig',
                    'Certified against IS 1892 / IS 2131',
                    'Yours, permanently, in real time',
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-[#97C459] text-white text-xs flex items-center justify-center font-bold">
                        ✓
                      </span>
                      <span className="text-sm text-[#B4B2A9]">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/10 font-mono text-xs text-[#6B6966]">
                  Tamper-evident · captured live
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHAT WE DO ================= */}
      <section className="relative z-20 bg-[#1A1918] px-6 py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-[760px] mx-auto mb-16 text-center">
            <div className="font-mono text-xs tracking-widest text-[#97C459] mb-5 uppercase">
              What Groundlense does
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-snug font-semibold tracking-tight text-[#F5F3EE] mb-4">
              From the drill bit to a certified record.
            </h2>
            <p className="text-lg text-[#B4B2A9] font-light">
              Every metre logged at the rig — stamped, photographed and certified — then delivered as a record you can prove.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 justify-center items-stretch">
            {/* Drilling Rig Card */}
            <div className="flex-1 min-w-[300px] max-w-[420px] bg-white/4 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-xs text-[#97C459] uppercase tracking-wider">
                  Drilling rig · BH-07
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#97C459]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#97C459] animate-pulse"></span>
                  LIVE CAPTURE
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden">
                <div className="flex flex-col">
                  {[
                    { depth: '0.0 m', desc: 'Fill', h: 66, bg: '#C9A45B', text: '#5c4a26' },
                    { depth: '2.5 m', desc: 'Silty clay', h: 78, bg: '#A9843F', text: '#f2e6cf', spt: 'SPT N=12' },
                    { depth: '5.5 m', desc: 'Fine sand', h: 74, bg: '#C9A45B', text: '#5c4a26' },
                    { depth: '8.5 m', desc: 'Stiff clay', h: 78, bg: '#7D6234', text: '#f2e6cf', spt: 'SPT N=24' },
                    { depth: '12.5 m', desc: 'Weathered rock', h: 84, bg: '#5A4626', text: '#f2e6cf' },
                  ].map((layer, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${layer.h}px`, backgroundColor: layer.bg }}
                      className="flex items-start justify-between p-2.5"
                    >
                      <span
                        style={{ color: layer.text }}
                        className="font-mono text-xs"
                      >
                        {layer.depth} · {layer.desc}
                      </span>
                      {layer.spt && (
                        <span className="font-mono text-xs bg-black/60 text-[#97C459] px-2 py-1 rounded-full">
                          {layer.spt}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 font-mono text-xs text-[#6B6966] text-center">
                Live borehole log — depth · strata · SPT · GPS · photo
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center gap-3 min-w-[120px]">
              <div className="font-mono text-xs text-[#97C459] text-center leading-relaxed">
                Stamped<br />
                Certified<br />
                IS 1892 / 2131
              </div>
              <div className="text-4xl text-[#D85A30]">→</div>
            </div>

            {/* Verified Record Card */}
            <div className="flex-1 min-w-[280px] max-w-[400px] bg-gradient-to-b from-[rgba(59,109,17,0.08)] to-white/2 border border-[rgba(59,109,17,0.22)] rounded-3xl p-6 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="font-display text-xl font-semibold text-[#F5F3EE]">
                  Verified record
                </div>
                <span className="flex items-center gap-1.5 font-mono text-xs text-[#97C459] bg-[rgba(59,109,17,0.14)] px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#97C459]"></span>
                  IS-CERTIFIED
                </span>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {[
                  'GPS + timestamp on every entry',
                  'Photo-documented at the rig',
                  'Certified against IS 1892 / IS 2131',
                  'Delivered in real time — yours to keep',
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-[#97C459] text-[#1A1918] text-xs flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-sm text-[#B4B2A9]">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 font-mono text-xs text-[#6B6966]">
                Tamper-evident · SHA a3f9…c21e
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURE GRID ================= */}
      <section className="relative z-20 bg-[#1A1918] px-6 py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-[720px] mx-auto mb-16 text-center">
            <div className="font-mono text-xs tracking-widest text-[#97C459] mb-5 uppercase">
              The platform
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-semibold tracking-tight text-[#F5F3EE]">
              Everything, verified at the source.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '▤',
                title: 'Field App on Site',
                body: 'The field team enters SPT data and soil descriptions on a phone — instantly. GPS coordinates and timestamps are captured automatically with every entry.',
                badge: 'Real-time entry',
                bg: 'rgba(59,109,17,0.12)',
                fg: '#97C459',
              },
              {
                icon: '◎',
                title: 'Actual Location Locked',
                body: 'The exact GPS coordinates of the boring are recorded the moment it begins. If the team moves from the planned location, the system flags the deviation.',
                badge: 'GPS verified',
                bg: 'rgba(216,90,48,0.12)',
                fg: '#D85A30',
              },
              {
                icon: '▚',
                title: 'Depth Verified',
                body: 'Every SPT interval is timestamped as it happens. The actual depth advanced is logged against the depth on record — any discrepancy is visible.',
                badge: 'Verified',
                bg: 'rgba(59,109,17,0.12)',
                fg: '#97C459',
              },
              {
                icon: '◇',
                title: 'Sample Tracking',
                body: 'Every sample gets a unique digital ID at the moment of collection — linked to boring, depth, and timestamp. No mixing, no smudged labels.',
                badge: 'Traceable',
                bg: 'rgba(216,90,48,0.12)',
                fg: '#D85A30',
              },
              {
                icon: '▣',
                title: 'Live Monitoring Portal',
                body: 'Watch every boring as it happens from your office. Status, depth, active team, GPS location — updating in real time.',
                badge: 'Live feed',
                bg: 'rgba(59,109,17,0.12)',
                fg: '#97C459',
              },
              {
                icon: '◈',
                title: 'Permanent Data Vault',
                body: 'Every boring is stored securely, indefinitely. Three or five years later, when a new project needs the same subsurface data, its retrievable instantly.',
                badge: 'Stored forever',
                bg: 'rgba(216,90,48,0.12)',
                fg: '#D85A30',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/4 border border-white/8 rounded-2xl p-8 flex flex-col hover:border-white/15 hover:bg-white/5 transition"
              >
                <div
                  style={{ backgroundColor: feature.bg, color: feature.fg }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-5"
                >
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-3 text-[#F5F3EE]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#B4B2A9] flex-1 mb-5">{feature.body}</p>
                <span
                  style={{ backgroundColor: feature.bg, color: feature.fg }}
                  className="inline-flex w-fit font-mono text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  {feature.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMPARISON TABLE ================= */}
      <section className="relative z-20 bg-[#222120] px-6 py-20 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight font-semibold tracking-tight text-[#F5F3EE] mb-12">
            The same investigation.<br />
            A <em className="not-italic text-[#D85A30]">completely different</em> outcome.
          </h2>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] border-collapse border border-white/10">
              <thead>
                <tr>
                  <th className="px-6 py-5 text-left font-mono text-xs font-semibold uppercase text-[#6B6966] bg-white/4 border-b border-white/10">
                    Parameter
                  </th>
                  <th className="px-6 py-5 text-left font-mono text-xs font-semibold uppercase text-[#D85A30] bg-[rgba(216,90,48,0.15)] border-b border-white/10">
                    Manual Geotech Agency
                  </th>
                  <th className="px-6 py-5 text-left font-mono text-xs font-semibold uppercase text-[#97C459] bg-[rgba(59,109,17,0.4)] border-b border-white/10">
                    Groundlense
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    param: 'Boring start to design finalization',
                    manual: '14–21 days of manual compilation',
                    glStrong: 'Data ready instantly',
                    glRest: 'as boring completes',
                  },
                  {
                    param: 'Data availability after 3–5 years',
                    manual: 'Files lost — re-investigation needed',
                    glStrong: 'Stored permanently,',
                    glRest: 'retrievable anytime',
                  },
                  {
                    param: 'Actual depth vs recorded depth',
                    manual: 'No verification — recorded as claimed',
                    glStrong: 'GPS-verified',
                    glRest: 'actual depth on record',
                  },
                  {
                    param: 'Live data monitoring',
                    manual: 'None — phone calls and WhatsApp only',
                    glStrong: 'Real-time portal',
                    glRest: 'from your office',
                  },
                  {
                    param: 'Team presence on site',
                    manual: 'Unverifiable',
                    glStrong: 'GPS-confirmed',
                    glRest: 'team presence',
                  },
                  {
                    param: 'SPT test intervals executed',
                    manual: 'Cannot confirm if or when done',
                    glStrong: 'Timestamped',
                    glRest: 'proof per interval',
                  },
                  {
                    param: 'Data authenticity',
                    manual: 'Editable Excel — no proof of original',
                    glStrong: 'Tamper-proof',
                    glRest: 'SHA-256 chain',
                  },
                  {
                    param: 'Risk of data loss',
                    manual: 'High — work done, data gone',
                    glStrong: 'Zero loss',
                    glRest: '— every boring preserved',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-6 py-5 text-sm font-semibold text-[#F5F3EE] align-top">
                      {row.param}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#B4B2A9] bg-[rgba(216,90,48,0.06)] align-top">
                      <div className="flex gap-3 items-start">
                        <span className="text-[#D85A30] flex-shrink-0">✕</span>
                        <span>{row.manual}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#B4B2A9] bg-[rgba(59,109,17,0.12)] align-top">
                      <div className="flex gap-3 items-start">
                        <span className="text-[#97C459] flex-shrink-0">✓</span>
                        <span>
                          <strong className="text-[#A3C98A] font-semibold">{row.glStrong}</strong> {row.glRest}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= CREDIBILITY STRIP ================= */}
      <section className="relative z-20 bg-[#151A16] px-6 py-10 border-t border-b border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-wrap gap-8 justify-center items-center">
          {[
            'IS-code certified',
            'Built by practising highway engineers',
            'GPS-verified every entry',
            'Tamper-evident record',
          ].map((text, idx) => (
            <React.Fragment key={idx}>
              <span className="font-mono text-xs tracking-wider text-[#B4B2A9]">
                {text}
              </span>
              {idx < 3 && <span className="w-1 h-1 rounded-full bg-[#97C459]"></span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer
        id="contact"
        className="relative z-20 bg-[#0D1110] text-[#B4B2A9] px-6 py-16 border-t border-white/5"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap gap-10 justify-between items-start pb-10 border-b border-white/10">
            <div className="max-w-sm">
              <img
                src="/groundlense-logo.png"
                alt="Groundlense"
                className="h-24 w-auto mb-3"
              />
              <div className="font-mono text-xs tracking-widest text-[#BA7517] uppercase">
                Proof, Not Promises.
              </div>
            </div>
            <div className="flex flex-wrap gap-11">
              <div>
                <div className="font-mono text-xs tracking-widest text-[#6B6966] uppercase mb-3.5">
                  Contact
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <a
                    href="mailto:info@groundlense.com"
                    className="text-[#B4B2A9] hover:text-[#97C459] transition"
                  >
                    info@groundlense.com
                  </a>
                  <a
                    href="tel:+919218107330"
                    className="text-[#B4B2A9] hover:text-[#97C459] transition"
                  >
                    +91 92181 07330
                  </a>
                  <a
                    href="https://www.groundlense.com"
                    className="text-[#B4B2A9] hover:text-[#97C459] transition"
                  >
                    www.groundlense.com
                  </a>
                </div>
              </div>
              <div>
                <div className="font-mono text-xs tracking-widest text-[#6B6966] uppercase mb-3.5">
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
            </div>
          </div>
          <div className="pt-6 text-xs text-[#6B6966]">
            © 2026 Groundlense Technologies Private Limited. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ================= WHATSAPP BUTTON ================= */}
      <a
        href="https://wa.me/919218107330"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-60 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl transition"
        aria-label="Contact us on WhatsApp"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.78.47 3.45 1.29 4.9L2 22l5.29-1.39c1.4.76 3 1.2 4.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.92 6.45 17.5 2 12.04 2m0 18.15h-.01c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.16 8.16 0 0 1-1.26-4.36c0-4.51 3.67-8.19 8.19-8.19 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.51-3.68 8.26-8.06 8.26m4.48-6.13c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.12-.5.13-.12.29-.32.44-.48.14-.16.19-.27.29-.45.1-.19.05-.35-.02-.48-.08-.12-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.46.06-.7.32-.25.25-.94.92-.94 2.24s.97 2.6 1.1 2.78c.14.19 1.9 2.9 4.62 3.95 2.71 1.05 2.71.7 3.2.65.49-.05 1.58-.65 1.8-1.28.22-.63.22-1.17.15-1.28-.06-.11-.24-.18-.5-.31" />
        </svg>
      </a>
    </div>
  );
}
