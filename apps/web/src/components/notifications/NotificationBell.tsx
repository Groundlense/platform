"use client";

import { useState, useEffect, useRef } from "react";
import { RiNotification3Line } from "react-icons/ri";
import { getNotificationsAction, markNotificationAsReadAction } from "@/app/actions/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds to keep it fresh
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsReadAction(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-[5px] bg-bg-card flex items-center justify-center cursor-pointer relative hover:border-rust-mid transition-all border border-border"
        style={{ width: "30px", height: "30px" }}
      >
        <RiNotification3Line className="text-text-sec text-[14px]" />
        {unreadCount > 0 && (
          <span
            className="absolute rounded-full bg-rust-mid flex items-center justify-center text-[7px] text-white font-bold"
            style={{
              top: "-4px",
              right: "-4px",
              minWidth: "14px",
              height: "14px",
              padding: "0 3px",
              border: "1.5px solid var(--color-bg-surface)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 bg-bg-surface border border-border shadow-lg rounded-lg z-[999] flex flex-col overflow-hidden"
          style={{ width: "320px", maxHeight: "380px" }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border bg-bg-card flex justify-between items-center shrink-0">
            <span className="text-[11px] font-semibold text-text-pri uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[9px] text-rust-d font-medium bg-rust-mid/10 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-y-auto max-h-[320px] divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[10px] text-text-ter">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleRead(notif.id)}
                  className={`p-3 text-left transition-colors flex gap-2 cursor-pointer
                    ${notif.read ? "bg-bg-surface hover:bg-bg-card/50" : "bg-rust-mid/5 hover:bg-rust-mid/10"}`}
                >
                  {/* Indicator Dot */}
                  {!notif.read && (
                    <div className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-rust-mid" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-text-pri leading-snug truncate">
                      {notif.title}
                    </div>
                    <div className="text-[10px] text-text-sec mt-0.5 leading-normal break-words">
                      {notif.message}
                    </div>
                    <div className="text-[8px] text-text-ter mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
