"use client";

import { useState, useCallback } from "react";

interface ProjectSearchProps {
  /** Projects already fetched server-side (org-scoped) — filtered client-side. */
  projects: any[];
  orgType: string | null;
}

/* Matches .gs-wrap + .global-search: padding 8px 14px, gap 8px, border-mid, rounded-lg */
export default function ProjectSearch({ projects, orgType }: ProjectSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const portalSegment = orgType === "EPC_CONTRACTOR" ? "contractor" : "portal";

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) { setOpen(false); setResults([]); return; }
    const lower = q.toLowerCase();
    const filtered = projects.filter((p: any) =>
      p.name?.toLowerCase().includes(lower) ||
      p.projectCode?.toLowerCase().includes(lower) ||
      p.state?.toLowerCase().includes(lower)
    );
    setResults(filtered.slice(0, 5));
    setOpen(true);
  }, [projects]);

  return (
    <div className="relative mb-4">
      {/* Search bar — matches .global-search */}
      <div
        className="flex items-center bg-bg-card border border-border-mid rounded-lg cursor-text"
        style={{ padding: "8px 14px", gap: "8px" }}
        onClick={() => document.getElementById("gsInput")?.focus()}
      >
        <span className="text-[14px] text-text-ter">🔍</span>
        <input
          id="gsInput"
          className="flex-1 bg-transparent border-none outline-none text-[12px] text-text-pri placeholder:text-text-ter"
          placeholder="Search your projects by name, code, state..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        <span className="text-[10px] text-text-ter font-mono">Search</span>
      </div>

      {/* Results dropdown — matches .gs-results */}
      {open && (
        <div className="absolute left-0 right-0 bg-bg-surface border border-border-mid rounded-lg z-[200] overflow-hidden" style={{ top: "calc(100% + 4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {results.length === 0 && (
            <div className="text-[11px] text-text-ter" style={{ padding: "12px 14px" }}>
              No matching projects in your organization.
            </div>
          )}
          {results.map((r: any) => (
            <a
              key={r.id}
              href={`/projects/${r.id}/${portalSegment}`}
              className="flex justify-between items-center no-underline cursor-pointer transition-colors hover:bg-bg-card"
              style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", gap: "10px" }}
            >
              <div>
                <div className="font-mono text-[9px] text-amber-d mb-[2px]">{r.projectCode}</div>
                <div className="text-[12px] text-text-pri mb-[2px]">{r.name}</div>
                <div className="text-[10px] text-text-ter">{[r.status, r.state, r.epcOrganization?.name].filter(Boolean).join(" · ")}</div>
              </div>
              <span className="text-[9px] rounded-[5px] text-rust-d cursor-pointer whitespace-nowrap shrink-0"
                style={{ padding: "4px 10px", border: "1px solid var(--color-rust-mid)", background: "rgba(153,60,29,.1)" }}>
                Open →
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
