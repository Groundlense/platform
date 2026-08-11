import type { Metadata } from "next";
import Link from "next/link";
import { FaShieldAlt, FaMapMarkerAlt, FaCamera, FaUserLock, FaEnvelope, FaChevronLeft } from "react-icons/fa";

export const metadata: Metadata = {
  title: "GroundLense — Privacy Policy",
  description: "Privacy Policy and Data Safety details for GroundLense geotechnical boring platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-pri selection:bg-rust-mid/30 selection:text-rust-d flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-border bg-bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-text-sec hover:text-text-pri transition-colors font-mono text-[11px] uppercase tracking-wider">
            <FaChevronLeft className="text-[10px]" />
            <span>Back to Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-display text-[18px] text-rust-d tracking-[0.3px]">GroundLense</span>
            <span className="text-[8px] font-mono tracking-[0.5px] bg-rust/20 text-rust-d px-1.5 py-0.5 rounded border border-rust-mid/30">
              POLICY
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-12">
        <div className="animate-fade-up">
          
          {/* Eyebrow & Title */}
          <div className="font-mono text-[10px] text-amber-d tracking-[2px] uppercase mb-4 flex items-center gap-2">
            <span className="w-5 h-[1px] bg-amber-d" />
            Compliance & Transparency
          </div>
          <h1 className="font-display text-[44px] font-bold leading-tight mb-4 text-text-pri">
            Privacy Policy
          </h1>
          <p className="text-[11px] font-mono text-text-ter uppercase tracking-wider mb-8">
            Last Updated: August 10, 2026
          </p>

          <div className="prose prose-invert max-w-none text-text-sec text-[14px] leading-relaxed space-y-8">
            
            <p>
              At <strong>GroundLense</strong> (referred to as &quot;GroundLense&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we are committed to protecting your privacy and ensuring the security of your geotechnical data. This Privacy Policy details how we collect, use, and process your personal and field telemetry data when you use the GroundLense web platform and the React Native mobile application.
            </p>

            <hr className="border-border" />

            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="font-display text-[22px] text-rust-d font-bold flex items-center gap-3">
                <FaUserLock className="text-[16px] text-rust-mid" />
                1. Information We Collect
              </h2>
              <p>
                To provide core platform features, GroundLense collects information directly from your inputs and device sensors during field operations:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-text-sec">
                <li>
                  <strong>Account Registration Info:</strong> Full name, professional email address, phone number, and organization name when your workspace is registered.
                </li>
                <li>
                  <strong>Geotechnical Field Logs:</strong> Borehole elevations, SPT N-values, water table levels, rock coring metrics, and soil classifications entered by site engineers and soil technicians.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="font-display text-[22px] text-rust-d font-bold flex items-center gap-3">
                <FaMapMarkerAlt className="text-[16px] text-amber" />
                2. Location Data &amp; Purpose
              </h2>
              <p>
                GroundLense is designed to automate and verify <strong>IS 1892 compliant reporting</strong>. As part of this audit-trail capability:
              </p>
              <div className="bg-bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-mono text-amber-d">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                  GPS TIMESTAMPED AUDITING
                </div>
                <p className="text-[13px] text-text-sec leading-relaxed">
                  We request access to your device&apos;s <strong>Precise and Approximate Location</strong>. This coordinates logging allows the app to attach latitude, longitude, and elevation timestamps directly to your geotechnical borehole logs at the exact physical location where the test is run. This prevents site tampering and ensures government-level audit compliance.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="font-display text-[22px] text-rust-d font-bold flex items-center gap-3">
                <FaCamera className="text-[16px] text-b-dark" />
                3. Camera &amp; Storage Permissions
              </h2>
              <p>
                Our mobile application utilizes your device camera and gallery access to support visual report compilations:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-text-sec">
                <li>
                  <strong>Sample Photographic Evidence:</strong> Snapping and attaching photos of core boxes, rock cores, soil sample tubes, and rig setups directly to the boring log.
                </li>
                <li>
                  <strong>Local Storage (Caching):</strong> Offline-first support requires caching log inputs locally on the device (via AsyncStorage) until network connectivity is re-established.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="font-display text-[22px] text-rust-d font-bold flex items-center gap-3">
                <FaShieldAlt className="text-[16px] text-g-mid" />
                4. Data Transmission &amp; Security
              </h2>
              <p>
                Your field data is highly confidential. We secure it via standard enterprise protocols:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-text-sec">
                <li>
                  <strong>Encryption in Transit:</strong> All data is synchronized between the mobile app and our REST API using transport layer security (HTTPS).
                </li>
                <li>
                  <strong>Access Isolation:</strong> Log datasets are isolated to your registered organization/contractor workspace and are accessible only to verified project supervisors.
                </li>
                <li>
                  <strong>Third Parties:</strong> We do not sell, rent, or share personal or geotechnical data with third-party advertising companies.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="font-display text-[22px] text-rust-d font-bold flex items-center gap-3">
                <FaEnvelope className="text-[16px] text-rust-mid" />
                5. User Rights &amp; Data Deletion
              </h2>
              <p>
                As a user, you maintain full control over your telemetry profile. You have the right to request deletion of your account and associated geotechnical log data.
              </p>
              <div className="bg-bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="text-[13px] text-text-sec leading-relaxed">
                  To delete your account, use our account deletion page — it lists exactly what is erased, what is retained for statutory audit, and how long it takes. No sign-in required.
                </div>
                <Link
                  href="/delete-account"
                  className="inline-block text-rust-d hover:underline font-mono text-[13px]"
                >
                  → Request account &amp; data deletion
                </Link>
              </div>
              <p>
                For policy inquiries, email our support desk at{" "}
                <a href="mailto:info@groundlense.com" className="text-rust-d hover:underline font-mono">
                  info@groundlense.com
                </a>
                .
              </p>
            </section>

          </div>

          <hr className="border-border my-12" />

          {/* Footer */}
          <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 text-text-ter font-mono text-[10px]">
            <span>© {new Date().getFullYear()} Groundlense Technologies Pvt Ltd. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-text-sec transition-colors">Login</Link>
              <span>·</span>
              <Link href="/delete-account" className="hover:text-text-sec transition-colors">Delete Account</Link>
              <span>·</span>
              <a href="https://groundlense.com" className="hover:text-text-sec transition-colors">Website</a>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
