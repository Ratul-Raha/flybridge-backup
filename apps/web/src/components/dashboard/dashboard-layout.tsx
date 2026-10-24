"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
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
  Gauge,
  ShoppingCart,
  Loader2,
  Award,
  Bot,
  Activity,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useIsMobile } from "@/hooks/use-media-query";
import { Avatar } from "@/components/dashboard/avatar";
import { CurrencyProvider, CurrencySelector } from "@/components/dashboard/currency-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PushEnabler } from "@/components/notifications/push-enabler";
import { MobileUserApp } from "@/components/dashboard/user/mobile-user-app";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { PendingOrderBanner } from "@/components/payment/pending-order-banner";
import { UsageTracker } from "@/components/dashboard/usage-tracker";
import type { UserDashboardData } from "@/lib/dashboard/user";

const OpsBotWidget = dynamic(
  () => import("@/components/ops-bot/ops-bot-widget").then((m) => m.OpsBotWidget),
  { ssr: false }
);

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

export function DashboardLayout({
  children,
  dashboardInitial = null,
}: {
  children: ReactNode;
  dashboardInitial?: UserDashboardData | null;
}) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [signingOut, setSigningOut] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      setIsAffiliate(false);
      return;
    }
    let active = true;
    fetch("/api/affiliate/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setIsAffiliate(Boolean(data?.affiliate));
      })
      .catch(() => {
        if (active) setIsAffiliate(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setAvatarMenuOpen(false);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  const nav = useMemo<NavSegment[]>(() => {
    if (!user) return [];

    const settingsChildren: { label: string; href: string; active: boolean }[] = [
      {
        label: "Profile Settings",
        href: "/dashboard/settings",
        active: pathname === "/dashboard/settings",
      },
    ];
    if (user.accountType === "admin") {
      settingsChildren.push({
        label: "Payment Settings",
        href: "/dashboard/settings/payments",
        active: pathname.startsWith("/dashboard/settings/payments"),
      });
      settingsChildren.push({
        label: "AI Provider",
        href: "/dashboard/settings/ai",
        active: pathname.startsWith("/dashboard/settings/ai"),
      });
    }
    const settingsGroup: NavGroup = {
      kind: "group",
      label: "Settings",
      icon: SettingsIcon,
      children: settingsChildren,
    };

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
                {
                  label: "All seminars",
                  href: "/dashboard/seminars",
                  active: pathname === "/dashboard/seminars",
                },
                {
                  label: "My seminars",
                  href: "/dashboard/seminars/mine",
                  active: pathname === "/dashboard/seminars/mine",
                },
              ],
            },
            {
              kind: "group",
              label: "Courses",
              icon: BookOpen,
              children: [
                {
                  label: "All courses",
                  href: "/dashboard/courses",
                  active: pathname === "/dashboard/courses",
                },
                {
                  label: "My courses",
                  href: "/dashboard/courses/mine",
                  active: pathname === "/dashboard/courses/mine",
                },
              ],
            },
            {
              kind: "link",
              label: "Mock Exams",
              href: "/dashboard/my-mock-tests",
              icon: ListChecks,
              active: pathname.startsWith("/dashboard/my-mock-tests"),
            },
            {
              kind: "group",
              label: "Resources",
              icon: FolderOpen,
              children: [
                {
                  label: "All resources",
                  href: "/dashboard/resources",
                  active: pathname === "/dashboard/resources",
                },
                {
                  label: "My resources",
                  href: "/dashboard/resources/mine",
                  active: pathname === "/dashboard/resources/mine",
                },
              ],
            },
            {
              kind: "group",
              label: "Scholarships",
              icon: Award,
              children: [
                {
                  label: "All scholarships",
                  href: "/dashboard/scholarships",
                  active: pathname === "/dashboard/scholarships",
                },
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
            {
              kind: "link",
              label: "Readiness Score",
              href: "/dashboard/readiness",
              icon: Gauge,
              active: pathname.startsWith("/dashboard/readiness"),
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
              label: "My Orders",
              href: "/dashboard/orders",
              icon: ShoppingCart,
              active: pathname.startsWith("/dashboard/orders"),
            },
            ...(isAffiliate
              ? [
                  {
                    kind: "link" as const,
                    label: "Affiliate",
                    href: "/dashboard/affiliate",
                    icon: Share2,
                    active: pathname.startsWith("/dashboard/affiliate"),
                  },
                ]
              : []),
            settingsGroup,
          ],
        },
      ] satisfies NavSegment[];
    }

    const segments: NavSegment[] = [
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
    ];
    if (user.accountType === "moderator" || user.accountType === "admin") {
      segments.push({
        title: "Workspace",
        items: [
          {
            kind: "group",
            label: "Content",
            icon: FolderOpen,
            children: [
              {
                label: "Seminars",
                href: "/dashboard/seminars",
                active: pathname.startsWith("/dashboard/seminars"),
              },
              {
                label: "Courses",
                href: "/dashboard/courses",
                active: pathname.startsWith("/dashboard/courses"),
              },
              {
                label: "Resources",
                href: "/dashboard/resources",
                active: pathname.startsWith("/dashboard/resources"),
              },
              {
                label: "Mock Tests",
                href: "/dashboard/mock-tests",
                active: pathname.startsWith("/dashboard/mock-tests"),
              },
              {
                label: "Blogs",
                href: "/dashboard/blogs",
                active: pathname.startsWith("/dashboard/blogs"),
              },
              {
                label: "Success Stories",
                href: "/dashboard/success-stories",
                active: pathname.startsWith("/dashboard/success-stories"),
              },
              {
                label: "Scholarships",
                href: "/dashboard/scholarships",
                active: pathname.startsWith("/dashboard/scholarships"),
              },
            ],
          },
          {
            kind: "link",
            label: "SOP Generator",
            href: "/dashboard/sop-generator",
            icon: FileText,
            active: pathname.startsWith("/dashboard/sop-generator"),
          },
        ],
      });
    }
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
          settingsGroup,
        ],
      });
    }
    if (user.accountType === "admin") {
      segments.push({
        title: "Administration",
        items: [
          {
            kind: "link",
            label: "Overview",
            href: "/dashboard/admin",
            icon: LayoutDashboard,
            active: pathname === "/dashboard/admin",
          },
          {
            kind: "link",
            label: "Usage Analytics",
            href: "/dashboard/admin/usage",
            icon: Activity,
            active: pathname.startsWith("/dashboard/admin/usage"),
          },
          {
            kind: "group",
            label: "People",
            icon: Users,
            children: [
              {
                label: "Users",
                href: "/dashboard/admin/users",
                active: pathname.startsWith("/dashboard/admin/users"),
              },
              {
                label: "Roles & Permissions",
                href: "/dashboard/admin/roles",
                active: pathname.startsWith("/dashboard/admin/roles"),
              },
            ],
          },
          {
            kind: "group",
            label: "Sales",
            icon: ShoppingCart,
            children: [
              {
                label: "Orders",
                href: "/dashboard/admin/orders",
                active: pathname.startsWith("/dashboard/admin/orders"),
              },
              {
                label: "Coupons",
                href: "/dashboard/admin/discounts",
                active: pathname.startsWith("/dashboard/admin/discounts"),
              },
              {
                label: "Refunds",
                href: "/dashboard/admin/refunds",
                active: pathname.startsWith("/dashboard/admin/refunds"),
              },
              {
                label: "Affiliates",
                href: "/dashboard/admin/affiliates",
                active: pathname.startsWith("/dashboard/admin/affiliates"),
              },
              {
                label: "Growth & Sales",
                href: "/dashboard/admin/analytics",
                active: pathname.startsWith("/dashboard/admin/analytics"),
              },
            ],
          },
          {
            kind: "group",
            label: "Operations",
            icon: Workflow,
            children: [
              {
                label: "Readiness",
                href: "/dashboard/admin/readiness",
                active: pathname.startsWith("/dashboard/admin/readiness"),
              },
              {
                label: "Automation",
                href: "/dashboard/admin/automations",
                active: pathname.startsWith("/dashboard/admin/automations"),
              },
              {
                label: "Email Templates",
                href: "/dashboard/admin/email-templates",
                active: pathname.startsWith("/dashboard/admin/email-templates"),
              },
              {
                label: "Traffic Sources",
                href: "/dashboard/admin/email-clicks",
                active: pathname.startsWith("/dashboard/admin/email-clicks"),
              },
              {
                label: "Resource Traffic",
                href: "/dashboard/admin/resource-clicks",
                active: pathname.startsWith("/dashboard/admin/resource-clicks"),
              },
              {
                label: "Event Log",
                href: "/dashboard/admin/events",
                active: pathname.startsWith("/dashboard/admin/events"),
              },
            ],
          },
          {
            kind: "group",
            label: "AI & Bots",
            icon: Bot,
            children: [
              {
                label: "Ops Bot",
                href: "/dashboard/admin/ops-bot",
                active: pathname.startsWith("/dashboard/admin/ops-bot"),
              },
              {
                label: "Bot Config",
                href: "/dashboard/admin/bot-config",
                active: pathname.startsWith("/dashboard/admin/bot-config"),
              },
            ],
          },
        ],
      });
    }
    return segments;
  }, [user, pathname, isAffiliate]);

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

  // Full-screen course experiences (lesson player, certificate) have their own
  // mobile layout, so they must not be swallowed by the mobile app shell.
  const isFullScreenCourse = /^(\/dashboard\/courses\/[^/]+\/(learn|certificate)|\/dashboard\/mock-tests\/[^/]+\/take)/.test(pathname);

  if (isMobile && user?.accountType === "user" && !isFullScreenCourse) {
    return (
      <MobileUserApp initial={dashboardInitial}>
        <UsageTracker />
        {children}
      </MobileUserApp>
    );
  }

  // The mock-test player runs as its own full-screen, proctored experience,
  // so it must not be wrapped by the dashboard sidebar/header.
  const isTakePlayer = /^\/dashboard\/mock-tests\/[^/]+\/take(\/.*)?$/.test(pathname);
  if (isTakePlayer) {
    return <div className="min-h-screen" style={{ background: "var(--bg)" }}>{children}</div>;
  }

  const toggleGroup = (label: string, openByDefault: boolean) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? openByDefault) }));

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
            <span
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--brand)" }}
            />
          )}
        </Link>
      );
    }

    const Icon = item.icon;
    const hasActiveChild = item.children.some((child) => child.active);
    const open = openGroups[item.label] ?? hasActiveChild;
    const active = open || hasActiveChild;
    return (
      <div key={item.label} className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(item.label, open)}
          aria-expanded={open}
          className="flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[13.5px] font-medium transition-all duration-200"
          style={
            active
              ? { background: "var(--brand-soft)", color: "var(--brand)" }
              : { color: "var(--body)" }
          }
        >
          <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
          {item.label}
          {open ? (
            <ChevronDown size={14} className="ml-auto" />
          ) : (
            <ChevronRight size={14} className="ml-auto" />
          )}
        </button>
        {open && (
          <div
            className="flex flex-col gap-0.5 ml-[22px] border-l pl-3"
            style={{ borderColor: "var(--line)" }}
          >
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
                  <span
                    className="ml-auto inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--brand)" }}
                  />
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
            src="/transparent-logo-dark.png"
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

      <div className="mt-auto" />
    </>
  );

  return (
    <CurrencyProvider>
      <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[264px] border-r bg-white z-30 overflow-y-auto"
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
        className={`fixed inset-y-0 left-0 z-50 lg:hidden w-[280px] bg-white flex flex-col overflow-y-auto transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "16px 0 40px -20px rgba(18,32,67,0.25)" }}
      >
        <button
          className="absolute top-5 right-5 p-1.5 rounded-lg z-10"
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
              <InlineLoader />
            ) : (
              user && (
                <div className="flex items-center gap-3">
                  {user?.accountType === "admin" && <CurrencySelector />}
                  {user && <NotificationBell />}
                  {user && <PushEnabler />}
                  <div className="relative" ref={avatarMenuRef}>
                    <button
                      type="button"
                      onClick={() => setAvatarMenuOpen((o) => !o)}
                      className="block rounded-full border-2 transition-colors duration-200"
                      style={{ borderColor: avatarMenuOpen ? "var(--brand)" : "var(--line)" }}
                    >
                      <Avatar name={user.name} src={user.avatar} size={36} />
                    </button>

                    {avatarMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-white py-1.5 z-50"
                        style={{
                          borderColor: "var(--line)",
                          boxShadow: "0 8px 24px -4px rgba(18,32,67,0.12)",
                        }}
                      >
                        <div
                          className="px-4 py-3"
                          style={{ borderBottom: "1px solid var(--line)" }}
                        >
                          <p
                            className="text-[13px] font-semibold truncate"
                            style={{ color: "var(--ink)" }}
                          >
                            {user.name}
                          </p>
                          <p
                            className="text-[11.5px] truncate mt-0.5"
                            style={{ color: "var(--body)" }}
                          >
                            {user.email}
                          </p>
                          <span
                            className="inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[3px] mt-2"
                            style={{ background: roleStyle.bg, color: roleStyle.fg }}
                          >
                            {roleStyle.label}
                          </span>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setAvatarMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
                            style={{ color: "var(--ink)" }}
                          >
                            <SettingsIcon size={15} style={{ color: "var(--body)" }} />
                            Profile Settings
                          </Link>
                          <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-50"
                            style={{ color: "#C0392B" }}
                          >
                            {signingOut ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <LogOut size={15} />
                            )}
                            {signingOut ? "Signing out…" : "Sign out"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </header>

        <main className="px-[clamp(20px,4vw,40px)] py-8">
          <PendingOrderBanner />
          <UsageTracker />
          {children}
        </main>
      </div>

      {user?.accountType === "admin" && <OpsBotWidget />}
      </div>
    </CurrencyProvider>
  );
}
