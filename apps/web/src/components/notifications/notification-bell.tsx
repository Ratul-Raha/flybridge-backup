"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { AppNotification, NotificationsResponse } from "@/lib/notifications";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { timeAgo } from "@/lib/time";

const POLL_INTERVAL = 30_000;
const DROPDOWN_LIMIT = 12;

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?limit=${DROPDOWN_LIMIT}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = useCallback(async (id: string) => {
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    fetch("/api/notifications", { method: "POST" }).catch(() => {});
  }, []);

  const openItem = useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead(n.id);
      setOpen(false);
      if (n.type === "seminar_registration" && n.seminarId) {
        window.location.assign(`/dashboard/seminars/${n.seminarId}/registrations`);
      } else if (n.type === "seminar_created") {
        window.location.assign("/seminars");
      } else if (n.type === "course_launched") {
        window.location.assign(n.courseSlug ? `/programs/${n.courseSlug}` : "/programs");
      } else if (n.type === "resource_created") {
        window.location.assign("/resources");
      } else if (n.type === "scholarship_created") {
        window.location.assign("/dashboard/scholarships");
      } else if (n.type === "order_created" || n.type === "order_fulfilled") {
        window.location.assign("/dashboard/admin/orders");
      }
    },
    [markRead],
  );

  if (!user) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-[38px] h-[38px] rounded-full border border-line flex items-center justify-center bg-white hover:border-brand-2 hover:bg-brand-soft transition-all duration-250"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        {unreadCount > 0 ? (
          <BellRing size={16} style={{ color: "var(--brand)" }} />
        ) : (
          <Bell size={16} style={{ color: "var(--ink)" }} />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full flex items-center justify-center font-mono text-[9px] font-semibold text-white px-[4px]"
            style={{
              background: "var(--brand)",
              boxShadow: "0 0 0 2px #fff, 0 4px 10px -3px rgba(15,169,104,0.6)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-[10px] w-[min(calc(100vw-24px),360px)] rounded-2xl border bg-white overflow-hidden flex flex-col"
          style={{
            borderColor: "var(--line)",
            boxShadow: "0 30px 60px -25px rgba(18,32,67,0.32)",
            maxHeight: "min(540px, calc(100dvh - 120px))",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b shrink-0"
            style={{ borderColor: "var(--line)" }}
          >
            <div>
              <div
                className="font-display font-semibold text-[15px]"
                style={{ color: "var(--ink)" }}
              >
                Notifications
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.2em] uppercase mt-[2px]"
                style={{ color: "var(--body)" }}
              >
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-[6px] transition-colors duration-200 hover:opacity-85"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <InlineLoader label="Loading…" />
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div
                  className="w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <Bell size={18} style={{ color: "var(--body)" }} />
                </div>
                <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  No notifications yet
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                  New seminar registrations will appear here.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-brand-soft/60"
                      style={n.read ? {} : { background: "rgba(20,181,126,0.05)" }}
                    >
                      <span
                        className="mt-[3px] w-[30px] h-[30px] shrink-0 rounded-full flex items-center justify-center"
                        style={
                          n.read
                            ? { background: "var(--bg-soft)" }
                            : { background: "var(--brand-soft)" }
                        }
                      >
                        <NotificationIcon
                          type={n.type}
                          size={14}
                          style={{
                            color: n.read ? "var(--body)" : "var(--brand)",
                          }}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className="truncate text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            {n.title}
                          </span>
                          {!n.read && (
                            <span
                              className="w-[6px] h-[6px] rounded-full shrink-0"
                              style={{ background: "var(--brand)" }}
                            />
                          )}
                        </span>
                        <span
                          className="block text-[12.5px] leading-[1.5] mt-[2px] line-clamp-2"
                          style={{ color: "var(--body)" }}
                        >
                          {n.message}
                        </span>
                        <span
                          className="block font-mono text-[10px] tracking-[0.1em] mt-[5px]"
                          style={{ color: "#A6ADC0" }}
                        >
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t px-5 py-3 shrink-0" style={{ borderColor: "var(--line)" }}>
            <a
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-[13px] font-medium"
              style={{ color: "var(--brand-2)" }}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
