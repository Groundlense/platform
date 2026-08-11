import type { Metadata } from 'next';
import Link from 'next/link';
import DeleteAccountForm from './DeleteAccountForm';

export const metadata: Metadata = {
  title: 'GroundLense — Delete your account and data',
  description:
    'Request deletion of your GroundLense account and the personal data associated with it. Covers the GroundLense web platform and the GroundLense Worker mobile app.',
};

const deleted = [
  'Your profile — name, employee code, email address, mobile number and login credentials.',
  'Your GroundLense password / PIN and every active session and refresh token.',
  'GPS coordinates and location timestamps recorded by the app against your user account.',
  'Your membership of every organization and project crew on the platform.',
  'Photo attributions — your name is removed from any core box, sample or rig photos you uploaded.',
  'Locally cached field data, cleared from your device the moment you uninstall the app.',
];

const retained = [
  {
    what: 'Geotechnical borehole logs, SPT records and lab results',
    why: 'These are the deliverable of a client investigation and belong to the organization that commissioned the work. They stay on the project record but are unlinked from your personal profile.',
  },
  {
    what: 'Statutory and audit records',
    why: 'Where Indian law or a client contract requires an investigation record to be preserved, the record is kept for the mandated period and then deleted.',
  },
];

export default function DeleteAccountPage() {
  return (
    <div className="bg-[#1A1918] min-h-screen">
      {/* ================= NAV ================= */}
      <nav className="sticky top-0 z-50 bg-[#1A1918]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-4">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/groundlense-logo.png" alt="Groundlense" className="h-12 sm:h-16 w-auto" />
          </Link>
          <Link
            href="/contact"
            className="font-sans text-xs font-semibold text-[#B4B2A9] hover:text-[#97C459] px-2 py-2.5 whitespace-nowrap transition"
          >
            Contact us
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1918] via-[#222120] to-[#1A1918] px-5 sm:px-6 py-12 md:py-20">
        <div className="max-w-[1160px] mx-auto">
          {/* ================= HEADER ================= */}
          <div className="max-w-[720px] mb-14">
            <div className="font-mono text-xs tracking-widest text-[#D85A30] mb-4 uppercase">
              Account &amp; data deletion
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight font-semibold tracking-tight text-[#F5F3EE] mb-4">
              Delete your GroundLense account.
            </h1>
            <p className="text-base text-[#B4B2A9] font-light leading-relaxed">
              This page lets you request permanent deletion of your account and the personal
              data associated with it — for both the GroundLense web platform and the
              GroundLense Worker Android app (<span className="font-mono text-sm">com.groundlense.worker</span>),
              published by Groundlense Technologies Private Limited. You do not need to sign
              in, and you do not need a web account — field workers who only ever use the
              app can request deletion here too.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-start">
            {/* ================= FORM ================= */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-3.5">
                  Submit a request
                </div>
                <DeleteAccountForm />
              </div>

              {/* HOW IT WORKS */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-4">
                  How the request is handled
                </div>
                <ol className="flex flex-col gap-3.5 text-sm text-[#B4B2A9] leading-relaxed">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[rgba(216,90,48,0.16)] text-[#D85A30] font-mono text-xs flex items-center justify-center">
                      1
                    </span>
                    <span>
                      We acknowledge your request by email, usually within{' '}
                      <strong className="text-[#F5F3EE]">2 working days</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[rgba(216,90,48,0.16)] text-[#D85A30] font-mono text-xs flex items-center justify-center">
                      2
                    </span>
                    <span>
                      We verify that the request comes from the account owner — we may call or
                      message the registered mobile number to confirm.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[rgba(216,90,48,0.16)] text-[#D85A30] font-mono text-xs flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Your account is deleted and we confirm completion by email within{' '}
                      <strong className="text-[#F5F3EE]">30 days</strong> of verification.
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* ================= WHAT IS DELETED / RETAINED ================= */}
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-b from-[rgba(216,90,48,0.08)] to-white/2 border border-[rgba(216,90,48,0.22)] rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#D85A30] mb-4">
                  What gets deleted
                </div>
                <ul className="flex flex-col gap-3 text-sm text-[#B4B2A9] leading-relaxed">
                  {deleted.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="text-[#97C459] flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-4">
                  What we keep, and why
                </div>
                <ul className="flex flex-col gap-4 text-sm text-[#B4B2A9] leading-relaxed">
                  {retained.map((item) => (
                    <li key={item.what}>
                      <div className="text-[#F5F3EE] mb-1">{item.what}</div>
                      <div className="text-[13px]">{item.why}</div>
                    </li>
                  ))}
                </ul>
                <p className="text-[13px] text-[#6B6966] leading-relaxed mt-4 pt-4 border-t border-white/10">
                  Retained records carry no personal identifiers of yours once your account is
                  deleted, and we never sell or share them with advertisers. See our{' '}
                  <Link href="/privacy" className="text-[#B4B2A9] hover:text-[#97C459] transition">
                    Privacy Policy
                  </Link>{' '}
                  for full detail.
                </p>
              </div>

              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="font-mono text-[10.5px] tracking-widest uppercase text-[#6B6966] mb-3.5">
                  Need help instead?
                </div>
                <div className="text-sm text-[#B4B2A9] leading-relaxed mb-3.5">
                  If you only want to leave one organization or stop receiving notifications, you
                  don&apos;t need to delete your account — talk to us first.
                </div>
                <div className="flex flex-col gap-2.5">
                  <a
                    href="mailto:info@groundlense.com"
                    className="text-sm text-[#F5F3EE] hover:text-[#97C459] transition"
                  >
                    ✉ info@groundlense.com
                  </a>
                  <a
                    href="tel:+919218107330"
                    className="text-sm text-[#F5F3EE] hover:text-[#97C459] transition"
                  >
                    ☎ +91 92181 07330
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center text-xs text-[#6B6966]">
            <span>© 2026 Groundlense Technologies Private Limited. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-[#B4B2A9] transition">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-[#B4B2A9] transition">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
