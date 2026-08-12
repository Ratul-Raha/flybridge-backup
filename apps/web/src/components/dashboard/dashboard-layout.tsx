"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  FolderOpen,
  FileText,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Workflow,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useIsMobile } from "@/hooks/use-media-query";
import { Avatar } from "@/components/dashboard/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MobileUserApp } from "@/components/dashboard/user/mobile-user-app";

const ROLE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  admin: { bg: "rgba(111,76,224,0.12)", fg: "#6B4CE0", label: "Administrator" },
  moderator: { bg: "rgba(47,95,224,0.12)", fg: "#2F5FE0", label: "Moderator" },
  user: { bg: "var(--brand-soft)", fg: "var(--brand)", label: "Member" },
};

type NavLink = {
  kind: "link";
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

type NavGroup = {
  kind: "group";
  label: string;
  icon: LucideIcon;
  children: { label: string; href: string; active: boolean }[];
};

type NavItem = NavLink | NavGroup;

type NavSegment = { title: string; items: NavItem[] };

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();

  const nav = useMemo<NavSegment[]>(() => {
    if (!user) return [];
    if (user.accountType === "user") {
      return [
        {
          title: "Overview",
          items: [
            {
              kind: "link",
              label: "Dashboard",
              href: "/dashboard",
              icon: LayoutDashboard,
              active: pathname === "/dashboard",
            },
          ],
        },
        {
          title: "Learning",
          items: [
            {
              kind: "group",
              label: "Seminars",
              icon: CalendarDays,
              children: [
                { label: "All seminars", href: "/dashboard/seminars", active: pathname === "/dashboard/seminars" },
                { label: "My seminars", href: "/dashboard/seminars/mine", active: pathname === "/dashboard/seminars/mine" },
              ],
            },
            {
              kind: "group",
              label: "Courses",
              icon: BookOpen,
              children: [
                { label: "All courses", href: "/dashboard/courses", active: pathname === "/dashboard/courses" },
                { label: "My courses", href: "/dashboard/courses/mine", active: pathname === "/dashboard/courses/mine" },
              ],
            },
            {
              kind: "group",
              label: "Resources",
              icon: FolderOpen,
              children: [
                { label: "All resources", href: "/dashboard/resources", active: pathname === "/dashboard/resources" },
                { label: "My resources", href: "/dashboard/resources/mine", active: pathname === "/dashboard/resources/mine" },
              ],
            },
          ],
        },
        {
          title: "Tools",
          items: [
            {
              kind: "link",
              label: "SOP Generator",
              href: "/dashboard/sop-generator",
              icon: FileText,
              active: pathname === "/dashboard/sop-generator",
            },
          ],
        },
        {
          title: "Account",
          items: [
            {
              kind: "link",
              label: "Notifications",
              href: "/dashboard/notifications",
              icon: Bell,
              active: pathname.startsWith("/dashboard/notifications"),
            },
            {
              kind: "link",
              label: "Settings",
              href: "/dashboard/settings",
              icon: SettingsIcon,
              active: pathname === "/dashboard/settings",
            },
          ],
        },
      ] satisfies NavSegment[];
    }

    const segments: NavSegment[] = [
      {
        title: "Overview",
        items: [
          { kind: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: pathname === "/dashboard" },
        ],
      },
    ];
    if (user.accountType === "moderator" || user.accountType === "admin") {
      segments.push({
        title: "Content",
        items: [
          {
            kind: "link",
            label: "Seminars",
            href: "/dashboard/seminars",
            icon: CalendarDays,
            active: pathname.startsWith("/dashboard/seminars"),
          },
          {
            kind: "link",
            label: "Resources",
            href: "/dashboard/resources",
            icon: FolderOpen,
            active: pathname.startsWith("/dashboard/resources"),
          },
        ],
      });
    }
    segments.push({
      title: "Tools",
      items: [
        {
          kind: "link",
          label: "SOP Generator",
          href: "/dashboard/sop-generator",
          icon: FileText,
          active: pathname.startsWith("/dashboard/sop-generator"),
        },
      ],
    });
    if (user.accountType === "moderator" || user.accountType === "admin") {
      segments.push({
        title: "Account",
        items: [
          {
            kind: "link",
            label: "Notifications",
            href: "/dashboard/notifications",
            icon: Bell,
            active: pathname.startsWith("/dashboard/notifications"),
          },
          {
            kind: "link",
            label: "Settings",
            href: "/dashboard/settings",
            icon: SettingsIcon,
            active: pathname === "/dashboard/settings",
          },
        ],
      });
    }
    if (user.accountType === "admin") {
      segments.push({
        title: "Administration",
        items: [
          {
            kind: "link",
            label: "Users",
            href: "/dashboard/admin",
            icon: Users,
            active: pathname === "/dashboard/admin",
          },
          {
            kind: "link",
            label: "Automation",
            href: "/dashboard/admin/automations",
            icon: Workflow,
            active: pathname.startsWith("/dashboard/admin/automations"),
          },
          {
            kind: "link",
            label: "Event Log",
            href: "/dashboard/admin/events",
            icon: ListChecks,
            active: pathname.startsWith("/dashboard/admin/events"),
          },
        ],
      });
    }
    return segments;
  }, [user, pathname]);

  const pageTitle = useMemo(() => {
    for (const segment of nav) {
      for (const item of segment.items) {
        if (item.kind === "link" && item.active) return item.label;
        if (item.kind === "group") {
          const child = item.children.find((c) => c.active);
          if (child) return child.label;
        }
      }
    }
    return "Dashboard";
  }, [nav]);

  const roleStyle = ROLE_STYLES[user?.accountType ?? "user"] ?? ROLE_STYLES.user;

  if (isMobile && user?.accountType === "user") {
    return <MobileUserApp />;
  }

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? false) }));

  const renderItem = (item: NavItem) => {
    if (item.kind === "link") {
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[13.5px] font-medium transition-all duration-200"
          style={
            item.active
              ? { background: "var(--brand-soft)", color: "var(--brand)" }
              : { color: "var(--body)" }
          }
        >
          <Icon size={17} strokeWidth={item.active ? 2.2 : 1.8} />
          {item.label}
          {item.active && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
          )}
        </Link>
      );
    }

    const Icon = item.icon;
    const open = openGroups[item.label] ?? item.children.some((c) => c.active);
    return (
      <div key={item.label} className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(item.label)}
          className="flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[13.5px] font-medium transition-all duration-200"
          style={
            open ? { background: "var(--brand-soft)", color: "var(--brand)" } : { color: "var(--body)" }
          }
        >
          <Icon size={17} strokeWidth={open ? 2.2 : 1.8} />
          {item.label}
          {open ? (
            <ChevronDown size={14} className="ml-auto" />
          ) : (
            <ChevronRight size={14} className="ml-auto" />
          )}
        </button>
        {open && (
          <div className="flex flex-col gap-0.5 ml-[22px] border-l pl-3" style={{ borderColor: "var(--line)" }}>
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-[8px] text-[13px] font-medium transition-all duration-200"
                style={
                  child.active
                    ? { background: "var(--brand-soft)", color: "var(--brand)" }
                    : { color: "var(--body)" }
                }
              >
                {child.label}
                {child.active && (
                  <span className="ml-auto inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="brand flex flex-col items-start leading-none">
          <Image
            src="/logo-light.png"
            alt="FlyBridge Education Group"
            width={113}
            height={38}
            className="w-auto h-[34px] shrink-0 object-contain"
            priority
          />
        </Link>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {nav.map((segment) => (
          <section key={segment.title}>
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-3 mb-2"
              style={{ color: "#A6ADC0" }}
            >
              {segment.title}
            </p>
            <nav className="flex flex-col gap-1">{segment.items.map(renderItem)}</nav>
          </section>
        ))}
      </div>

      <div className="mt-auto px-4 pb-6">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FDF1F0] px-3.5 py-[11px] text-[13.5px] font-semibold text-[#C0392B] transition-all duration-200 hover:bg-[#C0392B] hover:text-white hover:shadow-lg hover:shadow-[#C0392B]/25 active:scale-[0.98]"
        >
          <LogOut size={15} strokeWidth={2.2} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[264px] border-r bg-white z-30"
        style={{ borderColor: "var(--line)" }}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:hidden w-[280px] bg-white flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "16px 0 40px -20px rgba(18,32,67,0.25)" }}
      >
        <button
          className="absolute top-5 right-5 p-1.5 rounded-lg"
          style={{ color: "var(--body)" }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      <div className="flex-1 lg:pl-[264px] min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/90 backdrop-blur px-[clamp(20px,4vw,40px)] h-16"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg"
              style={{ color: "var(--ink)" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-[13.5px]">
              <span className="hidden sm:block" style={{ color: "var(--body)" }}>
                Dashboard
              </span>
              <ChevronRight size={14} className="hidden sm:block" style={{ color: "#A6ADC0" }} />
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-9 h-9 rounded-full" style={{ background: "var(--line)" }} />
            ) : (
              user && (
                <div className="flex items-center gap-3">
                  {user && <NotificationBell />}
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[6px] hidden sm:block"
                    style={{ background: roleStyle.bg, color: roleStyle.fg }}
                  >
                    {user.accountType}
                  </span>
                  <Link href="/dashboard/settings" aria-label="Settings">
                    <span className="block rounded-full border-2" style={{ borderColor: "var(--line)" }}>
                      <Avatar name={user.name} src={user.avatar} size={36} />
                    </span>
                  </Link>
                </div>
              )
            )}
          </div>
        </header>

        <main className="px-[clamp(20px,4vw,40px)] py-8">{children}</main>
      </div>
    </div>
  );
}
