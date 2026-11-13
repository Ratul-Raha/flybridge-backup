"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone, Monitor, Trash2, Loader2 } from "lucide-react";

type Session = {
  id: string;
  sessionId: string;
  deviceName: string;
  lastSeenAt: string;
  createdAt: string;
  current?: boolean;
};

function SessionIcon({ name }: { name: string }) {
  const os = name.toLowerCase();
  const mobile =
    os.includes("iphone") || os.includes("ipad") || os.includes("android");
  return mobile ? (
    <Smartphone size={18} style={{ color: "var(--brand)" }} />
  ) : (
    <Monitor size={18} style={{ color: "var(--brand)" }} />
  );
}

export function DeviceManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [limit, setLimit] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sessions");
      setSessions(data.sessions ?? []);
      setLimit(data.limit ?? 2);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (session: Session) => {
    if (session.current) return;
    setRemoving(session.id);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove session");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove session");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div
      className="rounded-[24px] border bg-white p-[clamp(20px,3vw,30px)]"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Active sessions
          </h2>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--body)" }}>
            You can be signed in on up to {limit} sessions at once. Signing in
            from a new place will automatically sign out your oldest session.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--body)" }} />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[13px] py-4" style={{ color: "var(--body)" }}>
            No active sessions yet. You&apos;ll be recorded the next time you sign in.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{
                  borderColor: s.current ? "var(--brand)" : "var(--line)",
                  background: s.current ? "var(--brand-soft, rgba(107,76,224,0.05))" : "white",
                }}
              >
                <SessionIcon name={s.deviceName} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium flex items-center gap-2" style={{ color: "var(--ink)" }}>
                    {s.deviceName}
                    {s.current && (
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{ background: "var(--brand-soft, rgba(107,76,224,0.1))", color: "var(--brand)" }}
                      >
                        This session
                      </span>
                    )}
                  </p>
                  <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                    Last active {new Date(s.lastSeenAt).toLocaleString()}
                  </p>
                </div>
                {!s.current && (
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    disabled={removing === s.id}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[6px] text-[12px] font-medium transition-colors hover:bg-red-50"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                  >
                    {removing === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-[12.5px]" style={{ color: "#C0392B" }}>
            {error}
          </p>
        )}

        {sessions.length > 0 && (
          <p
            className="font-mono text-[10.5px] uppercase tracking-[0.12em]"
            style={{ color: "var(--body)" }}
          >
            {sessions.length}/{limit} session slots used
          </p>
        )}
      </div>
    </div>
  );
}
