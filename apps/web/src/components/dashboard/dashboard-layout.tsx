"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  UserCircle2,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar } from "@/components/dashboard/avatar";

const ROLE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  admin: { bg: "rgba(111,76,224,0.12)", fg: "#6B4CE0", label: "Administrator" },
  moderator: { bg: "rgba(47,95,224,0.12)", fg: "#2F5FE0", label: "Moderator" },
  user: { bg: "var(--brand-soft)", fg: "var(--brand)", label: "Member" },
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = useMemo(() => {
    if (!user) return [];
    const items: { label: string; href: string; icon: typeof LayoutDashboard; active: boolean }[] = [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: pathname === "/dashboard" },
      { label: "My Profile", href: "/dashboard/profile", icon: UserCircle2, active: pathname === "/dashboard/profile" },
    ];
    if (user.accountType === "moderator" || user.accountType === "admin") {
      items.push({
        label: "Seminars",
        href: "/dashboard/seminars",
        icon: CalendarDays,
        active: pathname.startsWith("/dashboard/seminars"),
      });
    }
    if (user.accountType === "admin") {
      items.push({
        label: "Users",
        href: "/dashboard/admin",
        icon: Users,
        active: pathname === "/dashboard/admin",
      });
    }
    return items;
  }, [user, pathname]);

  const pageTitle = useMemo(() => {
    const active = nav.find((n) => n.active);
    return active?.label ?? "Dashboard";
  }, [nav]);

  const roleStyle = ROLE_STYLES[user?.accountType ?? "user"] ?? ROLE_STYLES.user;

  const sidebarContent = (
    <>
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="brand flex flex-col items-start leading-none">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white"
              style={{ background: "var(--brand)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 17L10 10L14 14L21 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display text-[18px] font-bold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
              FlyBridge
            </span>
          </div>
          <span className="font-mono text-[8.5px] tracking-[1.8px] mt-[3px] ml-[42px]" style={{ color: "var(--body)" }}>
            EDUCATION GROUP
          </span>
        </Link>
      </div>

      <div className="px-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-3 mb-2" style={{ color: "#A6ADC0" }}>
          Menu
        </p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
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
          })}
        </nav>
      </div>

      <div className="mt-auto px-4 pb-6">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border bg-white py-[9px] text-[13px] font-medium transition-colors duration-200 hover:border-[#F3CBC7] hover:bg-[#FDF1F0] hover:text-[#C0392B]"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          <LogOut size={15} strokeWidth={2} /> Sign out
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
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[6px] hidden sm:block"
                    style={{ background: roleStyle.bg, color: roleStyle.fg }}
                  >
                    {user.accountType}
                  </span>
                  <Link href="/dashboard/profile" aria-label="My profile">
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