"use client";

import { useState, useCallback, useTransition } from "react";
import { globalSearchProjectsAction, requestJoinProjectAction } from "@/app/actions/projects";

interface ProjectSearchProps {
  /** Projects already fetched server-side (org-scoped) — filtered client-side. */
  projects: any[];
  orgType: string | null;
}

export default function ProjectSearch({ projects, orgType }: ProjectSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const portalSegment = orgType === "EPC_CONTRACTOR" ? "contractor" : "portal";

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setRequestError(null);
    setRequestSuccess(null);

    if (q.length < 2) {
      setOpen(false);
      setResults([]);
      return;
    }

    const lower = q.toLowerCase();
    const localFiltered = projects.filter((p: any) =>
      p.name?.toLowerCase().includes(lower) ||
      p.projectCode?.toLowerCase().includes(lower) ||
      p.id?.toLowerCase().includes(lower) ||
      p.state?.toLowerCase().includes(lower)
    ).map(p => ({ ...p, hasAccess: true }));

    let globalResults: any[] = [];
    try {
      globalResults = await globalSearchProjectsAction(q);
    } catch (err) {
      console.error("Global search failed:", err);
    }

    const mergedMap = new Map<string, any>();
    localFiltered.forEach(p => mergedMap.set(p.id, p));
    globalResults.forEach(p => {
      if (!mergedMap.has(p.id)) {
        mergedMap.set(p.id, p);
      }
    });

    const merged = Array.from(mergedMap.values());
    setResults(merged.slice(0, 5));
    setOpen(true);
  }, [projects]);

  const handleRequestJoin = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRequestError(null);
    setRequestSuccess(null);

    startTransition(async () => {
      const res = await requestJoinProjectAction(projectId);
      if (res && "error" in res && res.error) {
        setRequestError(res.error);
      } else {
        setRequestSuccess("Join request submitted successfully!");
      }
    });
  };

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
          placeholder="Search projects by name, code, state, or partner GSTIN..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 250)}
        />
        <span className="text-[10px] text-text-ter font-mono">Global Search</span>
      </div>

      {requestError && (
        <div className="text-[10px] text-rust-d rounded-[6px] mt-2 leading-relaxed" style={{ padding: "6px 10px", background: "rgba(153,60,29,.1)", border: "1px solid rgba(153,60,29,.3)" }}>
          ⚠ {requestError}
        </div>
      )}
      {requestSuccess && (
        <div className="text-[10px] text-green-d rounded-[6px] mt-2 leading-relaxed" style={{ padding: "6px 10px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)" }}>
          ✓ {requestSuccess}
        </div>
      )}

      {/* Results dropdown — matches .gs-results */}
      {open && (
        <div className="absolute left-0 right-0 bg-bg-surface border border-border-mid rounded-lg z-[200] overflow-hidden" style={{ top: "calc(100% + 4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {results.length === 0 && (
            <div className="text-[11px] text-text-ter" style={{ padding: "12px 14px" }}>
              No matching projects found globally.
            </div>
          )}
          {results.map((r: any) => {
            const rowContent = (
              <div>
                <div className="font-mono text-[9px] text-amber-d mb-[2px]">{r.projectCode}</div>
                <div className="text-[12px] text-text-pri mb-[2px]">{r.name}</div>
                <div className="text-[10px] text-text-ter">{[r.status, r.state, r.epcOrganization?.name].filter(Boolean).join(" · ")}</div>
              </div>
            );

            if (r.hasAccess) {
              return (
                <a
                  key={r.id}
                  href={`/projects/${r.id}/${portalSegment}`}
                  className="flex justify-between items-center no-underline cursor-pointer transition-colors hover:bg-bg-card"
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", gap: "10px" }}
                >
                  {rowContent}
                  <span className="text-[9px] rounded-[5px] text-rust-d cursor-pointer whitespace-nowrap shrink-0"
                    style={{ padding: "4px 10px", border: "1px solid var(--color-rust-mid)", background: "rgba(153,60,29,.1)" }}>
                    Open →
                  </span>
                </a>
              );
            }

            return (
              <div
                key={r.id}
                className="flex justify-between items-center"
                style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", gap: "10px" }}
              >
                {rowContent}
                <button
                  onClick={(e) => handleRequestJoin(r.id, e)}
                  disabled={isPending}
                  className="text-[9px] rounded-[5px] text-rust-d font-medium cursor-pointer whitespace-nowrap shrink-0 bg-transparent border border-border-mid hover:border-rust-mid hover:bg-bg-card transition-all"
                  style={{ padding: "4px 10px" }}
                >
                  {isPending ? "Requesting..." : "Request to Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
