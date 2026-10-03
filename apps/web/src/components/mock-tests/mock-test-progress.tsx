"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EChartsOption } from "echarts";
import { ArrowRight, History, Loader2, TrendingUp, Trophy } from "lucide-react";
import { Chart } from "@/components/dashboard/reports/echart";
import { SKILL_META, type MockTestSkill, type MyAttempt } from "@/lib/mock-test-ui";

const LINE = "#0FA968";
const TARGET = "#2F5FE0";

const AXIS_LABEL = "#A6ADC0";
const SPLIT_LINE = "#F1F3F8";
const TOOLTIP = {
  backgroundColor: "#fff",
  borderColor: "#EEF0F6",
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: "#12162A", fontSize: 12.5 },
  extraCssText: "box-shadow:0 12px 30px -12px rgba(18,22,42,0.25);border-radius:12px;",
};

type SkillFilter = "all" | MockTestSkill;

function fmtDate(v: string | null): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function skillMeta(skill: string) {
  return SKILL_META[(skill as MockTestSkill) ?? "reading"] ?? SKILL_META.reading;
}

export function MockTestProgress() {
  const [attempts, setAttempts] = useState<MyAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<SkillFilter>("all");

  useEffect(() => {
    fetch("/api/mock-tests/my-attempts", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setAttempts(Array.isArray(res.attempts) ? res.attempts : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      skill === "all" ? attempts : attempts.filter((a) => a.skill === skill),
    [attempts, skill]
  );

  const stats = useMemo(() => {
    const bands = filtered
      .map((a) => a.overallBand)
      .filter((b): b is number => typeof b === "number" && b > 0);
    const best = bands.length ? Math.max(...bands) : null;
    const avg = bands.length
      ? (Math.round((bands.reduce((s, b) => s + b, 0) / bands.length) * 2) / 2)
      : null;
    const first = filtered.find((a) => typeof a.overallBand === "number" && a.overallBand > 0);
    const last = [...filtered]
      .reverse()
      .find((a) => typeof a.overallBand === "number" && a.overallBand > 0);
    const improvement =
      first && last && typeof first.overallBand === "number" && typeof last.overallBand === "number"
        ? Math.round((last.overallBand - first.overallBand) * 2) / 2
        : null;
    return { best, avg, improvement };
  }, [filtered]);

  const option = useMemo<EChartsOption>(() => {
    const labels = filtered.map((_, i) => `#${i + 1}`);
    const bands = filtered.map((a) => a.overallBand ?? 0);
    const showSymbol = filtered.length <= 8;

    return {
      grid: { left: 8, right: 12, top: 34, bottom: 8, containLabel: true },
      tooltip: {
        ...TOOLTIP,
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as { dataIndex: number }[])[0];
          if (!p) return "";
          const a = filtered[p.dataIndex];
          if (!a) return "";
          return [
            `<b>${a.title}</b>`,
            `<span style="opacity:.65">${skillMeta(a.skill).label}</span>`,
            `<b style="font-size:16px">${a.overallBand != null ? a.overallBand.toFixed(1) : "—"}</b> band`,
            fmtDate(a.submittedAt),
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 9,
        interval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5, formatter: "{value}" },
      },
      series: [
        {
          name: "Band",
          type: "line",
          smooth: true,
          data: bands,
          symbol: "circle",
          symbolSize: 8,
          showSymbol,
          lineStyle: { color: LINE, width: 2.5 },
          itemStyle: { color: LINE, borderColor: "#fff", borderWidth: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(15,169,104,0.24)" },
                { offset: 1, color: "rgba(15,169,104,0.01)" },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: TARGET, type: "dashed", width: 1.5 },
            label: {
              formatter: "Target 7",
              color: TARGET,
              fontSize: 10.5,
              fontWeight: 600,
              position: "insideEndTop",
            },
            data: [{ yAxis: 7 }],
          },
        },
      ],
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[13px]" style={{ color: "var(--body)" }}>
        <Loader2 size={15} className="animate-spin" /> Loading your progress…
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div
        className="rounded-xl border px-6 py-10 text-center flex flex-col items-center gap-3"
        style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
      >
        <History className="w-6 h-6" style={{ color: "var(--body)" }} />
        <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
          No attempts yet
        </p>
        <p className="text-[13px] max-w-[420px]" style={{ color: "var(--body)" }}>
          Sit your first mock exam and your band scores will start tracking here, with a chart of
          your progress over time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Skill filter + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "reading", "listening", "writing", "speaking"] as SkillFilter[]).map((s) => {
            const active = skill === s;
            const label = s === "all" ? "All skills" : skillMeta(s).label;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSkill(s)}
                className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors"
                style={
                  active
                    ? { background: "var(--brand)", color: "#fff" }
                    : { background: "var(--bg-soft)", color: "var(--body)", border: "1px solid var(--line)" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "var(--body)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Trophy size={14} style={{ color: "#E08A17" }} />
            Best {stats.best != null ? stats.best.toFixed(1) : "—"}
          </span>
          {stats.improvement != null && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5"
              style={{
                background: stats.improvement > 0 ? "rgba(15,169,104,0.10)" : "rgba(192,57,43,0.08)",
                color: stats.improvement > 0 ? "#0FA968" : "#C0392B",
              }}
            >
              <TrendingUp size={13} />
              {stats.improvement > 0 ? "+" : ""}
              {stats.improvement.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              Band score progress
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
              {filtered.length} attempt{filtered.length === 1 ? "" : "s"}
              {stats.avg != null ? ` · average ${stats.avg.toFixed(1)}` : ""}
            </p>
          </div>
        </div>
        <Chart option={option} height={260} />
      </div>

      {/* Attempt history */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--line)" }}>
          <h3 className="font-display text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            Attempt history
          </h3>
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            most recent first
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {[...filtered].reverse().map((a) => {
            const meta = skillMeta(a.skill);
            return (
              <Link
                key={a.id}
                href={`/dashboard/mock-tests/${a.testId}/take?attempt=${a.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-soft)]"
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ background: meta.soft, color: meta.accent }}
                >
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {a.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--body)" }}>
                    {fmtDate(a.submittedAt)}
                  </p>
                </div>
                <span
                  className="shrink-0 font-display text-[17px] font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  {a.overallBand != null ? a.overallBand.toFixed(1) : "—"}
                </span>
                <ArrowRight size={15} className="shrink-0" style={{ color: "var(--body)" }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
