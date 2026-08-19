"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Eye,
  Gauge,
  Loader2,
  Mail,
  Phone,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";
import { useAuth } from "@/lib/auth/auth-context";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountType: "admin" | "moderator" | "user";
  subscription: "free" | "paid";
  createdAt: string;
  seminars: number;
  courses: number;
  downloads: number;
  readiness: number | null;
  readinessRuns: number;
};

type Stats = {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  admins: number;
  moderators: number;
  newThisWeek: number;
  totalReadiness: number;
};

type DetailCourse = {
  id: string;
  course: { id: string; title: string; slug: string; image: string | null; badge: string; price: number; currency: string } | null;
  status: string;
  createdAt: string;
};

type DetailSeminar = {
  id: string;
  seminar: { id: string; title: string; dateTime: string } | null;
  createdAt: string;
};

type DetailDownload = {
  id: string;
  resource: { id: string; title: string; fileType: string; fileUrl: string } | null;
  createdAt: string;
};

type DetailReadiness = {
  id: string;
  score: number;
  label: string;
  country: string;
  degreeLevel: string;
  createdAt: string;
  categories: { id: string; label: string; pct: number }[];
};

type DetailData = {
  user: UserRow;
  stats: { totalCourses: number; totalSeminars: number; totalDownloads: number; totalReadiness: number };
  courses: DetailCourse[];
  seminars: DetailSeminar[];
  downloads: DetailDownload[];
  readiness: DetailReadiness[];
};

const scoreColor = (score: number): string => {
  if (score >= 80) return "#0FA968";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#C0392B";
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

const GRID_COLS = "lg:grid-cols-[minmax(0,1.4fr)_140px_100px_92px_120px_72px_72px_72px_62px_44px]";

const ROW_COLS = "grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.4fr)_140px_100px_92px_120px_72px_72px_72px_62px_44px]";

const PAGE_SIZES = [10, 20, 50];

const ROLE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  admin: { bg: "rgba(111,76,224,0.12)", fg: "#6B4CE0", label: "Admin" },
  moderator: { bg: "rgba(47,95,224,0.12)", fg: "#2F5FE0", label: "Moderator" },
  user: { bg: "var(--brand-soft)", fg: "var(--brand)", label: "Member" },
};

function RoleBadge({ role, sm }: { role: string; sm?: boolean }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.user;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{ background: s.bg, color: s.fg, fontSize: sm ? 10.5 : 11, padding: sm ? "3px 8px" : "4px 10px" }}
    >
      {s.label}
    </span>
  );
}

function PlanBadge({ plan, sm }: { plan: string; sm?: boolean }) {
  const paid = plan === "paid";
  return (
    <span
      className="inline-flex items-center justify-center gap-1 rounded-full font-semibold"
      style={{
        background: paid ? "rgba(245,158,11,0.12)" : "rgba(148,163,184,0.14)",
        color: paid ? "#B45309" : "#64748B",
        fontSize: sm ? 10.5 : 11,
        padding: sm ? "3px 8px" : "4px 10px",
      }}
    >
      {paid && <Crown size={10} strokeWidth={2.4} />}
      {paid ? "Paid" : "Free"}
    </span>
  );
}

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function UserManage() {
  const { user: me } = useAuth();
  const isAdmin = me?.accountType === "admin";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, perPage: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [accountType, setAccountType] = useState("");
  const [subscription, setSubscription] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const savingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedQuery = useDebounced(query, 350);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (accountType) params.set("accountType", accountType);
      if (subscription) params.set("subscription", subscription);
      if (sort && sort !== "newest") params.set("sort", sort);
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
      setPagination(data.pagination ?? { page: 1, perPage, total: 0 });
      if (data.pagination && data.pagination.total < (page - 1) * perPage + 1 && data.pagination.total > 0) {
        setPage(1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, accountType, subscription, sort, page, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load user");
      setDetail(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setDetail(null);
  }, []);

  const updateUser = useCallback(
    async (field: "accountType" | "subscription", value: string) => {
      if (!detail) return;
      const prev = detail.user;
      setDetail({ ...detail, user: { ...prev, [field]: value } });
      setSavingRole(field);
      try {
        const res = await fetch(`/api/admin/users/${detail.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update user");
        }
        load();
        if (savingTimer.current) clearTimeout(savingTimer.current);
        savingTimer.current = setTimeout(() => setSavingRole(null), 1200);
      } catch (e) {
        setDetail({ ...detail, user: prev });
        alert(e instanceof Error ? e.message : "Failed to update user");
        setSavingRole(null);
      }
    },
    [detail, load]
  );

  const deleteUser = useCallback(async () => {
    if (!detail || !isAdmin) return;
    const confirmed = window.confirm(
      `Delete ${detail.user.name} (${detail.user.email})?\n\nThis permanently removes their account, course enrollments, seminar registrations, downloads, readiness assessments and notifications. This cannot be undone.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${detail.user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete user");
      }
      closeDetail();
      if (page > 1 && users.length === 1) {
        setPage(page - 1);
      } else {
        load();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }, [detail, isAdmin, closeDetail, page, users.length, load]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
  const safePage = Math.min(page, totalPages);
  const from = pagination.total === 0 ? 0 : (safePage - 1) * pagination.perPage + 1;
  const to = Math.min(safePage * pagination.perPage, pagination.total);

  if (error) return <ScreenError message={error} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
            Administration
          </p>
          <h1
            className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5"
            style={{ color: "var(--ink)" }}
          >
            Users
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Search, review and manage every registered member.
          </p>
        </div>
        {stats && (
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Users size={13} />
            {stats.totalUsers.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Stats */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[22px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
              <div className="w-11 h-11 rounded-2xl mb-4" style={{ background: "var(--line)" }} />
              <div className="h-[26px] w-16 rounded-lg mb-2" style={{ background: "var(--line)" }} />
              <div className="h-[10px] w-24 rounded" style={{ background: "var(--line)" }} />
            </div>
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {(
              [
                { label: "Total users", value: stats.totalUsers, icon: Users, gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)", caption: "All registered accounts" },
                { label: "Paid members", value: stats.paidUsers, icon: Crown, gradient: "linear-gradient(135deg,#F59E0B,#F97316)", caption: stats.totalUsers > 0 ? `${Math.round((stats.paidUsers / stats.totalUsers) * 100)}% of all users` : undefined },
                { label: "Free members", value: stats.freeUsers, icon: UserPlus, gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)", caption: undefined },
                { label: "Admins & mods", value: stats.admins + stats.moderators, icon: Shield, gradient: "linear-gradient(135deg,#10B981,#34D399)", caption: `${stats.moderators} moderators` },
                { label: "New this week", value: stats.newThisWeek, icon: CalendarDays, gradient: "linear-gradient(135deg,#F43F5E,#FB7185)", caption: "Registered in last 7 days" },
              ] as const
            ).map((c) => (
              <div
                key={c.label}
                className="relative rounded-[22px] border bg-white p-5 overflow-hidden"
                style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: c.gradient }} />
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-4"
                  style={{ background: c.gradient, boxShadow: `0 8px 18px -6px ${c.gradient}66` }}
                >
                  <c.icon size={19} strokeWidth={2.2} />
                </div>
                <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                  {c.value.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
                  {c.label}
                </p>
                {c.caption && (
                  <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
                    {c.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Toolbar */}
      <div
        className="rounded-[14px] border bg-white p-3 flex flex-col lg:flex-row gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--body)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={accountType}
            onChange={(e) => {
              setAccountType(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="user">Members</option>
          </select>
          <select
            value={subscription}
            onChange={(e) => {
              setSubscription(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            aria-label="Filter by subscription"
          >
            <option value="">All plans</option>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            aria-label="Sort users"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <ScreenLoading label="Loading users…" />
      ) : (
        <>
          {/* Table */}
          <div className="rounded-[14px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div
              className={`hidden lg:grid gap-3 px-5 py-2.5 border-b bg-[var(--bg-soft)] ${GRID_COLS}`}
              style={{ borderColor: "var(--line)" }}
            >
              {["User", "Phone", "Role", "Plan", "Joined", "Seminars", "Courses", "Files", "Readiness", "View"].map((c) => (
                <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                  {c}
                </span>
              ))}
            </div>

            {users.length === 0 ? (
              <div className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
                <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  No users found
                </p>
                <p className="text-[13px] mt-1">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => openDetail(u.id)}
                    className={`group grid gap-1.5 lg:gap-3 lg:items-center px-5 py-3 text-left transition-colors duration-150 hover:bg-[var(--bg-soft)] ${ROW_COLS}`}
                  >
                    {/* User */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.name} src={u.avatar} size={34} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                          {u.name}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: "var(--body)" }}>
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <span className="lg:hidden flex items-center gap-1.5 justify-end">
                      <RoleBadge role={u.accountType} sm />
                      <PlanBadge plan={u.subscription} sm />
                    </span>

                    <span className="hidden lg:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                      {u.phone ?? "—"}
                    </span>
                    <span className="hidden lg:block">
                      <RoleBadge role={u.accountType} />
                    </span>
                    <span className="hidden lg:block">
                      <PlanBadge plan={u.subscription} />
                    </span>
                    <span className="hidden lg:block text-[12.5px]" style={{ color: "var(--body)" }}>
                      {fmtDate(u.createdAt)}
                    </span>
                    <span className="hidden lg:block text-[12.5px] tabular-nums text-center" style={{ color: "var(--body)" }}>
                      {u.seminars}
                    </span>
                    <span className="hidden lg:block text-[12.5px] tabular-nums text-center" style={{ color: "var(--body)" }}>
                      {u.courses}
                    </span>
                    <span className="hidden lg:block text-[12.5px] tabular-nums text-center" style={{ color: "var(--body)" }}>
                      {u.downloads}
                    </span>
                    <span className="hidden lg:flex items-center justify-center">
                      {u.readiness === null ? (
                        <span className="text-[12px] text-center" style={{ color: "#A6ADC0" }}>
                          —
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center rounded-lg font-display text-[12.5px] font-semibold tabular-nums px-1.5 py-[3px] min-w-[34px]"
                          style={{ background: `${scoreColor(u.readiness)}1f`, color: scoreColor(u.readiness) }}
                          title={`${u.readinessRuns} assessment run${u.readinessRuns === 1 ? "" : "s"}`}
                        >
                          {u.readiness}
                        </span>
                      )}
                    </span>
                    <span
                      className="hidden lg:flex items-center justify-end transition-colors duration-150 group-hover:text-[var(--brand)]"
                      style={{ color: "var(--body)" }}
                    >
                      <Eye size={15} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                  Showing {from}–{to} of {pagination.total.toLocaleString()}
                </p>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className={selectClass + " !py-[6px] text-[12px]"}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                {pageNumbers(safePage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-[12px]" style={{ color: "var(--body)" }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      className="h-8 min-w-[32px] px-1.5 rounded-lg text-[12.5px] font-semibold transition-colors duration-150"
                      style={
                        p === safePage
                          ? { background: "var(--brand)", color: "#fff" }
                          : { color: "var(--body)" }
                      }
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail overlay */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div className="absolute inset-0" style={{ background: "rgba(15,17,28,0.5)", backdropFilter: "blur(2px)" }} />
          <div
            className="relative w-full h-full sm:w-[440px] border-l bg-white shadow-2xl flex flex-col"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2.5">
                <Users size={16} style={{ color: "var(--brand)" }} />
                <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  User details
                </span>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:bg-[#F1F0F8]"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
                aria-label="Close details"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {detailLoading || !detail ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: "var(--body)" }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
                  <p className="text-[13px]">Loading user…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Profile */}
                  <div className="flex items-start gap-4">
                    <Avatar name={detail.user.name} src={detail.user.avatar} size={52} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
                        {detail.user.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <RoleBadge role={detail.user.accountType} sm />
                        <PlanBadge plan={detail.user.subscription} sm />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <div className="flex items-center gap-2" style={{ color: "var(--body)" }}>
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{detail.user.email}</span>
                    </div>
                    {detail.user.phone && (
                      <div className="flex items-center gap-2" style={{ color: "var(--body)" }}>
                        <Phone size={14} className="shrink-0" />
                        <span className="truncate">{detail.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2" style={{ color: "var(--body)" }}>
                      <CalendarDays size={14} className="shrink-0" />
                      <span>Joined {fmtDate(detail.user.createdAt)}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="rounded-[14px] border p-4 flex flex-col gap-3" style={{ borderColor: "var(--line)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                        Access & plan
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                          Role
                          <select
                            value={detail.user.accountType}
                            onChange={(e) => updateUser("accountType", e.target.value)}
                            disabled={savingRole === "accountType"}
                            className={`${selectClass} w-full mt-1.5 disabled:opacity-50 disabled:pointer-events-none`}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          >
                            <option value="user">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>
                        <label className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                          Subscription
                          <select
                            value={detail.user.subscription}
                            onChange={(e) => updateUser("subscription", e.target.value)}
                            disabled={savingRole === "subscription"}
                            className={`${selectClass} w-full mt-1.5 disabled:opacity-50 disabled:pointer-events-none`}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          >
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                          </select>
                        </label>
                      </div>
                      <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                        {savingRole ? "Saving changes…" : "Changes apply immediately."}
                      </p>
                    </div>
                  )}

                  {isAdmin && (
                    <div
                      className="rounded-[14px] border p-4 flex flex-col gap-3"
                      style={{ borderColor: "rgba(192,57,43,0.35)", background: "rgba(192,57,43,0.045)" }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#C0392B" }}>
                        Danger zone
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
                        Permanently remove this account and all of its activity (enrollments, registrations, downloads,
                        assessments, notifications).
                      </p>
                      {me?.id === detail.user.id ? (
                        <p className="text-[12px] font-semibold" style={{ color: "var(--body)" }}>
                          You can't delete your own account.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={deleteUser}
                          disabled={deleting}
                          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-[10px] text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                          style={{ background: "#C0392B" }}
                        >
                          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          {deleting ? "Deleting…" : "Delete user"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Activity summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-[14px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} style={{ color: "var(--brand)" }} />
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                          Courses
                        </p>
                      </div>
                      <p className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                        {detail.stats.totalCourses}
                      </p>
                    </div>
                    <div className="rounded-[14px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} style={{ color: "var(--brand)" }} />
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                          Seminars
                        </p>
                      </div>
                      <p className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                        {detail.stats.totalSeminars}
                      </p>
                    </div>
                    <div className="rounded-[14px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Download size={14} style={{ color: "var(--brand)" }} />
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                          Downloads
                        </p>
                      </div>
                      <p className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                        {detail.stats.totalDownloads}
                      </p>
                    </div>
                    <div className="rounded-[14px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge size={14} style={{ color: "var(--brand)" }} />
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                          Readiness
                        </p>
                      </div>
                      <p className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                        {detail.stats.totalReadiness}
                      </p>
                    </div>
                  </div>

                  {/* Enrolled courses */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: "var(--body)" }}>
                      Enrolled courses
                    </p>
                    {detail.courses.length === 0 ? (
                      <p className="text-[13px] py-3 text-center rounded-[14px] border border-dashed" style={{ color: "var(--body)", borderColor: "var(--line)" }}>
                        No course enrollments yet.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y rounded-[14px] border overflow-hidden" style={{ borderColor: "var(--line)" }}>
                        {detail.courses.map((e) => (
                          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                            {e.course?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={e.course.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                                <BookOpen size={16} style={{ color: "var(--brand)" }} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                                {e.course?.title ?? "Deleted course"}
                              </p>
                              <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                                {e.status} · {fmtDate(e.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seminars */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: "var(--body)" }}>
                      Registered seminars
                    </p>
                    {detail.seminars.length === 0 ? (
                      <p className="text-[13px] py-3 text-center rounded-[14px] border border-dashed" style={{ color: "var(--body)", borderColor: "var(--line)" }}>
                        No seminar registrations yet.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y rounded-[14px] border overflow-hidden" style={{ borderColor: "var(--line)" }}>
                        {detail.seminars.map((s) => (
                          <div key={s.id} className="px-4 py-3">
                            <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                              {s.seminar?.title ?? "Deleted seminar"}
                            </p>
                            {s.seminar && (
                              <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                                {fmtDate(s.seminar.dateTime)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Downloads */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: "var(--body)" }}>
                      Downloaded resources
                    </p>
                    {detail.downloads.length === 0 ? (
                      <p className="text-[13px] py-3 text-center rounded-[14px] border border-dashed" style={{ color: "var(--body)", borderColor: "var(--line)" }}>
                        No downloads yet.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y rounded-[14px] border overflow-hidden" style={{ borderColor: "var(--line)" }}>
                        {detail.downloads.map((d) => (
                          <div key={d.id} className="px-4 py-3">
                            <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                              {d.resource?.title ?? "Deleted resource"}
                            </p>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                              {d.resource?.fileType ?? "—"} · {fmtDate(d.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Readiness assessments */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: "var(--body)" }}>
                      Readiness assessments
                    </p>
                    {detail.readiness.length === 0 ? (
                      <p className="text-[13px] py-3 text-center rounded-[14px] border border-dashed" style={{ color: "var(--body)", borderColor: "var(--line)" }}>
                        No assessments run yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {detail.readiness.map((r) => {
                          const color = scoreColor(r.score);
                          return (
                            <div key={r.id} className="rounded-[14px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[15px] font-bold tabular-nums"
                                  style={{ background: `${color}1f`, color }}
                                >
                                  {r.score}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                                    {r.label}
                                  </p>
                                  <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--body)" }}>
                                    {[r.country, r.degreeLevel].filter(Boolean).join(" · ") || "Study abroad"}
                                  </p>
                                </div>
                                <span className="text-[11px] shrink-0" style={{ color: "var(--body)" }}>
                                  {fmtDate(r.createdAt)}
                                </span>
                              </div>
                              {r.categories.length > 0 && (
                                <div className="flex flex-col gap-1.5 mt-3">
                                  {r.categories.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2">
                                      <span className="text-[11px] w-[34%] truncate" style={{ color: "var(--body)" }}>
                                        {c.label}
                                      </span>
                                      <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: scoreColor(c.pct) }} />
                                      </div>
                                      <span className="text-[10.5px] tabular-nums w-[26px] text-right" style={{ color: "var(--body)" }}>
                                        {c.pct}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}