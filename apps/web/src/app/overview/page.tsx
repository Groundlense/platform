'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

const CHAIN = [
  {
    step: 'FAILURE 01 · THE DELAY',
    title: 'Photos sent on WhatsApp. The actual report — three weeks later.',
    body: (
      <>
        The supervisor has photos with timestamps. He has SPT numbers on paper. But this raw data
        sits with him, then his manager, then the office. By the time you get a structured report,{' '}
        <strong className="text-[#F5F3EE] font-medium">40 to 50 days</strong> have passed. Your
        design team cannot start. Your project clock keeps ticking.
      </>
    ),
  },
  {
    step: 'FAILURE 02 · THE LOCATION',
    title: 'The boring happened, but not where you planned it.',
    body: (
      <>
        The drawing said the borehole should be at{' '}
        <em className="text-[#FAC775] not-italic">chainage 24+580, 6m offset from centreline</em>.
        On site, the actual position shifted — there was a tree, a kacha drain, a transformer pole.
        The boring was done <strong className="text-[#F5F3EE] font-medium">15 metres away.</strong>{' '}
        No one updated the coordinates. The design assumes the original location. The reality is
        somewhere else.
      </>
    ),
  },
  {
    step: 'FAILURE 03 · THE RL',
    title: 'Coordinates changed. The RL did not.',
    body: (
      <>
        When the boring location moves, the Reduced Level changes too. The original RL was{' '}
        <em className="text-[#FAC775] not-italic">284.3 m</em>. At the actual location, ground level
        is <em className="text-[#FAC775] not-italic">286.1 m</em>. That&apos;s a{' '}
        <strong className="text-[#F5F3EE] font-medium">1.8 metre difference</strong> in elevation.
        The report still shows the planned RL. Your foundation depth gets calculated from the wrong
        reference.
      </>
    ),
  },
  {
    step: 'FAILURE 04 · THE SAMPLES',
    title: 'Sample bags get mixed. Lab tests the wrong soil.',
    body: (
      <>
        Six samples collected across two borings on the same day. Tagged with handwritten labels.
        Sent to the NABL lab three days later. By the time they arrive,{' '}
        <strong className="text-[#F5F3EE] font-medium">two labels are smudged.</strong> The lab
        technician guesses. The test results come back — but they describe a different depth than
        what was actually sampled.
      </>
    ),
  },
  {
    step: 'FAILURE 05 · THE TRUST',
    title: 'Nobody verifies. Everyone signs.',
    body: (
      <>
        The supervisor sends data. The manager forwards it. The engineer enters it into Excel. The
        senior reviews it. Every signature is based on{' '}
        <strong className="text-[#F5F3EE] font-medium">trusting the previous person.</strong> There
        is no SOP. No automation. No checkpoint. If anyone in the chain made a mistake — or chose
        to — there is no way to detect it before the final report.
      </>
    ),
  },
  {
    step: 'FAILURE 06 · THE TRANSPARENCY',
    title: "You cannot see what's actually happening.",
    body: (
      <>
        You are paying for the investigation. The data is being collected. The report will arrive.
        But for those <strong className="text-[#F5F3EE] font-medium">14 to 21 days</strong> in
        between, you have no visibility — only the supervisor&apos;s verbal updates. If something is
        going wrong, you find out when it&apos;s too late to fix.
      </>
    ),
  },
  {
    step: 'FAILURE 07 · THE CONSEQUENCE',
    title: "The design is built on assumptions that aren't true.",
    damage: true,
    body: (
      <>
        The structural engineer receives the geotech report. He assumes the location, RL, SPT
        values, and lab results are correct. He designs the foundation.{' '}
        <strong className="text-[#F5F3EE] font-medium">
          The data he is trusting was wrong from day one
        </strong>{' '}
        — and the consequence shows up only after construction begins.
      </>
    ),
  },
];

const SOLUTIONS = [
  {
    icon: '📱',
    title: 'Field App on Site',
    body: 'The field team enters SPT data and soil descriptions on a phone — instantly. GPS coordinates and timestamps are captured automatically with every entry. No paper, no manual transcription, no Excel.',
    tag: 'REAL-TIME ENTRY',
    tagClass: 'bg-[rgba(59,109,17,.25)] text-[#97C459] border-[rgba(59,109,17,.4)]',
  },
  {
    icon: '📍',
    title: 'Actual Location Locked',
    body: 'The exact GPS coordinates of the boring are recorded the moment it begins. If the team moves from the planned location, the system flags the deviation and updates the RL automatically.',
    tag: 'GPS VERIFIED',
    tagClass: 'bg-[rgba(216,90,48,.18)] text-[#F0997B] border-[rgba(216,90,48,.3)]',
  },
  {
    icon: '📏',
    title: 'Depth Verified',
    body: 'Every SPT interval is timestamped as it happens. The actual depth advanced is logged against the depth being billed. Any discrepancy is visible before the invoice is approved.',
    tag: 'VERIFIED',
    tagClass: 'bg-[rgba(216,90,48,.18)] text-[#F0997B] border-[rgba(216,90,48,.3)]',
  },
  {
    icon: '🧪',
    title: 'Sample Tracking',
    body: 'Every sample gets a unique digital ID at the moment of collection — linked to boring, depth, and timestamp. The NABL lab receives the same ID. No mixing, no smudged labels, no guessing.',
    tag: 'TRACEABLE',
    tagClass: 'bg-[rgba(24,95,165,.25)] text-[#85B7EB] border-[rgba(24,95,165,.4)]',
  },
  {
    icon: '🖥️',
    title: 'Live Monitoring Portal',
    body: 'Watch every boring as it happens from your office. Status, depth, active team, GPS location — updating in real time. The 14-to-21-day delay is replaced by instant visibility.',
    tag: 'LIVE FEED',
    tagClass: 'bg-[rgba(59,109,17,.25)] text-[#97C459] border-[rgba(59,109,17,.4)]',
  },
  {
    icon: '🗄️',
    title: 'Permanent Data Vault',
    body: 'Every boring is stored securely, indefinitely. Three or five years later, when a new project needs the same subsurface data, it is retrievable instantly — no re-investigation, no rebuilding from scratch.',
    tag: 'STORED FOREVER',
    tagClass: 'bg-[rgba(24,95,165,.25)] text-[#85B7EB] border-[rgba(24,95,165,.4)]',
  },
];

const CMP_ROWS = [
  { param: 'Boring start to design finalization', manual: '14–21 days of manual compilation', glStrong: 'Data ready instantly', glRest: ' as boring completes' },
  { param: 'Data availability after 3–5 years', manual: 'Files lost — re-investigation needed', glStrong: 'Stored permanently', glRest: ', retrievable anytime' },
  { param: 'Actual depth vs billed depth', manual: 'No verification — billed as claimed', glStrong: 'GPS-verified', glRest: ' actual depth on record' },
  { param: 'Live data monitoring', manual: 'None — phone calls and WhatsApp only', glStrong: 'Real-time portal', glRest: ' from your office' },
  { param: 'Team actually working on site', manual: 'Unverifiable', glStrong: 'GPS-confirmed', glRest: ' team presence' },
  { param: 'SPT test intervals executed', manual: 'Cannot confirm if or when done', glStrong: 'Timestamped', glRest: ' proof per interval' },
  { param: 'Data authenticity', manual: 'Editable Excel — no proof of original', glStrong: 'Tamper-proof', glRest: ' SHA-256 chain' },
  { param: 'Risk of data loss', manual: 'High — work done, data gone', glStrong: 'Zero loss', glRest: ' — every boring preserved' },
];

const kickerClass =
  'font-mono text-[11px] text-[#F0997B] tracking-[0.25em] uppercase mb-4';
const headlineClass =
  'font-display text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.06] tracking-tight text-[#F5F3EE] mb-4';
const hlClass = 'text-[#D85A30] italic';
const subClass = 'text-base md:text-lg text-[#B4B2A9] leading-relaxed max-w-[680px] font-light';
const secNumClass =
  'hidden sm:block absolute top-10 right-[7vw] font-mono text-[11px] text-[#6B6966] tracking-[0.25em]';
const dashBarDots = (
  <>
    <div className="w-2 h-2 rounded-full bg-[#A32D2D]"></div>
    <div className="w-2 h-2 rounded-full bg-[#FAC775]"></div>
    <div className="w-2 h-2 rounded-full bg-[#97C459]"></div>
  </>
);

export default function OverviewPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-ov]'));
    const dots = Array.from(document.querySelectorAll<HTMLElement>('[data-ov-dot]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement);
            dots.forEach((d, i) => {
              d.classList.toggle('ov-dot-active', i === idx);
            });
            entry.target.querySelectorAll('.ov-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('ov-visible'), i * 90);
            });
          }
        });
      },
      { threshold: 0.18 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const goTo = (idx: number) => {
    document.getElementById(SECTIONS[idx])?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="bg-[#1A1918] text-[#F5F3EE] overflow-x-clip">
      <style>{`
        .ov-reveal { opacity: 0; transform: translateY(20px); transition: opacity .55s ease, transform .55s ease; }
        .ov-reveal.ov-visible { opacity: 1; transform: translateY(0); }
        .ov-dot { width: 7px; height: 7px; border-radius: 50%; background: #3A3836; cursor: pointer; transition: all .35s; border: none; padding: 0; }
        .ov-dot-active { background: #D85A30; transform: scale(1.6); box-shadow: 0 0 12px rgba(216,90,48,.5); }
        .ov-section { min-height: 100vh; position: relative; display: flex; flex-direction: column; justify-content: center; padding: 100px 7vw 80px; overflow: hidden; }
        @media (max-width: 640px) {
          .ov-section { min-height: auto; padding: 84px 20px 56px; }
        }
      `}</style>

      {/* NAV DOTS */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[999] hidden md:flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            data-ov-dot
            onClick={() => goTo(i)}
            aria-label={`Go to section ${i + 1}`}
            className={`ov-dot ${i === 0 ? 'ov-dot-active' : ''}`}
          />
        ))}
      </div>

      {/* LOGO BAR */}
      <div className="fixed top-0 left-0 right-0 z-[998] px-[7vw] py-4 flex items-center justify-between bg-gradient-to-b from-[#1A1918f2] to-transparent">
        <Link href="/">
          <img src="/groundlense-logo.png" alt="Groundlense" className="h-12 md:h-16 w-auto block" />
        </Link>
        <div className="hidden sm:block font-mono text-[10px] text-[#F0997B] tracking-[0.2em] uppercase">
          Geotech Intelligence Platform
        </div>
      </div>

      {/* ═══ 01 · STORY ═══ */}
      <section id="s1" data-ov className="ov-section pt-[140px] bg-[#1A1918]">
        <div
          aria-hidden
          className="absolute font-display italic font-bold pointer-events-none text-[32vw] text-[rgba(216,90,48,0.03)] top-[48%] -right-[6vw] -translate-y-1/2 tracking-tighter"
        >
          trust.
        </div>
        <div className={secNumClass}>01 / 08</div>
        <div className={kickerClass}>A Monday morning, like every other</div>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-9">
          A boring is happening
          <br />
          somewhere <span className={hlClass}>right now.</span>
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-start">
          <div className="max-w-[620px]">
            <p className="text-base md:text-lg text-[#B4B2A9] leading-[1.78] max-w-[620px] mb-10 font-light">
              You are in your office. The rig is on a highway alignment 240 km away. Your geotech
              agency told you the work would start at 8 AM.
              <br />
              <br />
              Around <em className="text-[#FAC775] not-italic">11:30 AM</em>, a WhatsApp message
              comes in. A photo of the borehole. A few SPT numbers on a piece of paper. The
              supervisor says,{' '}
              <strong className="text-[#F5F3EE] font-semibold">
                &quot;All going as per plan, sir.&quot;
              </strong>
              <br />
              <br />
              You don&apos;t know <strong className="text-[#F5F3EE] font-semibold">which exact location</strong>{' '}
              they&apos;re at. You don&apos;t know <strong className="text-[#F5F3EE] font-semibold">which team</strong>{' '}
              is working. You don&apos;t know <strong className="text-[#F5F3EE] font-semibold">which intervals</strong>{' '}
              were tested. You don&apos;t know <strong className="text-[#F5F3EE] font-semibold">how deep</strong>{' '}
              they actually went.
              <br />
              <br />
              You trust. You wait. You will see the report — in three weeks.
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px] text-[#6B6966] tracking-[0.22em] uppercase">
              <span className="w-12 h-px bg-[#6B6966]"></span>
              This is where it starts going wrong
            </div>
          </div>

          {/* WHATSAPP MOCK */}
          <div className="w-full max-w-[440px] lg:justify-self-end">
            <div className="bg-[#0B141A] rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <div className="bg-[#1F2C33] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#993C1D] to-[#D85A30] flex items-center justify-center text-sm font-semibold text-white font-display">
                  RK
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] text-[#E9EDEF] font-medium">
                    Ramesh — Site Supervisor
                  </div>
                  <div className="text-[10.5px] text-[#8696A0] mt-px">online</div>
                </div>
              </div>
              <div className="p-4 bg-[#0B141A] max-h-[380px] overflow-y-auto">
                {[
                  { in: true, text: 'Good morning sir, reached site', ts: '8:14 AM' },
                  { in: true, photo: true, text: 'IMG-20251128-WA0014.jpg', ts: '8:42 AM' },
                  { in: false, text: 'OK. Update karte raho.', ts: '8:43 AM' },
                  { in: true, text: 'Sir, boring shuru ho gayi', ts: '9:51 AM' },
                  { in: true, photo: true, text: 'IMG-20251128-WA0021.jpg', ts: '11:33 AM' },
                  { in: true, text: 'SPT readings — 8, 12, 15, 18, 24\nDepth 7.5m tak ho gaya', ts: '11:34 AM' },
                  { in: false, text: 'Theek hai. Photo time stamp dikha raha hai?', ts: '11:35 AM' },
                  { in: true, text: 'Haan sir, sab record kar liya', ts: '11:36 AM' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] mb-2 rounded-lg text-[13px] leading-snug ${
                      m.in ? 'bg-[#1F2C33] text-[#E9EDEF]' : 'bg-[#005C4B] text-[#E9EDEF] ml-auto'
                    } ${m.photo ? 'p-1.5' : 'px-3 py-2'}`}
                  >
                    {m.photo && (
                      <div className="w-full h-[100px] bg-gradient-to-br from-[#3a3026] to-[#1a1410] rounded flex items-center justify-center text-[22px] mb-1 text-[#5a4a3a]">
                        📷
                      </div>
                    )}
                    <span className={m.photo ? 'text-[11px] text-[#8696A0] px-1' : 'whitespace-pre-line'}>
                      {m.text}
                    </span>
                    <span className="text-[10px] text-[#8696A0] block text-right mt-1">{m.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 02 · THE HIDDEN CHAIN ═══ */}
      <section id="s2" data-ov className="ov-section pt-[120px] bg-[#222120]">
        <div className={secNumClass}>02 / 08</div>
        <div className="max-w-[680px] mb-14">
          <div className={kickerClass}>The Hidden Chain</div>
          <h2 className={headlineClass}>
            Everything looks fine.
            <br />
            Everything is <span className={hlClass}>already broken.</span>
          </h2>
          <p className={subClass}>
            Between that WhatsApp photo and the final geotech report, seven things go wrong — and no
            one tells you.
          </p>
        </div>
        <div className="relative pl-12">
          <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#993C1D] via-[#D85A30] to-[#A32D2D]"></div>
          {CHAIN.map((item, i) => (
            <div key={i} className="ov-reveal relative mb-9">
              <div
                className={`absolute -left-[37px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#222120] ${
                  item.damage
                    ? 'bg-[#A32D2D] shadow-[0_0_0_2px_#5a1a1a]'
                    : 'bg-[#D85A30] shadow-[0_0_0_2px_#993C1D]'
                }`}
              ></div>
              <div
                className={`font-mono text-[10px] tracking-[0.2em] mb-1.5 ${
                  item.damage ? 'text-[#F09595]' : 'text-[#F0997B]'
                }`}
              >
                {item.step}
              </div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-[#F5F3EE] leading-tight mb-2.5">
                {item.title}
              </h3>
              <p className="text-sm text-[#B4B2A9] leading-[1.7] font-light max-w-[680px]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 03 · THE DAMAGE ═══ */}
      <section id="s3" data-ov className="ov-section pt-[140px] bg-[#1A1918]">
        <div className={secNumClass}>03 / 08</div>
        <div className="max-w-[780px] mb-4">
          <div className={kickerClass}>What it actually costs you</div>
          <h2 className={headlineClass}>
            One wrong assumption.
            <br />
            One <span className={hlClass}>very expensive</span> outcome.
          </h2>
        </div>
        <div className="font-display italic font-bold text-7xl md:text-8xl lg:text-[140px] leading-none text-[#F09595] mb-3.5 tracking-tighter">
          ₹2.4 Cr
        </div>
        <div className="text-sm text-[#B4B2A9] font-light leading-[1.65] mb-12 max-w-[560px]">
          <strong className="text-[#F5F3EE]">Average financial impact</strong> per major structure
          when geotech data is wrong — across either over-design or under-design. Felt across
          mobilization, materials, time, and reputation. This is what every contractor absorbs
          silently, every project.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              tag: 'OUTCOME A · OVER-SAFE DESIGN',
              h: "You designed for the worst case that wasn't real.",
              p: (
                <>
                  When the SPT data looks softer than it actually is, or the soil report is
                  conservative because no one trusts the field data — the structural engineer
                  compensates.{' '}
                  <strong className="text-[#F5F3EE] font-medium">
                    Pile depths go from 22m to 28m.
                  </strong>{' '}
                  Concrete grade is bumped up. Reinforcement is doubled. Foundation thickness
                  increases.
                </>
              ),
              cost: "Extra ₹40–80 lakh per major structure in unnecessary material and labour. Margin disappears. Your profit becomes someone else's caution.",
            },
            {
              tag: 'OUTCOME B · UNDER-SAFE DESIGN',
              h: "You designed for ground that wasn't there.",
              p: (
                <>
                  When the boring was at a different location, or the RL was wrong, or the SPT
                  values overstated the strength — the foundation is designed for soil that
                  doesn&apos;t exist below the actual structure.{' '}
                  <strong className="text-[#F5F3EE] font-medium">
                    Cracks appear. Settlement happens.
                  </strong>{' '}
                  The structure becomes unstable. Or worse.
                </>
              ),
              cost: 'Reconstruction, contractual penalties, blacklisting, reputation loss. ₹1–3 crore per incident. Years of trust gone. Future tenders harder to win.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="ov-reveal relative overflow-hidden p-8 rounded-xl bg-[#222120] border border-[rgba(163,45,45,.25)]"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A32D2D] to-transparent"></div>
              <div className="inline-block font-mono text-[9.5px] text-[#F09595] bg-[rgba(163,45,45,.12)] border border-[rgba(163,45,45,.25)] px-2.5 py-1 rounded tracking-[0.15em] mb-4">
                {card.tag}
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5F3EE] mb-3 leading-tight">
                {card.h}
              </h3>
              <p className="text-sm text-[#B4B2A9] leading-[1.7] font-light mb-4">{card.p}</p>
              <div className="px-4 py-3 bg-[rgba(163,45,45,.07)] border-l-[3px] border-[#A32D2D] rounded-r-md text-[13px] text-[#B4B2A9] leading-relaxed font-light">
                <strong className="text-[#F09595] font-semibold block text-[11px] tracking-[0.12em] uppercase mb-1 font-mono">
                  The cost
                </strong>
                {card.cost}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 04 · WHAT GROUNDLENSE CHANGES ═══ */}
      <section id="s4" data-ov className="ov-section pt-[120px] bg-[#222120]">
        <div className={secNumClass}>04 / 08</div>
        <div className={kickerClass}>What Groundlense Changes</div>
        <h2 className={headlineClass}>
          Remove the trust.
          <br />
          Replace it with <span className={hlClass}>proof.</span>
        </h2>
        <p className={subClass}>
          Every boring is captured digitally on site, verified in real time, and stored permanently
          — with no room for delay, manipulation, or assumption.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {SOLUTIONS.map((sol, i) => (
            <div
              key={i}
              className="ov-reveal bg-[#2A2826] rounded-xl p-7 border border-white/5 hover:border-[rgba(216,90,48,.3)] hover:-translate-y-1 transition-all"
            >
              <span className="text-3xl mb-4 block">{sol.icon}</span>
              <h3 className="font-display text-lg font-semibold text-[#F5F3EE] mb-2.5">
                {sol.title}
              </h3>
              <p className="text-[13.5px] text-[#B4B2A9] leading-[1.7] font-light">{sol.body}</p>
              <span
                className={`inline-block mt-4 text-[10px] px-2.5 py-1 rounded font-mono tracking-widest font-medium border ${sol.tagClass}`}
              >
                {sol.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 05 · INSIDE THE PLATFORM ═══ */}
      <section id="s5" data-ov className="ov-section pt-[120px] bg-[#1A1918]">
        <div className={secNumClass}>05 / 08</div>
        <div className={kickerClass}>Inside the Platform</div>
        <h2 className={headlineClass}>
          What you&apos;ll actually <span className={hlClass}>see.</span>
        </h2>
        <p className={subClass}>Four live views from the Groundlense contractor portal.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-9">
          {/* Live Monitor */}
          <div className="ov-reveal bg-[#222120] border border-[rgba(216,90,48,.22)] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#2A2826] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(216,90,48,.12)]">
              {dashBarDots}
              <span className="text-[11px] text-[#B4B2A9] font-mono ml-1">Live Monitor</span>
              <span className="ml-auto flex items-center gap-1.5 text-[9px] text-[#97C459] font-mono tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#97C459] animate-pulse"></span>LIVE
              </span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] text-[#FAC775] tracking-[0.12em] uppercase mb-3">
                Real-time boring status
              </div>
              {[
                { id: 'GL-BH-0047-A01', name: 'Bridge Foundation — Span 3', sub: 'Depth: 18.5m / 25m · Team A', stat: '● ACTIVE', statClass: 'bg-[rgba(59,109,17,.22)] text-[#97C459] border-[rgba(59,109,17,.3)]' },
                { id: 'GL-BH-0047-A02', name: 'Bridge Foundation — Span 4', sub: 'Depth: 0m / 22m · Team A', stat: '◌ PENDING', statClass: 'bg-[rgba(186,117,23,.18)] text-[#FAC775] border-[rgba(186,117,23,.3)]' },
                { id: 'GL-BH-0047-B01', name: 'Retaining Wall — Ch. 45+300', sub: 'Depth: 12m / 12m · Completed', stat: '✓ DONE', statClass: 'bg-[rgba(24,95,165,.2)] text-[#85B7EB] border-[rgba(24,95,165,.3)]' },
              ].map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center px-3 py-2.5 rounded-lg mb-2 bg-[#2A2826]">
                  <div>
                    <div className="font-mono text-[10.5px] text-[#FAC775] mb-0.5">{b.id}</div>
                    <div className="text-[13px] text-[#F5F3EE] font-medium">{b.name}</div>
                    <div className="text-[11px] text-[#B4B2A9] mt-0.5">{b.sub}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-[9.5px] font-mono px-2 py-1 rounded border ${b.statClass}`}>
                    {b.stat}
                  </div>
                </div>
              ))}
              <div className="text-xs text-[#B4B2A9] mt-3.5 text-center italic font-display">
                Every boring visible — as it happens.
              </div>
            </div>
          </div>

          {/* Location Verification */}
          <div className="ov-reveal bg-[#222120] border border-[rgba(216,90,48,.22)] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#2A2826] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(216,90,48,.12)]">
              {dashBarDots}
              <span className="text-[11px] text-[#B4B2A9] font-mono ml-1">Location Verification</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] text-[#FAC775] tracking-[0.12em] uppercase mb-3">
                Planned vs actual boring location
              </div>
              <div className="px-3 py-3 bg-[#2A2826] rounded-lg">
                <div className="relative h-[140px] bg-gradient-to-br from-[#232a1e] to-[#161d16] rounded border border-[rgba(59,109,17,.15)] overflow-hidden mb-2.5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  ></div>
                  <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#222120] bg-[#85B7EB] left-[38%] top-[42%]"></div>
                  <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#222120] bg-[#A32D2D] left-[58%] top-[55%]"></div>
                  <div className="absolute text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(24,95,165,.25)] text-[#85B7EB] border border-[rgba(24,95,165,.3)] left-[30%] top-[28%]">
                    PLANNED
                  </div>
                  <div className="absolute text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(163,45,45,.25)] text-[#F09595] border border-[rgba(163,45,45,.3)] left-[62%] top-[65%]">
                    ACTUAL
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-[#B4B2A9] font-mono">
                  <div>
                    Planned: <strong className="text-[#F5F3EE]">Ch. 24+580 · 6m offset</strong>
                  </div>
                  <div className="text-[#F09595]">
                    Actual deviation: <strong>15.2 m</strong>
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#B4B2A9] mt-3.5 text-center italic font-display">
                Catch location drift before design begins.
              </div>
            </div>
          </div>

          {/* Depth & RL Audit */}
          <div className="ov-reveal bg-[#222120] border border-[rgba(216,90,48,.22)] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#2A2826] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(216,90,48,.12)]">
              {dashBarDots}
              <span className="text-[11px] text-[#B4B2A9] font-mono ml-1">Depth &amp; RL Audit</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] text-[#FAC775] tracking-[0.12em] uppercase mb-3">
                Actual depth vs billed · RL auto-recalculated
              </div>
              <div className="px-3 py-3 bg-[#2A2826] rounded-lg mb-2.5">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-mono text-[10.5px] text-[#FAC775]">GL-BH-0047-B03</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[rgba(163,45,45,.2)] text-[#F09595] border border-[rgba(163,45,45,.3)]">
                    GAP FLAGGED
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#B4B2A9]">Billed depth</span>
                    <span className="font-mono text-[#F5F3EE] font-medium">25.0 m</span>
                  </div>
                  <div className="h-2 bg-[#3A3836] rounded overflow-hidden">
                    <div className="h-full rounded bg-gradient-to-r from-[#BA7517] to-[#FAC775] w-full"></div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#B4B2A9]">Actual depth (GPS verified)</span>
                    <span className="font-mono text-[#F5F3EE] font-medium">21.5 m</span>
                  </div>
                  <div className="h-2 bg-[#3A3836] rounded overflow-hidden">
                    <div className="h-full rounded bg-gradient-to-r from-[#3B6D11] to-[#97C459] w-[86%]"></div>
                  </div>
                </div>
              </div>
              <div className="px-3 py-3 bg-[#2A2826] rounded-lg">
                <div className="font-mono text-[10.5px] text-[#FAC775] mb-2">
                  RL recalculation — auto from GPS
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="bg-[#3A3836] px-2.5 py-2 rounded">
                    <div className="text-[9px] text-[#B4B2A9] tracking-wider uppercase mb-0.5">Planned RL</div>
                    <div className="text-[13px] text-[#F5F3EE] font-medium">284.3 m</div>
                  </div>
                  <div className="bg-[#3A3836] px-2.5 py-2 rounded">
                    <div className="text-[9px] text-[#B4B2A9] tracking-wider uppercase mb-0.5">Actual RL</div>
                    <div className="text-[13px] text-[#F5F3EE] font-medium">286.1 m</div>
                  </div>
                  <div className="bg-[rgba(163,45,45,.15)] px-2.5 py-2 rounded">
                    <div className="text-[9px] text-[#F09595] tracking-wider uppercase mb-0.5">Δ</div>
                    <div className="text-[13px] text-[#F09595] font-medium">+1.8 m</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#B4B2A9] mt-3.5 text-center italic font-display">
                No assumptions — only verified values.
              </div>
            </div>
          </div>

          {/* Sample Chain of Custody */}
          <div className="ov-reveal bg-[#222120] border border-[rgba(216,90,48,.22)] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#2A2826] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(216,90,48,.12)]">
              {dashBarDots}
              <span className="text-[11px] text-[#B4B2A9] font-mono ml-1">Sample Chain of Custody</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-[10px] text-[#FAC775] tracking-[0.12em] uppercase mb-3">
                Each sample uniquely tracked — boring → lab → result
              </div>
              {[
                { id: 'GL-SMP-0047-001', name: 'UDS · 4.5–5.0 m · BH-A01', sub: 'Dispatched 09:42 · Lab received 14:18', stat: '● IN LAB', statClass: 'bg-[rgba(59,109,17,.22)] text-[#97C459] border-[rgba(59,109,17,.3)]' },
                { id: 'GL-SMP-0047-002', name: 'SPT · 6.0–6.45 m · BH-A01', sub: 'Collected 11:33 · Awaiting dispatch', stat: '◌ ON SITE', statClass: 'bg-[rgba(186,117,23,.18)] text-[#FAC775] border-[rgba(186,117,23,.3)]' },
                { id: 'GL-SMP-0047-003', name: 'UDS · 7.5–8.0 m · BH-B01', sub: 'Lab tested · Result available', stat: '✓ DONE', statClass: 'bg-[rgba(24,95,165,.2)] text-[#85B7EB] border-[rgba(24,95,165,.3)]' },
              ].map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center px-3 py-2.5 rounded-lg mb-2 bg-[#2A2826]">
                  <div>
                    <div className="font-mono text-[10.5px] text-[#FAC775] mb-0.5">{b.id}</div>
                    <div className="text-[13px] text-[#F5F3EE] font-medium">{b.name}</div>
                    <div className="text-[11px] text-[#B4B2A9] mt-0.5">{b.sub}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-[9.5px] font-mono px-2 py-1 rounded border ${b.statClass}`}>
                    {b.stat}
                  </div>
                </div>
              ))}
              <div className="text-xs text-[#B4B2A9] mt-3.5 text-center italic font-display">
                Every sample traceable — no mixing, no guessing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 06 · COMPARISON ═══ */}
      <section id="s6" data-ov className="ov-section pt-[120px] bg-[#222120]">
        <div className={secNumClass}>06 / 08</div>
        <div className={kickerClass}>Manual Geotech vs Groundlense</div>
        <h2 className={headlineClass}>
          The same investigation.
          <br />A <span className={hlClass}>completely different</span> outcome.
        </h2>
        <div className="mt-10 rounded-xl overflow-hidden border border-white/5 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr]">
              <div className="px-5 py-4 font-mono text-[11px] tracking-[0.12em] uppercase font-medium bg-[#3A3836] text-[#B4B2A9]">
                Parameter
              </div>
              <div className="px-5 py-4 font-mono text-[11px] tracking-[0.12em] uppercase font-medium bg-[rgba(163,45,45,.15)] text-[#F09595] border-l border-white/5">
                Manual Geotech Agency
              </div>
              <div className="px-5 py-4 font-mono text-[11px] tracking-[0.12em] uppercase font-medium bg-[rgba(59,109,17,.18)] text-[#97C459] border-l border-white/5">
                Groundlense
              </div>
            </div>
            {CMP_ROWS.map((row, i) => (
              <div key={i} className="ov-reveal grid grid-cols-[1.4fr_1fr_1fr]">
                <div className="px-5 py-3.5 text-[13px] leading-relaxed border-t border-white/5 flex items-center bg-[#2A2826] text-[#F5F3EE] font-medium">
                  {row.param}
                </div>
                <div className="px-5 py-3.5 text-[13px] leading-relaxed border-t border-l border-white/5 flex items-center bg-[rgba(163,45,45,.06)] text-[#B4B2A9] font-light">
                  <span className="text-[#A32D2D] mr-2 font-semibold">✕</span>
                  {row.manual}
                </div>
                <div className="px-5 py-3.5 text-[13px] leading-relaxed border-t border-l border-white/5 flex items-center bg-[rgba(59,109,17,.06)] text-[#F5F3EE]">
                  <span className="text-[#97C459] mr-2 font-semibold">✓</span>
                  <span>
                    <strong className="text-[#97C459] font-semibold">{row.glStrong}</strong>
                    {row.glRest}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 07 · PRICING ═══ */}
      <section id="s7" data-ov className="ov-section pt-[120px] bg-[#1A1918]">
        <div className={secNumClass}>07 / 08</div>
        <div className={kickerClass}>Pricing</div>
        <h2 className={headlineClass}>
          The data is priceless.
          <br />
          The <span className={hlClass}>first year</span> is not.
        </h2>
        <p className={subClass}>
          A limited pre-launch rate for projects committed in the first year. Locked in for the
          entire project duration.
        </p>

        <div className="mt-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#993C1D] to-[#D85A30] relative px-5 py-10 md:px-10 md:py-12 text-center">
          <div
            aria-hidden
            className="absolute font-display italic font-bold text-[14vw] text-white/[.04] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none tracking-tighter"
          >
            GROUNDLENSE
          </div>
          <div className="relative z-10">
            <div className="font-mono text-[11px] text-[#FAC775] tracking-[0.25em] uppercase mb-6">
              Pre-Launch Offer · Limited to Year 1 Bookings
            </div>
            <div className="flex items-end justify-center gap-9 flex-wrap mb-6">
              <div className="text-center">
                <div className="font-mono text-[10px] text-white/55 tracking-[0.18em] uppercase mb-1.5">
                  Regular Price
                </div>
                <div className="font-display text-4xl md:text-5xl font-semibold text-white/50 relative inline-block tracking-tight">
                  ₹15,000
                  <span className="absolute -left-[8%] -right-[8%] top-[48%] h-[3px] bg-[#A32D2D] -rotate-[8deg] rounded"></span>
                </div>
              </div>
              <div className="font-display text-4xl text-white/65 font-light self-center mb-4">→</div>
              <div className="text-center">
                <div className="font-mono text-[11px] text-[#FAC775] tracking-[0.18em] uppercase mb-1.5 font-semibold">
                  Pre-Launch Price
                </div>
                <div className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-[#F5F3EE] leading-none tracking-tight">
                  ₹10,000
                  <span className="text-[0.55em] text-white/70 font-normal italic"> / boring</span>
                </div>
              </div>
            </div>
            <div className="inline-block bg-white/10 border border-white/20 px-4.5 py-2.5 rounded-full text-[12.5px] text-[#F5F3EE] font-medium backdrop-blur-md">
              Book your <strong className="text-[#FAC775] font-bold">next upcoming project</strong>{' '}
              and lock the ₹10,000 rate
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-11">
          {[
            { icon: '📅', title: 'Year-1 Lock-In', body: "Projects committed in the pre-launch year get the ₹10,000 rate for the project's full duration — no escalation." },
            { icon: '🗄️', title: 'Permanent Storage', body: 'Every boring you collect stays in your Groundlense vault — retrievable for future projects on the same alignment.' },
            { icon: '📄', title: 'Full Certification', body: 'Certified IS 1892 PDF, tamper certificate, NABL lab linkage, location and depth verification — all included.' },
          ].map((item, i) => (
            <div key={i} className="px-5 py-6 bg-[#222120] border border-white/5 rounded-xl text-center">
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="font-display text-base text-[#F5F3EE] font-semibold mb-1.5">{item.title}</div>
              <div className="text-[13px] text-[#B4B2A9] leading-relaxed font-light">{item.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-base text-[#B4B2A9] font-light leading-[1.7]">
          Against a <strong className="text-[#F5F3EE] font-semibold">₹2.4 Cr</strong> exposure from
          one wrong design assumption — the entire investigation cost becomes{' '}
          <em className="text-[#F0997B] font-medium">negligible.</em>
        </div>
      </section>

      {/* ═══ 08 · CTA ═══ */}
      <section id="s8" data-ov className="ov-section pt-[120px] bg-[#1A1918]">
        <div className={secNumClass}>08 / 08</div>
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.08] tracking-tight mb-6">
            When does your next
            <br />
            boring project <span className={hlClass}>begin?</span>
          </h2>
          <p className="text-base md:text-lg text-[#B4B2A9] leading-[1.7] mb-12 font-light">
            If a boring is executed today without Groundlense, every failure in the chain is already
            happening —<br />
            and you&apos;ll only find out{' '}
            <strong className="text-[#F5F3EE] font-semibold">when the design is wrong.</strong>
            <br />
            <br />
            Pre-launch enrolment is open for early projects.
            <br />
            <strong className="text-[#F5F3EE] font-semibold">Setup takes 10 minutes.</strong>
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/contact"
              className="bg-[#D85A30] text-white border-none px-10 py-4 rounded-md text-base font-semibold cursor-pointer tracking-wide transition-all hover:bg-[#993C1D] hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(216,90,48,.4)]"
            >
              Reserve a Pre-Launch Slot →
            </Link>
            <Link
              href="/"
              className="bg-transparent text-[#F5F3EE] border border-white/20 px-10 py-4 rounded-md text-base font-medium cursor-pointer tracking-wide transition-all hover:border-[#D85A30] hover:text-[#F0997B]"
            >
              Back to Website
            </Link>
          </div>
          <div className="mt-8 text-xs text-[#6B6966] font-mono tracking-[0.12em]">
            No commitment · No card required · One conversation
          </div>
        </div>
      </section>
    </div>
  );
}
