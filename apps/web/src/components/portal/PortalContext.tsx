"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type PortalTab = "setup" | "monitor" | "review" | "lab" | "report" | "settings" | "requests";

interface PortalContextType {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
}

const PortalContext = createContext<PortalContextType>({
  activeTab: "setup",
  setActiveTab: () => {},
});

export function PortalProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<PortalTab>("setup");
  return (
    <PortalContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalTab() {
  return useContext(PortalContext);
}
