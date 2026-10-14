"use client";

import {
  Users,
  Activity,
  GraduationCap,
  BookOpen,
  Award,
  PlayCircle,
  ClipboardCheck,
  Target,
  FileCheck2,
  Gauge,
  CalendarCheck,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";
import { InlineLoader } from "@/components/dashboard/page-loader";
import type { AdminUsageAnalytics } from "@/lib/admin/overview-analytics-types";

type Card = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  caption?: string;
};

function MetricCard({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <div
      className="group relative rounded-lg border bg-white p-5 overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(16,24,40,0.28)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-150"
        style={{ background: card.gradient }}
      />
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4 transition-transform duration-250 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: card.gradient, boxShadow: `0 8px 18px -6px ${card.gradient}66` }}
      >
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <p
        className="font-display text-[26px] font-semibold leading-none"
        style={{ color: "var(--ink)" }}
      >
        {card.value}
      </p>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2"
        style={{ color: "var(--body)" }}
      >
        {card.label}
      </p>
      {card.caption && (
        <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
          {card.caption}
        </p>
      )}
    </div>
  );
}

function count(value: number) {
  return value.toLocaleString();
}

export function UsageMetrics({
  analytics,
  loading,
}: {
  analytics: AdminUsageAnalytics | null;
  loading?: boolean;
}) {
  if (!analytics || loading) {
    return <InlineLoader label="Loading metrics…" />;
  }

  const metrics = analytics.metrics;
  const pageViews = analytics.usageTrend.pageViews.reduce((total, value) => total + value, 0);

  const cards: Card[] = [
    {
      key: "activeMembers",
      label: "Active members",
      value: count(metrics.activeMembers),
      icon: Activity,
      gradient: "linear-gradient(135deg,#10B981,#34D399)",
      caption: `${metrics.engagementRate}% of all members active`,
    },
    {
      key: "lessonViews",
      label: "Lesson views",
      value: count(metrics.lessonViews),
      icon: PlayCircle,
      gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
      caption: "Lessons opened by members",
    },
    {
      key: "quizStarts",
      label: "Quizzes started",
      value: count(metrics.quizStarts),
      icon: Target,
      gradient: "linear-gradient(135deg,#06B6D4,#0EA5E9)",
      caption: "Quiz screens opened",
    },
    {
      key: "quizAttempts",
      label: "Quiz attempts",
      value: count(metrics.quizAttempts),
      icon: ClipboardCheck,
      gradient: "linear-gradient(135deg,#F59E0B,#F97316)",
      caption:
        metrics.quizAttempts > 0 ? `Avg score ${metrics.averageQuizScore}%` : "No attempts yet",
    },
    {
      key: "pageViews",
      label: "Page views",
      value: count(pageViews),
      icon: MousePointerClick,
      gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
      caption: "Tracked member page visits",
    },
    {
      key: "activeCourseMembers",
      label: "Active learners",
      value: count(metrics.activeCourseMembers),
      icon: GraduationCap,
      gradient: "linear-gradient(135deg,#7C3AED,#A855F7)",
      caption: "Progressed in a course",
    },
    {
      key: "courseEnrollments",
      label: "Course enrollments",
      value: count(metrics.courseEnrollments),
      icon: BookOpen,
      gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
      caption: "Enrollments in this period",
    },
    {
      key: "courseCompletions",
      label: "Course completions",
      value: count(metrics.courseCompletions),
      icon: Award,
      gradient: "linear-gradient(135deg,#7C3AED,#A855F7)",
      caption: "Passed in this period",
    },
    {
      key: "mockTestAttempts",
      label: "Mock tests",
      value: count(metrics.mockTestAttempts),
      icon: FileCheck2,
      gradient: "linear-gradient(135deg,#8B5CF6,#6E4CFF)",
      caption: "Attempts in this period",
    },
    {
      key: "readinessChecks",
      label: "Readiness checks",
      value: count(metrics.readinessChecks),
      icon: Gauge,
      gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
      caption: "Study abroad assessments",
    },
    {
      key: "seminarRegistrations",
      label: "Seminar signups",
      value: count(metrics.seminarRegistrations),
      icon: CalendarCheck,
      gradient: "linear-gradient(135deg,#0284C7,#06B6D4)",
      caption: "Event registrations",
    },
    {
      key: "totalMembers",
      label: "Total members",
      value: count(metrics.totalMembers),
      icon: Users,
      gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
      caption: "All registered accounts",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.key} card={card} />
      ))}
    </div>
  );
}
