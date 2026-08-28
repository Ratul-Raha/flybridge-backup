"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  FolderOpen,
  FileText,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar } from "@/components/dashboard/avatar";
import { DashboardHome } from "./dashboard-home";
import { AllSeminars } from "./all-seminars";
import { MySeminars } from "./my-seminars";
import { AllCourses } from "./all-courses";
import { MyCourses } from "./my-courses";
import { ResourceBrowser } from "./resource-browser";
import { ScholarshipBrowser } from "./scholarship-browser";
import { SopGenerator } from "./sop-generator";
import { MobileSettings } from "./mobile-settings";
import { SectionTabs, type SectionParent } from "./section-tabs";

type TabId = "dashboard" | "seminars" | "courses" | "resources" | "scholarships" | "sop" | "settings";

const TABS: { id: TabId; label: string; icon: LucideIcon; href: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "seminars", label: "Seminars", icon: CalendarDays, href: "/dashboard/seminars" },
  { id: "courses", label: "Courses", icon: BookOpen, href: "/dashboard/courses" },
  { id: "resources", label: "Resources", icon: FolderOpen, href: "/dashboard/resources" },
  { id: "sop", label: "SOP", icon: FileText, href: "/dashboard/sop-generator" },
  { id: "settings", label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" },
];

function tabFromPath(pathname: string): TabId {
  if (pathname.startsWith("/dashboard/seminars")) return "seminars";
  if (pathname.startsWith("/dashboard/courses")) return "courses";
  if (pathname.startsWith("/dashboard/resources")) return "resources";
  if (pathname.startsWith("/dashboard/scholarships")) return "scholarships";
  if (pathname.startsWith("/dashboard/sop-generator")) return "sop";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "dashboard";
}

function subFromPath(pathname: string, tab: TabId): "all" | "mine" | null {
  if (tab !== "seminars" && tab !== "courses" && tab !== "resources") return null;
  return pathname.endsWith("/mine") ? "mine" : "all";
}

export function MobileUserApp() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const tab = tabFromPath(pathname);
  const sub = subFromPath(pathname, tab);

  const subParent: SectionParent | null =
    tab === "seminars" || tab === "courses" || tab === "resources" ? tab : null;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* App bar */}
      <header
        className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between h-14 px-5">
          <Link href="/dashboard" className="brand flex flex-col items-start leading-none">
            <Image
              src="/transparent-logo-dark.png"
              alt="FlyBridge Education Group"
              width={113}
              height={38}
              className="w-auto h-[30px] shrink-0 object-contain"
              priority
            />
          </Link>
          <Link href="/dashboard/settings" aria-label="Settings">
            <Avatar name={user.name} src={user.avatar} size={32} />
          </Link>
        </div>
      </header>

      {/* Screen content */}
      <main className="flex-1 px-5 pt-5 pb-28">
        {tab === "dashboard" && <DashboardHome />}

        {subParent && tab !== "resources" && (
          <div className="mb-6">
            <SectionTabs parent={subParent} active={sub ?? "all"} />
          </div>
        )}

        {tab === "seminars" && (sub === "mine" ? <MySeminars /> : <AllSeminars />)}
        {tab === "courses" && (sub === "mine" ? <MyCourses /> : <AllCourses />)}
        {tab === "resources" &&
          (sub === "mine" ? (
            <ResourceBrowser mobile initialSection="mine" />
          ) : (
            <ResourceBrowser mobile />
          ))}
        {tab === "scholarships" && <ScholarshipBrowser />}
        {tab === "sop" && <SopGenerator mobile />}
        {tab === "settings" && <MobileSettings />}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur"
        style={{ borderColor: "var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Link
                key={t.id}
                href={t.href}
                className="flex flex-col items-center gap-1 py-2.5"
                style={active ? { color: "var(--brand)" } : { color: "var(--body)" }}
              >
                <span
                  className="flex items-center justify-center rounded-full px-4 py-1 transition-colors duration-200"
                  style={active ? { background: "var(--brand-soft)" } : undefined}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
