"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card } from "./card";
import { BRAND } from "./lib";

type Insight = { title: string; detail: string; severity: "positive" | "neutral" | "warning" };
type Insights = { summary: string; insights: Insight[] };

const SEVERITY: Record<Insight["severity"], { icon: typeof Info; bg: string; fg: string }> = {
  positive: { icon: TrendingUp, bg: "rgba(16,185,129,0.1)", fg: "#059669" },
  warning: { icon: AlertTriangle, bg: "rgba(245,158,11,0.12)", fg: "#B45309" },
  neutral: { icon: Info, bg: "rgba(110,76,255,0.1)", fg: BRAND },
};

export function AiInsights({ query, canGenerate }: { query: string; canGenerate: boolean }) {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usage/insights?${query}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not generate insights");
      setData(body as Insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="AI insights"
      subtitle="An AI read on how members are using the platform this period"
      action={
        data ? (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:border-[var(--brand)] disabled:opacity-50"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        ) : null
      }
    >
      {!data && !loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(110,76,255,0.1)" }}
          >
            <Sparkles size={22} style={{ color: BRAND }} />
          </div>
          <p className="text-[13px] max-w-[360px]" style={{ color: "var(--body)" }}>
            Generate a plain-English summary of usage for this period, including what is working and
            what needs attention.
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            <Sparkles size={15} />
            Generate insights
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 size={26} className="animate-spin" style={{ color: BRAND }} />
          <p className="text-[13px]" style={{ color: "var(--body)" }}>
            Reading the data…
          </p>
        </div>
      )}

      {error && !loading && (
        <p
          className="rounded-lg px-4 py-2.5 text-[13px] font-medium"
          style={{ background: "rgba(244,63,94,0.06)", color: "#BE123C" }}
        >
          {error}
        </p>
      )}

      {data && !loading && (
        <div className="flex flex-col gap-4">
          {data.summary && (
            <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink)" }}>
              {data.summary}
            </p>
          )}
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => {
              const style = SEVERITY[insight.severity] ?? SEVERITY.neutral;
              const Icon = style.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                      {insight.title}
                    </p>
                    <p
                      className="text-[12.5px] leading-relaxed mt-0.5"
                      style={{ color: "var(--body)" }}
                    >
                      {insight.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
