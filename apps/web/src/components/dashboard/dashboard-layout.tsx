"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = useMemo(() => {
    if (!user) return [];
    const items: { label: string; href: string; active: boolean }[] = [
      { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
      { label: "My Profile", href: "/dashboard/profile", active: pathname === "/dashboard/profile" },
    ];
    if (user.accountType === "moderator" || user.accountType === "admin") {
      items.push({
        label: "Seminars",
        href: "/dashboard/seminars",
        active: pathname.startsWith("/dashboard/seminars"),
      });
    }
    if (user.accountType === "admin") {
      items.push({
        label: "Users",
        href: "/dashboard/admin",
        active: pathname === "/dashboard/admin",
      });
    }
    return items;
  }, [user, pathname]);

  const badgeStyle = useMemo(() => {
    switch (user?.accountType) {
      case "admin":
        return { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" };
      case "moderator":
        return { background: "rgba(47,95,224,0.12)", color: "#2F5FE0" };
      default:
        return { background: "var(--brand-soft)", color: "var(--brand)" };
    }
  }, [user?.accountType]);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-soft)" }}>
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[240px] border-r bg-white px-5 py-7"
        style={{ borderColor: "var(--line)" }}
      >
        <Link href="/" className="brand flex flex-col items-start leading-none mb-9 px-2">
          <Image src="/logo.png" alt="FlyBridge" width={113} height={38} className="w-auto h-[30px] object-contain" priority />
          <span className="font-mono text-[8.5px] tracking-[1.8px] mt-[3px]" style={{ color: "var(--body)" }}>
            EDUCATION GROUP
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] font-medium rounded-xl px-3.5 py-[10px] transition-all duration-200"
              style={
                item.active
                  ? { background: "var(--brand-soft)", color: "var(--brand)" }
                  : { color: "var(--body)" }
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/"
            className="text-[13px] font-medium px-3.5 py-2 rounded-xl hover:bg-soft"
            style={{ color: "var(--body)" }}
          >
            ← Back to website
          </Link>
          <button
            onClick={() => signOut()}
            className="text-[13px] font-medium px-3.5 py-2 rounded-xl text-left transition-colors hover:bg-soft"
            style={{ color: "#C0392B" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:pl-[240px]">
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/90 backdrop-blur px-[clamp(20px,4vw,40px)] py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="md:hidden">
            <Link href="/" className="font-display font-semibold text-[16px]" style={{ color: "var(--ink)" }}>
              FlyBridge
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
            Account dashboard
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-[36px] h-[36px] rounded-full" style={{ background: "var(--line)" }} />
            ) : (
              <>
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[6px]"
                  style={badgeStyle}
                >
                  {user ? user.accountType : "guest"}
                </span>
                {user && (
                  <div className="flex items-center gap-2.5">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-[36px] h-[36px] rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[12px] font-semibold text-white"
                        style={{ background: "var(--brand)" }}
                      >
                        {user.name ? initials(user.name) : "?"}
                      </div>
                    )}
                    <span className="hidden sm:block text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                      {user.name}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        <main className="px-[clamp(20px,4vw,40px)] py-8 max-w-[1100px]">{children}</main>
      </div>
    </div>
  );
}
