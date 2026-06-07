"use client";

import { useState, useEffect, useCallback } from "react";

/* Matches .gs-wrap + .global-search: padding 8px 14px, gap 8px, border-mid, rounded-lg */
export default function ProjectSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/projects");
        if (res.ok) setAllProjects(await res.json());
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) { setOpen(false); setResults([]); return; }
    const lower = q.toLowerCase();
    const filtered = allProjects.filter((p: any) =>
      p.name?.toLowerCase().includes(lower) ||
      p.projectCode?.toLowerCase().includes(lower) ||
      p.state?.toLowerCase().includes(lower)
    );
    setResults(filtered.slice(0, 5));
    setOpen(true);
  }, [allProjects]);

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
          placeholder="Search projects by name, code, state..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        <span className="text-[10px] text-text-ter font-mono">Search</span>
      </div>

      {/* Results dropdown — matches .gs-results */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 bg-bg-surface border border-border-mid rounded-lg z-[200] overflow-hidden" style={{ top: "calc(100% + 4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {results.map((r: any) => (
            <a
              key={r.id}
              href={`/projects/${r.id}/portal`}
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
