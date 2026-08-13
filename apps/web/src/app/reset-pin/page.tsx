import type { Metadata } from 'next';
import Link from 'next/link';
import ResetPinForm from './ResetPinForm';

export const metadata: Metadata = {
  title: 'GroundLense — Reset your PIN',
  description:
    'Set a new PIN for your GroundLense Worker account using the reset link sent to you on WhatsApp.',
};

export default async function ResetPinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="bg-[#1A1918] min-h-screen">
      <nav className="sticky top-0 z-50 bg-[#1A1918]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-4">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/groundlense-logo-wide.png" alt="Groundlense" className="h-9 sm:h-12 w-auto" />
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
        <div className="max-w-[560px] mx-auto">
          <div className="mb-10">
            <div className="font-mono text-xs tracking-widest text-[#D85A30] mb-4 uppercase">
              PIN reset &nbsp;·&nbsp; पिन रीसेट
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-tight font-semibold tracking-tight text-[#F5F3EE] mb-4">
              Set a new PIN for your worker account.
            </h1>
            <p className="text-base text-[#B4B2A9] font-light leading-relaxed">
              You opened this page from a reset link sent to you on WhatsApp. Enter the
              mobile number your GroundLense account is registered with, choose a new
              PIN, and log in to the app again.
              <span className="block mt-2 text-sm">
                WhatsApp पर मिले लिंक से आप यहाँ आए हैं। अपना रजिस्टर्ड मोबाइल नंबर और
                नया पिन डालें, फिर ऐप में लॉगिन करें।
              </span>
            </p>
          </div>

          <ResetPinForm token={token ?? ''} />

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
