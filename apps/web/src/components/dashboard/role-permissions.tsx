"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Crown,
  Eye,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  GRANTABLE_MODULES,
  PERMISSION_ACTIONS,
  PERMISSION_GROUP_LABELS,
  PERMISSION_GROUP_ORDER,
  PERMISSION_MODULES,
  countGranted,
  countModulesWithAny,
  currentModeratorPermissions,
  emptyPermissionSet,
  type PermissionAction,
  type PermissionGroupId,
  type PermissionSet,
} from "@/lib/permissions";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountType: "admin" | "moderator" | "user";
  subscription: "free" | "paid";
  createdAt: string;
};

type Candidate = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
};

type Tab = "team" | "permissions";

const ACTION_META: Record<
  PermissionAction,
  { label: string; icon: typeof Eye; color: string }
> = {
  view: { label: "View", icon: Eye, color: "#2F5FE0" },
  create: { label: "Create", icon: Plus, color: "#0FA968" },
  edit: { label: "Edit", icon: Pencil, color: "#DB8A2E" },
  delete: { label: "Delete", icon: Trash2, color: "#C0392B" },
};

const ROLE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  admin: { bg: "rgba(111,76,224,0.12)", fg: "#6B4CE0", label: "Admin" },
  moderator: { bg: "rgba(47,95,224,0.12)", fg: "#2F5FE0", label: "Moderator" },
  user: { bg: "var(--brand-soft)", fg: "var(--brand)", label: "Member" },
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.user;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-[3px]"
      style={{ background: s.bg, color: s.fg, fontSize: 10.5 }}
    >
      {s.label}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  color,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  color: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className="relative w-[38px] h-[22px] rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
      style={{ background: checked ? color : "rgba(148,163,184,0.28)" }}
    >
      <span
        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

export function RolePermissions() {
  const { user: me } = useAuth();

  const [tab, setTab] = useState<Tab>("team");

  // ── Team tab state ─────────────────────────────────────────────────────
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Add-member panel state ─────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // ── Permissions tab state ──────────────────────────────────────────────
  const [permissions, setPermissions] = useState<PermissionSet>(() =>
    currentModeratorPermissions(),
  );
  const [expandedGroups, setExpandedGroups] = useState<PermissionGroupId[]>([
    "content",
    "members",
  ]);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The users endpoint is already admin-guarded and exposes the accountType
      // filter, so we can pull all staff in one request.
      const res = await fetch("/api/admin/users?accountType=admin&perPage=100", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load staff");
      const admins: StaffMember[] = (data.users ?? [])
        .filter((u: StaffMember) => u.accountType === "admin")
        .map((u: StaffMember) => ({ ...u }));

      const modRes = await fetch("/api/admin/users?accountType=moderator&perPage=100", {
        cache: "no-store",
      });
      const modData = await modRes.json();
      if (!modRes.ok) throw new Error(modData.error ?? "Failed to load moderators");
      const moderators: StaffMember[] = (modData.users ?? [])
        .filter((u: StaffMember) => u.accountType === "moderator")
        .map((u: StaffMember) => ({ ...u }));

      setStaff([...admins, ...moderators]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const searchCandidates = useCallback(async () => {
    setSearching(true);
    setCandidateError(null);
    try {
      const params = new URLSearchParams({ accountType: "user", perPage: "12" });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setCandidates(data.users ?? []);
    } catch (e) {
      setCandidateError(e instanceof Error ? e.message : "Search failed");
      setCandidates([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const changeRole = useCallback(
    async (id: string, role: "admin" | "moderator" | "user") => {
      setBusyId(id);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType: role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update role");

        // Promote into the visible list, demote out of it.
        if (role === "user") {
          setStaff((prev) => prev.filter((m) => m.id !== id));
        } else {
          await loadStaff();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role");
      } finally {
        setBusyId(null);
      }
    },
    [loadStaff],
  );

  const promoteCandidate = useCallback(
    async (id: string, role: "admin" | "moderator") => {
      setPromotingId(id);
      setCandidateError(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType: role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update role");
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        await loadStaff();
      } catch (e) {
        setCandidateError(e instanceof Error ? e.message : "Failed to update role");
      } finally {
        setPromotingId(null);
      }
    },
    [loadStaff],
  );

  const togglePermission = useCallback(
    (moduleKey: string, action: PermissionAction) => {
      setPermissions((prev) => ({
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] ?? { view: false, create: false, edit: false, delete: false }),
          [action]: !prev[moduleKey]?.[action],
        },
      }));
    },
    [],
  );

  const setModuleActions = useCallback(
    (moduleKey: string, actions: PermissionAction[], value: boolean) => {
      setPermissions((prev) => {
        const row = {
          ...(prev[moduleKey] ?? {
            view: false,
            create: false,
            edit: false,
            delete: false,
          }),
        };
        for (const action of actions) row[action] = value;
        return { ...prev, [moduleKey]: row };
      });
    },
    [],
  );

  const setGroup = useCallback(
    (group: PermissionGroupId, value: boolean) => {
      setPermissions((prev) => {
        const next = { ...prev };
        for (const mod of GRANTABLE_MODULES) {
          if (mod.group !== group) continue;
          const row = {
            ...(next[mod.key] ?? {
              view: false,
              create: false,
              edit: false,
              delete: false,
            }),
          };
          for (const action of mod.actions) row[action] = value;
          next[mod.key] = row;
        }
        return next;
      });
    },
    [],
  );

  const setAll = useCallback((value: boolean) => {
    setPermissions(value ? currentModeratorPermissions() : emptyPermissionSet());
  }, []);

  const admins = useMemo(() => staff.filter((s) => s.accountType === "admin"), [staff]);
  const moderators = useMemo(() => staff.filter((s) => s.accountType === "moderator"), [staff]);

  const grouped = useMemo(
    () =>
      PERMISSION_GROUP_ORDER.map((groupId) => ({
        groupId,
        label: PERMISSION_GROUP_LABELS[groupId],
        modules: PERMISSION_MODULES.filter((m) => m.group === groupId),
      })),
    [],
  );

  const grantedCount = countGranted(permissions);
  const grantedModules = countModulesWithAny(permissions);

  const renderMemberRow = (member: StaffMember, removable: boolean) => (
    <div
      key={member.id}
      className="flex flex-wrap items-center gap-4 px-5 py-3.5"
    >
      <Avatar name={member.name} src={member.avatar} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>
            {member.name}
          </p>
          <RoleBadge role={member.accountType} />
          {me?.id === member.id && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] font-semibold"
              style={{ background: "var(--bg-soft)", color: "var(--body)" }}
            >
              You
            </span>
          )}
        </div>
        <p className="text-[12px] truncate flex items-center gap-1" style={{ color: "var(--body)" }}>
          <Mail size={11} />
          {member.email}
        </p>
      </div>

      <span className="text-[12px] hidden sm:inline" style={{ color: "var(--body)" }}>
        Joined {fmtDate(member.createdAt)}
      </span>

      <div className="flex items-center gap-2">
        <select
          value={member.accountType}
          disabled={busyId === member.id || (me?.id === member.id && member.accountType === "admin")}
          onChange={(e) => changeRole(member.id, e.target.value as "admin" | "moderator" | "user")}
          className={`${selectClass} disabled:opacity-50 disabled:pointer-events-none`}
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          aria-label={`Role for ${member.name}`}
        >
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">Member</option>
        </select>
        {removable && busyId === member.id && (
          <Loader2 size={15} className="animate-spin" style={{ color: "var(--brand)" }} />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--brand)" }}
          >
            Administration
          </p>
          <h1
            className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5"
            style={{ color: "var(--ink)" }}
          >
            Roles &amp; permissions
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Promote members to staff and decide what moderators can reach.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}
          >
            <Crown size={13} />
            {admins.length} admin{admins.length === 1 ? "" : "s"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "rgba(47,95,224,0.12)", color: "#2F5FE0" }}
          >
            <Shield size={13} />
            {moderators.length} moderator{moderators.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {error && <ScreenError message={error} />}

      {/* Tabs */}
      <div
        className="inline-flex items-center gap-1 self-start rounded-xl border bg-white p-1"
        style={{ borderColor: "var(--line)" }}
      >
        {(
          [
            { id: "team" as Tab, label: "Team", icon: Users },
            { id: "permissions" as Tab, label: "Moderator access", icon: ShieldCheck },
          ]
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-[8px] text-[13px] font-semibold transition-all duration-200"
              style={{
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#fff" : "var(--body)",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "team" ? (
        <>
          {/* Add member panel */}
          <div
            className="rounded-lg border bg-white overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <UserPlus size={16} style={{ color: "var(--brand)" }} />
                <span>
                  <span
                    className="block text-[14px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    Add an existing member
                  </span>
                  <span className="block text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                    Promote anyone who already signed up to admin or moderator.
                  </span>
                </span>
              </span>
              <ChevronDown
                size={16}
                className="transition-transform duration-200 shrink-0"
                style={{
                  color: "var(--body)",
                  transform: showAdd ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {showAdd && (
              <div
                className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--body)" }}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchCandidates();
                    }}
                    placeholder="Search members by name or email…"
                    className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-24 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                  <button
                    type="button"
                    onClick={searchCandidates}
                    disabled={searching}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-3 py-[6px] text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {searching ? "Searching…" : "Search"}
                  </button>
                </div>

                {candidateError && <ScreenError message={candidateError} />}

                {!searching && candidates.length === 0 && !candidateError && (
                  <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                    Search to list members who can be promoted.
                  </p>
                )}

                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Avatar name={c.name} src={c.avatar} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {c.name}
                      </p>
                      <p className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                        {c.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => promoteCandidate(c.id, "moderator")}
                        disabled={promotingId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[12px] font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: "rgba(47,95,224,0.12)", color: "#2F5FE0" }}
                      >
                        {promotingId === c.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Shield size={12} />
                        )}
                        Moderator
                      </button>
                      <button
                        type="button"
                        onClick={() => promoteCandidate(c.id, "admin")}
                        disabled={promotingId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[12px] font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}
                      >
                        {promotingId === c.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Crown size={12} />
                        )}
                        Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admins */}
          <div
            className="rounded-lg border bg-white overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-3.5 border-b bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)" }}
            >
              <p className="text-[12px] font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
                <Crown size={14} style={{ color: "#6B4CE0" }} />
                Admins
              </p>
              <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                Full access to everything
              </p>
            </div>
            {loading ? (
              <ScreenLoading label="Loading staff…" />
            ) : admins.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px]" style={{ color: "var(--body)" }}>
                No admins yet.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {admins.map((m) => renderMemberRow(m, false))}
              </div>
            )}
          </div>

          {/* Moderators */}
          <div
            className="rounded-lg border bg-white overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-3.5 border-b bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)" }}
            >
              <p className="text-[12px] font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
                <Shield size={14} style={{ color: "#2F5FE0" }} />
                Moderators
              </p>
              <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                Access defined on the Moderator access tab
              </p>
            </div>
            {loading ? (
              <ScreenLoading label="Loading staff…" />
            ) : moderators.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px]" style={{ color: "var(--body)" }}>
                No moderators yet. Promote a member from the panel above.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {moderators.map((m) => renderMemberRow(m, true))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Permissions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px]" style={{ color: "var(--body)" }}>
              {grantedModules} of {GRANTABLE_MODULES.length} modules · {grantedCount} individual
              permissions granted
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-[9px] text-[12.5px] font-semibold transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <Check size={13} />
                Select all
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-[9px] text-[12.5px] font-semibold transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <X size={13} />
                Clear all
              </button>
            </div>
          </div>

          <div
            className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
            style={{
              borderColor: "rgba(219,138,46,0.3)",
              background: "rgba(219,138,46,0.06)",
            }}
          >
            <AlertTriangle size={15} className="shrink-0 mt-[1px]" style={{ color: "#B45309" }} />
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--body)" }}>
              These toggles describe what each moderator role should be able to do. Enforcement
              lands in the next step — until then every moderator still has the same access they
              have today.
            </p>
          </div>

          {/* Module groups */}
          {grouped.map(({ groupId, label, modules }) => {
            const isAdminGroup = groupId === "admin";
            const expanded = expandedGroups.includes(groupId);
            const groupGranted = modules.filter(
              (m) => !m.adminOnly && permissions[m.key]?.view,
            ).length;
            const groupTotal = modules.filter((m) => !m.adminOnly).length;

            return (
              <div
                key={groupId}
                className="rounded-lg border bg-white overflow-hidden"
                style={{ borderColor: "var(--line)" }}
              >
                <div
                  className="flex items-center justify-between gap-3 px-5 py-3.5 border-b bg-[var(--bg-soft)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroups((prev) =>
                        prev.includes(groupId)
                          ? prev.filter((g) => g !== groupId)
                          : [...prev, groupId],
                      )
                    }
                    className="flex items-center gap-2 text-[12px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    <ChevronDown
                      size={14}
                      className="transition-transform duration-200"
                      style={{
                        transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                      }}
                    />
                    {label}
                  </button>
                  <div className="flex items-center gap-3">
                    {isAdminGroup ? (
                      <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                        Admin only — not configurable
                      </span>
                    ) : (
                      <>
                        <span className="text-[11.5px] tabular-nums" style={{ color: "var(--body)" }}>
                          {groupGranted}/{groupTotal}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGroup(groupId, true)}
                          className="text-[11.5px] font-semibold transition-opacity hover:opacity-70"
                          style={{ color: "var(--brand)" }}
                        >
                          Enable all
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroup(groupId, false)}
                          className="text-[11.5px] font-semibold transition-opacity hover:opacity-70"
                          style={{ color: "var(--body)" }}
                        >
                          Disable all
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                    {modules.map((mod) => {
                      const row = permissions[mod.key];
                      return (
                        <div
                          key={mod.key}
                          className="px-5 py-3.5 flex flex-wrap items-center gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[13.5px] font-semibold flex items-center gap-2"
                              style={{ color: "var(--ink)" }}
                            >
                              {mod.label}
                              {mod.adminOnly && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-semibold"
                                  style={{
                                    background: "rgba(111,76,224,0.12)",
                                    color: "#6B4CE0",
                                  }}
                                >
                                  <Crown size={9} />
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                              {mod.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            {mod.actions.map((action) => {
                              const meta = ACTION_META[action];
                              return (
                                <div key={action} className="flex flex-col items-center gap-1">
                                  <Toggle
                                    checked={!!row?.[action]}
                                    disabled={mod.adminOnly}
                                    onChange={() => togglePermission(mod.key, action)}
                                    color={meta.color}
                                    label={`${meta.label} ${mod.label}`}
                                  />
                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: "var(--body)" }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Action legend */}
          <div
            className="rounded-lg border bg-white px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2"
            style={{ borderColor: "var(--line)" }}
          >
            {PERMISSION_ACTIONS.map((action) => {
              const meta = ACTION_META[action];
              const Icon = meta.icon;
              return (
                <span key={action} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--body)" }}>
                  <Icon size={13} style={{ color: meta.color }} />
                  <span>
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>
                      {meta.label}
                    </span>{" "}
                    — {PERMISSION_ACTIONS_DESCRIPTIONS[action]}
                  </span>
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const PERMISSION_ACTIONS_DESCRIPTIONS: Record<PermissionAction, string> = {
  view: "read the list and open details",
  create: "add new records",
  edit: "change existing records",
  delete: "remove records permanently",
};