"use client";

import { useState } from "react";
import PortalTopbar from "./PortalTopbar";
import PortalSidebar from "./PortalSidebar";
import PortalLeftPanel from "./PortalLeftPanel";

interface PortalLayoutClientProps {
  project: any;
  projects: any[];
  user: Record<string, unknown> | null;
  children: React.ReactNode;
}

/* Matches #portalPage: flex column, height 100vh, overflow hidden */
export default function PortalLayoutClient({ project, projects, user, children }: PortalLayoutClientProps) {
  const [activeTab, setActiveTab] = useState("setup");

  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <PortalTopbar project={project} user={user} />

      {/* Layout — matches .layout: flex, flex-1, overflow hidden */}
      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <PortalLeftPanel projects={projects} currentProjectId={project?.id} />

        {/* Right — matches .right: flex-1, flex column, overflow hidden */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar — matches .tabs: padding 0 16px, bg-surface, border-bottom */}
          <div className="flex items-center bg-bg-surface border-b border-border shrink-0" style={{ padding: "0 16px" }}>
            {[
              { key: "setup", label: "Setup", icon: "⚙" },
              { key: "monitor", label: "Live Monitor", icon: "📡" },
              { key: "review", label: "Review", icon: "✓" },
              { key: "lab", label: "Lab", icon: "🧪" },
              { key: "report", label: "Report", icon: "📄" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-[5px] whitespace-nowrap bg-transparent border-x-0 border-t-0 transition-all duration-100 cursor-pointer
                  ${activeTab === tab.key
                    ? "text-rust-d border-b-2 border-rust-mid"
                    : "text-text-ter border-b-2 border-transparent hover:text-text-sec"
                  }`}
                style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 500 }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content — matches .content: flex-1, overflow-y auto, padding 16px */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
