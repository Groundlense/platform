/* Matches .lp-left: flex:1, padding 48px 56px, flex column, justify-between, border-right, bg-surface */
export default function LoginLeftPanel() {
  return (
    <div className="flex-1 flex flex-col justify-between border-r border-border bg-bg-surface" style={{ padding: "48px 56px" }}>
      {/* Logo row */}
      <div className="flex items-center gap-2">
        <span className="font-display text-[22px] text-rust-d tracking-[0.3px]">GroundLense</span>
        <span className="text-[9px] font-mono tracking-[0.5px]" style={{ background: "rgba(153,60,29,.2)", color: "var(--color-rust-d)", padding: "2px 7px", borderRadius: "3px", border: "0.5px solid rgba(153,60,29,.3)" }}>v1.0 · BETA</span>
      </div>

      {/* Main Content */}
      <div>
        {/* Eyebrow — matches .lp-eyebrow */}
        <div className="font-mono text-[10px] text-amber-d tracking-[2px] uppercase mb-[18px] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-amber-d" />
          Geotech field intelligence
        </div>

        {/* Heading — matches .lp-h1 */}
        <h1 className="font-display text-[44px] font-bold leading-[1.1] mb-[18px]" style={{ letterSpacing: "-0.5px" }}>
          Every boring.<br />
          <em className="not-italic text-rust-d">Verified.</em><br />
          Instant.
        </h1>

        {/* Subtitle — matches .lp-sub */}
        <p className="text-[14px] text-text-sec leading-[1.7] max-w-[400px] mb-8">
          India&apos;s first geotech boring management platform. IS 1892 compliant reports generated automatically. Field data captured at source — GPS stamped, IS code tagged, audit-ready.
        </p>

        {/* Stats — matches .stat-row: grid 3 cols, gap 1px, bg-border, border, rounded, overflow hidden */}
        <div className="grid grid-cols-3 overflow-hidden rounded-lg mb-7" style={{ gap: "1px", background: "var(--color-border)", border: "1px solid var(--color-border)" }}>
          {[
            { num: "IS 1892", lbl: "Auto-compliant" },
            { num: "SHA-256", lbl: "Tamper-evident" },
            { num: "₹5K", lbl: "Per boring" },
          ].map((s) => (
            <div key={s.num} className="bg-bg-card" style={{ padding: "14px 18px" }}>
              <div className="font-display text-[22px] text-rust-d mb-[2px]">{s.num}</div>
              <div className="text-[10px] text-text-ter">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Flow Strip — matches .flow-strip */}
        <div className="flex items-center bg-bg-card border border-border rounded-lg mb-6" style={{ padding: "16px" }}>
          <FlowNode emoji="⛏️" label="GT Crew" sub="Field capture" bgColor="rgba(59,109,17,.12)" borderColor="rgba(59,109,17,.2)" />
          <span className="text-[12px] text-text-ter px-[3px]">→</span>
          <FlowNode emoji="🔬" label="Engineer" sub="QC review" bgColor="rgba(96,165,250,.1)" borderColor="rgba(96,165,250,.2)" />
          <span className="text-[12px] text-text-ter px-[3px]">→</span>
          <FlowNode emoji="🏗️" label="Contractor" sub="Live monitor" bgColor="rgba(186,117,23,.1)" borderColor="rgba(186,117,23,.2)" />
          <span className="text-[12px] text-text-ter px-[3px]">→</span>
          <FlowNode emoji="🏛️" label="NHAI / IE" sub="Verified PDF" bgColor="rgba(163,45,45,.1)" borderColor="rgba(163,45,45,.2)" />
        </div>

        {/* Trust strip — matches .trust-strip */}
        <div className="flex flex-wrap gap-[6px] mt-[18px]">
          {["IS 2131 · IS 1892 · IS 2720", "Offline-first Android", "Hindi UI", "NABL integration"].map((t) => (
            <span key={t} className="font-mono text-[9px] text-text-ter border border-border rounded-full tracking-[0.4px]" style={{ padding: "3px 9px" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Footer — matches .lp-footer */}
      <div className="font-mono text-[9px] text-text-ter flex gap-[14px]">
        <span>© 2025 Groundlense Technologies Pvt Ltd</span>
        <span>groundlense.com</span>
      </div>
    </div>
  );
}

/* Flow node — matches .fn: flex:1, text-center */
function FlowNode({ emoji, label, sub, bgColor, borderColor }: { emoji: string; label: string; sub: string; bgColor: string; borderColor: string }) {
  return (
    <div className="flex-1 text-center">
      <div
        className="w-8 h-8 rounded-[7px] mx-auto mb-[6px] flex items-center justify-center text-[14px]"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      >
        {emoji}
      </div>
      <div className="text-[9px] text-text-sec uppercase tracking-[0.5px] font-medium">{label}</div>
      <div className="text-[8px] text-text-ter mt-[1px]">{sub}</div>
    </div>
  );
}
