"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, TriangleAlert, Terminal } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageLoader } from "@/components/dashboard/page-loader";
import { TRAFFIC_WINDOWS, type TrafficSource } from "@/lib/analytics/types";
import { TrafficStatCards } from "./traffic-stat-cards";
import { TrafficDensityChart } from "./traffic-density-chart";
import { TodayTrafficChart } from "./today-traffic-chart";
import { LivePages } from "./live-pages";
import { TrafficSources } from "./traffic-sources";

/** Realtime data is a moving target; 30s keeps it fresh without burning quota. */
const REFRESH_MS = 30_000;

type State =
  | { status: "loading" }
  | { status: "unconfigured"; missing: string[] }
  | { status: "error"; message: string }
  | { status: "ready"; data: TrafficSource };

function WindowPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 rounded-full p-1 border"
        style={{ borderColor: "var(--line)", background: "#fff" }}
      >
        {TRAFFIC_WINDOWS.map((w) => (
          <button
            key={w}
            type="button"
            disabled={disabled}
            onClick={() => onChange(w)}
            className="font-mono text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
            style={
              value === w
                ? { background: "var(--brand)", color: "#fff" }
                : { color: "var(--body)" }
            }
          >
            {w}m
          </button>
        ))}
      </div>
    </div>
  );
}

function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="rounded-lg border bg-white p-[clamp(18px,2.5vw,26px)]" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
        >
          <TriangleAlert size={19} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Connect Google Analytics to see traffic density
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            The browser tag only sends data. Reading it back needs the GA4 Data API, so add
            these environment variables and give the service account <b>Viewer</b> access on the
            GA4 property.
          </p>

          <div
            className="mt-4 rounded-lg p-4 text-[12px] leading-relaxed"
            style={{ background: "#12162A", color: "#E6E9F2" }}
          >
            <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.14em] opacity-70">
              <Terminal size={13} />
              Missing configuration
            </div>
            <ul className="flex flex-col gap-1.5 font-mono">
              {missing.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
            <p className="mt-4 font-sans text-[11.5px] opacity-70">
              GA4_PROPERTY_ID is the numeric property id (Admin → Property settings), not the
              G-XXXX measurement id. See <code className="font-mono">.env.example</code> for the
              full setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [window, setWindow] = useState(30);
  const [state, setState] = useState<State>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const windowRef = useRef(window);
  windowRef.current = window;

  const load = useCallback(async (minutes: number, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics/traffic?minutes=${minutes}`, {
        cache: "no-store",
      });
      const body = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: body?.error ?? `Request failed (${res.status})` });
        return;
      }
      if (body.configured === false) {
        setState({ status: "unconfigured", missing: body.missing ?? [] });
        return;
      }
      setState({ status: "ready", data: body.data as TrafficSource });
    } catch {
      setState({ status: "error", message: "Could not reach the analytics endpoint." });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(window);
  }, [load, window]);

  useEffect(() => {
    if (state.status === "unconfigured") return;
    const id = setInterval(() => load(windowRef.current, true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load, state.status]);

  const data = state.status === "ready" ? state.data : null;
  const ready = state.status === "ready";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Live traffic density from Google Analytics 4, refreshed every 30 seconds."
        action={
          <div className="flex items-center gap-2">
            <WindowPicker value={window} onChange={setWindow} disabled={!ready && state.status !== "loading"} />
            <button
              type="button"
              onClick={() => load(window)}
              disabled={refreshing || state.status === "unconfigured"}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ borderColor: "var(--line)", background: "#fff", color: "var(--body)" }}
              aria-label="Refresh traffic"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {state.status === "unconfigured" && <SetupNotice missing={state.missing} />}

      {state.status === "error" && (
        <div
          className="rounded-lg border p-5 text-[13px]"
          style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.04)", color: "#BE123C" }}
        >
          {state.message}
        </div>
      )}

      {state.status === "loading" && <PageLoader label="Loading…" />}

      {state.status !== "unconfigured" && state.status !== "loading" && (
        <>
          <TrafficStatCards data={data} />
          <TrafficDensityChart data={data} />
          <TodayTrafficChart data={data} />
          <LivePages data={data} />
          <TrafficSources data={data} />

          {data && (
            <p className="text-[11.5px] text-center" style={{ color: "var(--body)" }}>
              Last synced{" "}
              {new Date(data.fetchedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              })}{" "}
              · Google Analytics 4 realtime
            </p>
          )}
        </>
      )}
    </div>
  );
}
