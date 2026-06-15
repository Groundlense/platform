"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction, createPaymentAction } from "@/app/actions/projects";
import { formatCurrency } from "@/lib/utils";

interface GeotechOrg {
  id: string;
  name: string;
  type: string;
  city: string | null;
  state: string | null;
}

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  geotechOrgs: GeotechOrg[];
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const STEP_LABELS = ["Project details", "Boring setup", "Link parties", "Payment"];

/* Matches .modal-overlay + .modal: 500px wide, rounded-xl, max-h 85vh */
export default function NewProjectModal({ open, onClose, geotechOrgs }: NewProjectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 form state
  const [name, setName] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [geotechOrgId, setGeotechOrgId] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2
  const [bhCount, setBhCount] = useState(3);

  // Created project + payment status
  const [project, setProject] = useState<any>(null);
  const [paymentRecorded, setPaymentRecorded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const total = bhCount * 5000;

  const resetAndClose = () => {
    setStep(1);
    setName("");
    setStateVal("");
    setGeotechOrgId("");
    setEndDate("");
    setBhCount(3);
    setProject(null);
    setPaymentRecorded(false);
    setError(null);
    onClose();
  };

  const handleCreate = () => {
    if (isPending) return;
    if (!name.trim()) { setError("Project name is required."); setStep(1); return; }
    if (!geotechOrgId.trim()) { setError("Select a geotech partner organization."); setStep(1); return; }
    setError(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    if (stateVal) fd.set("state", stateVal);
    fd.set("geotechOrganizationId", geotechOrgId.trim());
    if (endDate) fd.set("endDate", endDate);
    startTransition(async () => {
      const res = await createProjectAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
      } else if ("project" in res) {
        setProject(res.project);
        setStep(3);
        router.refresh();
      }
    });
  };

  const handlePay = () => {
    if (isPending || !project) return;
    setError(null);
    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("boringsPurchased", String(bhCount));
    fd.set("amountPaid", String(total));
    startTransition(async () => {
      const res = await createPaymentAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setPaymentRecorded(true);
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}>
      <div className="bg-bg-surface border border-border-mid rounded-xl flex flex-col" style={{ width: "500px", maxHeight: "85vh" }}>

        {/* Header — matches .modal-hdr: padding 16px 20px, sticky top */}
        <div className="flex items-center justify-between shrink-0 sticky top-0 z-[1] bg-bg-surface" style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <div className="font-display text-[18px] text-text-pri">New project</div>
          <button onClick={resetAndClose} className="text-[20px] text-text-ter cursor-pointer hover:text-rust-d transition-colors bg-transparent border-none p-0 leading-none">✕</button>
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
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              stateVal={stateVal} setStateVal={setStateVal}
              geotechOrgId={geotechOrgId} setGeotechOrgId={setGeotechOrgId}
              endDate={endDate} setEndDate={setEndDate}
              geotechOrgs={geotechOrgs}
            />
          )}
          {step === 2 && <Step2 bhCount={bhCount} setBhCount={setBhCount} />}
          {step === 3 && <Step3 project={project} />}
          {step === 4 && (
            <Step4
              bhCount={bhCount}
              total={total}
              isPending={isPending}
              paymentRecorded={paymentRecorded}
              onPay={handlePay}
              onPayLater={resetAndClose}
            />
          )}

          {error && (
            <div className="text-[11px] text-rust-d rounded-[6px] mt-3 leading-relaxed" style={{ padding: "9px 12px", background: "rgba(153,60,29,.1)", border: "1px solid rgba(153,60,29,.3)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer — matches .modal-ftr: padding 12px 20px, sticky bottom */}
        <div className="flex gap-2 shrink-0 sticky bottom-0 bg-bg-surface" style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="bg-transparent border border-border-mid rounded-[7px] text-[12px] text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all" style={{ padding: "10px 16px" }}>← Back</button>
          ) : <div />}
          {step === 1 && (
            <button onClick={() => setStep(2)} className="flex-1 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors" style={{ padding: "10px" }}>
              Next — Boring setup →
            </button>
          )}
          {step === 2 && (
            <button onClick={handleCreate} disabled={isPending} className="flex-1 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors disabled:opacity-60 disabled:cursor-default" style={{ padding: "10px" }}>
              {isPending ? "Creating project…" : "Create project →"}
            </button>
          )}
          {step === 3 && (
            <button onClick={() => setStep(4)} className="flex-1 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors" style={{ padding: "10px" }}>
              Next — Payment →
            </button>
          )}
          {step === 4 && paymentRecorded && (
            <button onClick={resetAndClose} className="flex-1 bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors" style={{ padding: "10px" }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Form field — matches .fg + .fl + .fi from HTML (controlled) */
function ModalField({ label, placeholder, value, onChange, type = "text", mono = false, helper }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  helper?: string;
}) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.4px]">{label}</label>
      <input
        className={`bg-bg-raised border border-border-mid rounded-[5px] text-[11px] text-text-pri outline-none transition-colors focus:border-rust-mid placeholder:text-text-ter ${mono ? "font-mono text-amber-d" : ""}`}
        style={{ padding: "7px 9px" }}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper && <div className="text-[9px] text-text-ter leading-relaxed">{helper}</div>}
    </div>
  );
}

function ModalSelect({ label, options, value, onChange, placeholder }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.4px]">{label}</label>
      <select
        className="bg-bg-raised border border-border-mid rounded-[5px] text-[11px] text-text-pri outline-none focus:border-rust-mid cursor-pointer"
        style={{ padding: "7px 9px" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

/* Step 1 — Project details (only fields the API actually persists) */
function Step1({ name, setName, stateVal, setStateVal, geotechOrgId, setGeotechOrgId, endDate, setEndDate, geotechOrgs }: {
  name: string; setName: (v: string) => void;
  stateVal: string; setStateVal: (v: string) => void;
  geotechOrgId: string; setGeotechOrgId: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  geotechOrgs: GeotechOrg[];
}) {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Project details</div>
      <ModalField label="Project name" placeholder="NH-48 Delhi–Vadodara · Package 14" value={name} onChange={setName} />
      <ModalSelect label="State" options={INDIAN_STATES} value={stateVal} onChange={setStateVal} placeholder="Select state" />

      {/* Geotech partner — real org directory (GET /organizations?type=GEOTECH_CONTRACTOR) */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-[9px] font-semibold text-text-ter uppercase tracking-[0.4px]">Geotech partner organization</label>
        {geotechOrgs.length === 0 ? (
          <div className="text-[10px] text-text-ter bg-bg-raised border border-border-mid rounded-[5px] leading-relaxed" style={{ padding: "7px 9px" }}>
            No geotech contractor organizations are registered yet — ask your geotech partner to register on GroundLense first.
          </div>
        ) : (
          <select
            className="bg-bg-raised border border-border-mid rounded-[5px] text-[11px] text-text-pri outline-none focus:border-rust-mid cursor-pointer"
            style={{ padding: "7px 9px" }}
            value={geotechOrgId}
            onChange={(e) => setGeotechOrgId(e.target.value)}
          >
            <option value="">— Select geotech contractor —</option>
            {geotechOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.city || o.state ? ` — ${[o.city, o.state].filter(Boolean).join(", ")}` : ""}
              </option>
            ))}
          </select>
        )}
        <div className="text-[9px] text-text-ter leading-relaxed">The selected organization is linked to this project and its field teams sync boring data.</div>
      </div>

      <ModalField label="Target completion date" placeholder="2026-12-31" type="date" value={endDate} onChange={setEndDate} />
    </div>
  );
}

/* Step 2 — Boring setup (count drives the real payment amount) */
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

      <div className="info-banner info-banner-blue">
        <span>ℹ</span> Individual boreholes (codes, depths, locations) are added from the project portal after creation.
      </div>
    </div>
  );
}

/* Step 3 — Link parties (shows the real, persisted project code) */
function Step3({ project }: { project: any }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!project?.projectCode) return;
    try {
      await navigator.clipboard.writeText(project.projectCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Link parties</div>
      <div className="info-banner info-banner-blue mb-3">
        <span>ℹ</span> Share your Project ID with IE firms and GT contractors so they can be linked to this project.
      </div>

      {/* Share box — real persisted project code */}
      <div className="bg-bg-card border border-border rounded-lg mb-3 flex items-center justify-between gap-3" style={{ padding: "14px" }}>
        <div>
          <div className="text-[9px] text-text-ter uppercase tracking-[0.4px] mb-1">Your project ID</div>
          <div className="font-mono text-[16px] text-amber-d">{project?.projectCode || "—"}</div>
        </div>
        <button
          onClick={copyCode}
          className="text-[10px] bg-transparent border border-border-mid rounded-[6px] text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all whitespace-nowrap"
          style={{ padding: "6px 12px" }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      <div className="text-[10px] text-text-sec uppercase tracking-wider mb-2">Pending approval requests</div>
      <div className="bg-bg-card border border-border rounded-[7px] text-center text-[11px] text-text-ter" style={{ padding: "14px 12px" }}>
        No access requests yet
      </div>
    </div>
  );
}

/* Step 4 — Payment (records a real PENDING payment; Razorpay checkout not yet integrated) */
function Step4({ bhCount, total, isPending, paymentRecorded, onPay, onPayLater }: {
  bhCount: number;
  total: number;
  isPending: boolean;
  paymentRecorded: boolean;
  onPay: () => void;
  onPayLater: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="section-lbl">Payment</div>

      {/* Total box — matches .pay-total-box */}
      <div className="rounded-lg text-center mb-[14px]" style={{ background: "rgba(153,60,29,.08)", border: "1px solid rgba(153,60,29,.25)", padding: "16px 20px" }}>
        <div className="text-[10px] text-text-ter uppercase tracking-[0.5px] mb-[6px]">Total amount for this project</div>
        <div className="font-display text-[32px] text-rust-d">{formatCurrency(total)}</div>
        <div className="text-[10px] text-text-ter mt-[6px] leading-relaxed">
          {bhCount} borings × {formatCurrency(5000)}
        </div>
      </div>

      {/* Payment summary — matches .pay-summary */}
      <div className="bg-bg-card border border-border rounded-lg mb-[14px]" style={{ padding: "14px" }}>
        <div className="flex justify-between text-[12px] text-text-sec border-b border-border" style={{ padding: "5px 0" }}>
          <span>Borings ({bhCount}x)</span><span className="font-mono">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-text-pri font-medium" style={{ padding: "9px 0 0" }}>
          <span>Total</span><span className="font-mono text-rust-d">{formatCurrency(total)}</span>
        </div>
      </div>

      {paymentRecorded ? (
        <div className="info-banner info-banner-amber mb-[14px]">
          <span>⏳</span> Payment recorded as PENDING — complete via Razorpay checkout (coming soon).
        </div>
      ) : (
        <>
          <div className="info-banner info-banner-amber mb-[14px]">
            <span>🔒</span> Live boring data, field photos, GPS location and SPT entries are visible after payment. You can save the project now and pay when ready.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onPay} disabled={isPending} className="bg-rust-mid border-none rounded-[7px] text-[12px] font-medium text-text-pri cursor-pointer hover:bg-rust transition-colors disabled:opacity-60 disabled:cursor-default" style={{ padding: "10px" }}>
              {isPending ? "Recording…" : `Pay & activate · ${formatCurrency(total)}`}
            </button>
            <button onClick={onPayLater} disabled={isPending} className="bg-transparent border border-border-mid rounded-[7px] text-[12px] text-text-sec cursor-pointer hover:border-rust-mid hover:text-rust-d transition-all disabled:opacity-60" style={{ padding: "10px" }}>
              Save · Pay later
            </button>
          </div>
        </>
      )}
    </div>
  );
}
