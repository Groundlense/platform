"use client";

import { RiSettings4Line, RiRadarLine, RiCheckDoubleLine, RiFlaskLine, RiFileTextLine, RiSettingsLine } from "react-icons/ri";
import { usePortalTab } from "./PortalContext";

const SIDEBAR_ITEMS = [
  { key: "setup" as const, icon: RiSettings4Line, label: "Setup" },
  { key: "monitor" as const, icon: RiRadarLine, label: "Monitor" },
  { key: "review" as const, icon: RiCheckDoubleLine, label: "Review" },
  { key: "lab" as const, icon: RiFlaskLine, label: "Lab" },
  { key: "report" as const, icon: RiFileTextLine, label: "Report" },
];

/* Matches .sidebar: width 48px, bg-surface, border-right, padding 10px 0, gap 2px */
export default function PortalSidebar() {
  const { activeTab, setActiveTab } = usePortalTab();

  return (
    <div className="w-12 bg-bg-surface border-r border-border flex flex-col items-center gap-[2px] shrink-0" style={{ padding: "10px 0" }}>
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-[15px] cursor-pointer border transition-all duration-100 relative group
              ${isActive
                ? "bg-[rgba(153,60,29,.2)] text-rust-d border-[rgba(153,60,29,.3)]"
                : "text-text-ter border-transparent hover:bg-bg-card hover:text-text-sec"
              }`}
          >
            <Icon />
            {/* Tooltip — matches .si .tip */}
            <span className="hidden group-hover:block absolute left-[42px] top-1/2 -translate-y-1/2 bg-bg-raised border-[0.5px] border-border-mid text-text-pri text-[10px] py-[3px] px-[7px] rounded-[3px] whitespace-nowrap z-[300]">
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Divider — matches .sdiv */}
      <div className="w-[22px] h-[1px] bg-border my-[3px]" />

      <div className="mt-auto">
        <div className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-[15px] cursor-pointer text-text-ter border border-transparent hover:bg-bg-card hover:text-text-sec transition-all relative group">
          <RiSettingsLine />
          <span className="hidden group-hover:block absolute left-[42px] top-1/2 -translate-y-1/2 bg-bg-raised border-[0.5px] border-border-mid text-text-pri text-[10px] py-[3px] px-[7px] rounded-[3px] whitespace-nowrap z-[300]">
            Config
          </span>
        </div>
      </div>
    </div>
  );
}
