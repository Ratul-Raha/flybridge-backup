"use client";

import Link from "next/link";
import { Avatar } from "@/components/dashboard/avatar";
import { Card } from "./card";
import { InlineLoader } from "@/components/dashboard/page-loader";

type Signup = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountType: string;
  createdAt: string;
};

export function RecentSignups({ signups, loading }: { signups: Signup[]; loading?: boolean }) {
  return (
    <Card title="Recent sign ups" subtitle="Newest members on the platform">
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
        {loading && <InlineLoader label="Loading…" />}
        {!loading && signups.length === 0 && (
          <p className="text-[13px] py-6 text-center" style={{ color: "var(--body)" }}>
            No signups yet.
          </p>
        )}
        {signups.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/admin/users?user=${s.id}`}
            className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-soft)]"
          >
            <Avatar name={s.name} src={s.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {s.name}
              </p>
              <p className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                {s.email}
              </p>
            </div>
            <span className="text-[11px] shrink-0" style={{ color: "var(--body)" }}>
              {new Date(s.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}