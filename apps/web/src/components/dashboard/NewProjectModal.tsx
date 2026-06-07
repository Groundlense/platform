"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

/* Matches .modal-overlay + .modal: 500px wide, rounded-xl, max-h 85vh */
export default function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const [step, setStep] = useState(1);
  const [bhCount, setBhCount] = useState(3);

  if (!open) return null;

  const sub = bhCount * 5000;
  const gst = Math.round(sub * 0.18);
  const total = sub + gst;

  const STEP_LABELS = ["Project details", "Boring setup", "Link parties", "Payment"];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bg-surface border border-border-mid rounded-xl flex flex-col" style={{ width: "500px", maxHeight: "85vh" }}>

        {/* Header — matches .modal-hdr: padding 16px 20px, sticky top */}
        <div className="flex items-center justify-between shrink-0 sticky top-0 z-[1] bg-bg-surface" style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <div className="font-display text-[18px] text-text-pri">New project</div>
          <button onClick={onClose} className="text-[20px] text-text-ter cursor-pointer hover:text-rust-d transition-colors bg-transparent border-none p-0 leading-none">✕</button>
        </div>

        {/* Steps — matches .modal-steps: flex, border-bottom */}
        <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              className={`flex-1 text-center text-[10px] font-medium cursor-default
                ${i + 1 === step
                  ? "text-rust-d"
                  : i + 1 < step
                    ? "text-green-d bg-bg-card"
                    : "text-text-ter bg-bg-card"}`}
              style={{
                padding: "8px",
                borderRight: i < 3 ? "1px solid var(--color-border)" : "none",
                borderBottom: i + 1 === step ? "2px solid var(--color-rust-mid)" : "none",
                background: i + 1 === step ? "rgba(153,60,29,.1)" : undefined,
              }}
            >
              {i + 1 < step ? "✓ " : `${i + 1}. `}{label}
            </div>
          ))}
        </div>

        {/* Body — matches .modal-body: padding 18px 20px, overflow-y auto */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "18px 20px" }}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 bhCount={bhCount} setBhCount={setBhCount} />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 bhCount={bhCount} total={total} sub={sub} gst={gst} onPay={() => { onClose(); }} onPayLater={() => { onClose(); }} />}
        </div>

        {/* Footer — matches .modal-ftr: padding 12px 20px, sticky bottom */}
        <div className="flex gap-2 shrink-0 sticky bottom-0 bg-bg-surface" style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="bg-transparent border border-border-mid rounded-[7px] text-[12px] text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all" style={{ padding: "10px 16px" }}>← Back</button>
          ) : <div />}
          {step < 4 && (
            <button onClick={() => setStep(step + 1)} className="flex-1 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors" style={{ padding: "10px" }}>
              {step === 1 ? "Next — Boring setup →" : step === 2 ? "Next — Link parties →" : "Next — Payment →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Form field — matches .fg + .fl + .fi from HTML */
function ModalField({ label, placeholder, type = "text", mono = false }: { label: string; placeholder: string; type?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.4px]">{label}</label>
      <input
        className={`bg-bg-raised border border-border-mid rounded-[5px] text-[11px] text-text-pri outline-none transition-colors focus:border-rust-mid placeholder:text-text-ter ${mono ? "font-mono text-amber-d" : ""}`}
        style={{ padding: "7px 9px" }}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}

function ModalSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.4px]">{label}</label>
      <select className="bg-bg-raised border border-border-mid rounded-[5px] text-[11px] text-text-pri outline-none focus:border-rust-mid cursor-pointer" style={{ padding: "7px 9px" }}>
        {options.map((o) => (<option key={o}>{o}</option>))}
      </select>
    </div>
  );
}

/* Step 1 — Project details */
function Step1() {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Project details</div>
      <ModalField label="Project name" placeholder="NH-48 Delhi–Vadodara · Package 14" />
      <div className="grid grid-cols-2 gap-[10px]">
        <ModalSelect label="Project type" options={["EPC", "HAM", "BOT", "Annuity"]} />
        <ModalField label="Client / authority" placeholder="NHAI" />
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <ModalSelect label="State" options={["Rajasthan", "Goa", "Maharashtra", "Gujarat", "Bihar", "Karnataka"]} />
        <ModalField label="District" placeholder="e.g. Barmer" />
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <ModalField label="Chainage from" placeholder="142+500" mono />
        <ModalField label="Chainage to" placeholder="145+200" mono />
      </div>
      <ModalField label="Target completion date" placeholder="2025-06-30" type="date" />
    </div>
  );
}

/* Step 2 — Boring setup */
function Step2({ bhCount, setBhCount }: { bhCount: number; setBhCount: (n: number) => void }) {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Boring setup</div>

      <div className="bg-bg-card border border-border rounded-lg mb-3" style={{ padding: "14px" }}>
        <div className="text-[10px] text-text-sec uppercase tracking-wider mb-2">Number of borings</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setBhCount(Math.max(1, bhCount - 1))} className="w-8 h-8 rounded-[7px] bg-bg-raised border border-border text-text-pri text-[16px] cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all">−</button>
          <span className="font-display text-[28px] font-semibold text-text-pri min-w-[40px] text-center">{bhCount}</span>
          <button onClick={() => setBhCount(bhCount + 1)} className="w-8 h-8 rounded-[7px] bg-bg-raised border border-border text-text-pri text-[16px] cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all">+</button>
          <span className="text-[11px] text-text-ter ml-2">@ {formatCurrency(5000)} each = <span className="text-amber-d font-medium">{formatCurrency(bhCount * 5000)}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        <ModalField label="Planned depth (m)" placeholder="20.0" />
        <ModalSelect label="Boring method" options={["Wash boring (IS 1892)", "Rotary drilling", "Percussion drilling", "Auger boring"]} />
      </div>
      <ModalSelect label="Hammer type" options={["Standard (63.5 kg, 750mm drop — IS 2131)", "Non-standard — specify weight + drop"]} />
      <ModalSelect label="NABL lab" options={["Geocon Labs · CC-1847 · Valid Dec 2026", "Central Soil Lab · CC-2201 · Valid Mar 2027", "Other lab"]} />
    </div>
  );
}

/* Step 3 — Link parties */
function Step3() {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Link parties</div>
      <div className="info-banner info-banner-blue mb-3">
        <span>ℹ</span> Share your Project ID with IE firms and GT contractors. They search and send join requests.
      </div>

      <div className="text-[10px] text-text-sec uppercase tracking-wider mb-2">Pending approval requests</div>
      {[
        { name: "STUP Consultants Pvt Ltd", code: "GL-ENG-7734", role: "IE Firm" },
        { name: "Apensia Consultancy LLP", code: "GL-GTC-3391", role: "Geotech Contractor" },
      ].map((req) => (
        <div key={req.code} className="flex items-center justify-between bg-bg-card border border-border rounded-[7px] mb-[6px]" style={{ padding: "9px 12px" }}>
          <div>
            <div className="text-[11px] font-medium text-text-pri">{req.name}</div>
            <div className="font-mono text-[9px] text-text-ter mt-[2px]">{req.code} · Requesting as: {req.role}</div>
          </div>
          <div className="flex gap-[5px]">
            <button className="btn btn-sm btn-success">✓ Approve</button>
            <button className="btn btn-sm btn-danger">✗ Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Step 4 — Payment */
function Step4({ bhCount, total, sub, gst, onPay, onPayLater }: { bhCount: number; total: number; sub: number; gst: number; onPay: () => void; onPayLater: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Payment</div>

      {/* Total box — matches .pay-total-box */}
      <div className="rounded-lg text-center mb-[14px]" style={{ background: "rgba(153,60,29,.08)", border: "1px solid rgba(153,60,29,.25)", padding: "16px 20px" }}>
        <div className="text-[10px] text-text-ter uppercase tracking-[0.5px] mb-[6px]">Total amount for this project</div>
        <div className="font-display text-[32px] text-rust-d">{formatCurrency(total)}</div>
        <div className="text-[10px] text-text-ter mt-[6px] leading-relaxed">
          {bhCount} borings × ₹5,000 = {formatCurrency(sub)} + GST 18% ({formatCurrency(gst)})
          <br />GST invoice auto-generated on payment
        </div>
      </div>

      {/* Payment summary — matches .pay-summary */}
      <div className="bg-bg-card border border-border rounded-lg mb-[14px]" style={{ padding: "14px" }}>
        <div className="flex justify-between text-[12px] text-text-sec border-b border-border" style={{ padding: "5px 0" }}>
          <span>Borings ({bhCount}x)</span><span className="font-mono">{formatCurrency(sub)}</span>
        </div>
        <div className="flex justify-between text-[12px] text-text-sec border-b border-border" style={{ padding: "5px 0" }}>
          <span>GST (18%)</span><span className="font-mono">{formatCurrency(gst)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-text-pri font-medium" style={{ padding: "9px 0 0" }}>
          <span>Total</span><span className="font-mono text-rust-d">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="info-banner info-banner-amber mb-[14px]">
        <span>🔒</span> Live boring data, field photos, GPS location and SPT entries visible after payment. You can create the project now and pay when ready.
      </div>

      <div className="text-[10px] font-medium text-text-ter uppercase tracking-wider mb-2">Payment method</div>
      <PaymentMethods />

      <div className="text-center text-[10px] text-text-ter mb-3 mt-3 flex items-center justify-center gap-[5px]">
        🔒 Razorpay · PCI DSS · GST invoice auto-generated
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onPay} className="bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors" style={{ padding: "10px" }}>
          Pay {formatCurrency(total)}
        </button>
        <button onClick={onPayLater} className="bg-transparent border border-border-mid rounded-[7px] text-[12px] text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all" style={{ padding: "10px" }}>
          Save · Pay later
        </button>
      </div>
    </div>
  );
}

function PaymentMethods() {
  const [selected, setSelected] = useState("upi");
  const methods = [
    { key: "upi", emoji: "📱", name: "UPI" },
    { key: "card", emoji: "💳", name: "Card" },
    { key: "netbanking", emoji: "🏦", name: "Net banking" },
  ];
  return (
    /* Matches .pay-methods: grid 3 cols, gap 7px */
    <div className="grid grid-cols-3 gap-[7px]">
      {methods.map((m) => (
        <div
          key={m.key}
          onClick={() => setSelected(m.key)}
          className={`flex flex-col items-center gap-1 rounded-[7px] border cursor-pointer transition-all text-center
            ${selected === m.key ? "border-rust-mid" : "bg-bg-card border-border hover:border-border-mid"}`}
          style={{ padding: "10px", background: selected === m.key ? "rgba(153,60,29,.07)" : undefined }}
        >
          <span className="text-[18px]">{m.emoji}</span>
          <span className="text-[10px] text-text-sec font-medium">{m.name}</span>
        </div>
      ))}
    </div>
  );
}
