"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";
import type { AppNotification, NotificationsResponse } from "@/lib/notifications";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { timeAgo } from "@/lib/time";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
      if (!res.ok) {
        setError("Failed to load notifications");
        return;
      }
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
      }
    },
    [markRead]
  );

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.3em] uppercase"
            style={{ color: "var(--brand-2)" }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
            Notification center
          </div>
          <h1
            className="font-display font-semibold tracking-[-0.02em] mt-2"
            style={{ fontSize: "clamp(24px,3vw,28px)", color: "var(--ink)" }}
          >
            Notifications
          </h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase mt-1.5" style={{ color: "var(--body)" }}>
            {notifications.length} total · {unreadCount} unseen
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase rounded-full border px-4 py-[9px] transition-all duration-200 hover:translate-y-[-1px]"
            style={{ borderColor: "var(--line)", background: "#fff", color: "var(--brand-2)" }}
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={i === 0 ? "py-4 px-4 flex items-center gap-4" : "py-4 px-4 flex items-center gap-4 border-t"}
              style={i === 0 ? {} : { borderColor: "var(--line)" }}
            >
              <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "var(--line)" }} />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-[10px] rounded-full w-[35%]" style={{ background: "var(--line)" }} />
                <div className="h-[10px] rounded-full w-[60%]" style={{ background: "var(--line)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          className="text-[12.5px] rounded-xl border px-4 py-3"
          style={{
            color: "#C0392B",
            borderColor: "rgba(192,57,43,0.25)",
            background: "rgba(192,57,43,0.06)",
          }}
        >
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="rounded-[20px] border bg-white px-6 py-16 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
            <Bell size={20} style={{ color: "var(--brand)" }} />
          </div>
          <p className="font-display text-[16px] font-semibold mt-1" style={{ color: "var(--ink)" }}>
            All caught up
          </p>
          <p className="text-[13px] leading-[1.6] max-w-[360px]" style={{ color: "var(--body)" }}>
            New seminars, course launches, resources and registration activity will land here as they happen.
          </p>
        </div>
      ) : (
        <div
          className="rounded-[16px] border bg-white overflow-hidden"
          style={{ borderColor: "var(--line)" }}
        >
          <ul>
            {sorted.map((n, i) => (
              <li
                key={n.id}
                className={i === 0 ? "relative" : "relative border-t"}
                style={i === 0 ? {} : { borderColor: "var(--line)" }}
              >
                {!n.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "var(--brand)" }} />
                )}
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className="w-full flex items-center gap-3 sm:gap-4 pl-5 pr-4 py-[15px] text-left transition-colors duration-200 hover:bg-bg-soft group"
                  style={{ background: n.read ? "#fff" : "rgba(20,181,126,0.03)" }}
                >
                  <span
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
                    style={
                      n.read
                        ? { background: "var(--bg-soft)" }
                        : { background: "var(--brand-soft)" }
                    }
                  >
                    <NotificationIcon type={n.type} size={16} style={{ color: n.read ? "var(--body)" : "var(--brand)" }} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[14px] leading-snug"
                      style={{
                        color: n.read ? "var(--body)" : "var(--ink)",
                        fontWeight: n.read ? 500 : 650,
                      }}
                    >
                      {n.title}
                    </span>
                    <span
                      className="block text-[13px] leading-[1.55] mt-[3px] line-clamp-2"
                      style={{ color: "var(--body)" }}
                    >
                      {n.message}
                    </span>
                    <span className="flex items-center gap-2 mt-[8px]">
                      <span className="font-mono text-[10.5px] tracking-[0.12em]" style={{ color: "#A6ADC0" }}>
                        {timeAgo(n.createdAt)}
                      </span>
                      <span className="w-[3px] h-[3px] rounded-full" style={{ background: "#A6ADC0" }} />
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.12em] uppercase transition-all duration-200 group-hover:gap-2"
                        style={{ color: "var(--brand-2)" }}
                      >
                        View <ArrowRight size={11} />
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}