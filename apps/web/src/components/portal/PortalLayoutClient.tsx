"use client";

import { PortalProvider } from "./PortalContext";
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
  return (
    <PortalProvider>
      <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
        <PortalTopbar project={project} user={user} />

        {/* Layout — matches .layout: flex, flex-1, overflow hidden */}
        <div className="flex flex-1 overflow-hidden">
          <PortalSidebar />
          <PortalLeftPanel projects={projects} currentProjectId={project?.id} />

          {/* Right — matches .right: flex-1, flex column, overflow hidden */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </PortalProvider>
  );
}
