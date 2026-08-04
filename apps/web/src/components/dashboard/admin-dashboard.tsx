"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import type { AccountType, SubscriptionType } from "@/lib/roles";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountType: AccountType;
  subscription: SubscriptionType;
  createdAt: string;
};

type Stats = {
  users: number;
  free: number;
  paid: number;
  admins: number;
  moderators: number;
};

const inputClass =
  "text-[13px] font-medium rounded-full border bg-white px-3 py-[7px] focus:outline-none focus:ring-2 focus:ring-brand-2/30";

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      className="rounded-[20px] border bg-white p-5"
      style={{ borderColor: "var(--line)" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
        {label}
      </p>
      <p className="font-display text-[28px] font-semibold mt-2" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData.stats);
      setRows(usersData.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateUser = async (id: string, patch: Partial<UserRow>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setError("Failed to update user");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    load();
  };

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          Users
        </h1>
        <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
          Platform user stats, roles and plan management.
        </p>
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total users" value={stats?.users ?? "–"} color="var(--ink)" />
        <StatCard label="Free" value={stats?.free ?? "–"} color="var(--body)" />
        <StatCard label="Paid (active)" value={stats?.paid ?? "–"} color="#6B4CE0" />
        <StatCard label="Admins" value={stats?.admins ?? "–"} color="var(--brand)" />
        <StatCard label="Moderators" value={stats?.moderators ?? "–"} color="#2F5FE0" />
      </div>

      <div className="rounded-[24px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Users
          </h2>
          <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
            {rows.length} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                <th className="px-6 py-3.5 font-medium">User</th>
                <th className="px-4 py-3.5 font-medium">Phone</th>
                <th className="px-4 py-3.5 font-medium">Role</th>
                <th className="px-4 py-3.5 font-medium">Plan</th>
                <th className="px-6 py-3.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t text-[13.5px]" style={{ borderColor: "var(--line)" }}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      {row.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatar} alt="" className="w-[32px] h-[32px] rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                          style={{ background: "var(--brand)" }}
                        >
                          {row.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: "var(--ink)" }}>
                          {row.name}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: "var(--body)" }}>
                          {row.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ color: "var(--body)" }}>
                    {row.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={row.accountType}
                      onChange={(e) => updateUser(row.id, { accountType: e.target.value as AccountType })}
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={row.subscription}
                      onChange={(e) => updateUser(row.id, { subscription: e.target.value as SubscriptionType })}
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <option value="free">free</option>
                      <option value="paid">paid</option>
                    </select>
                  </td>
                  <td className="px-6 py-3.5 text-[12.5px]" style={{ color: "var(--body)" }}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[13px]" style={{ color: "var(--body)" }}>
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
