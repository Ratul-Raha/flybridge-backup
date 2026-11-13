"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plug, Users } from "lucide-react";

const TABS = [
  { href: "/dashboard/admin/crm/leads", label: "Leads", icon: Users },
  { href: "/dashboard/admin/crm/integrations", label: "Integrations", icon: Plug },
];

export function CrmTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border bg-white p-1" style={{ borderColor: "var(--line)" }}>
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
            style={
              active
                ? { background: "var(--brand)", color: "#fff" }
                : { color: "var(--body)" }
            }
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
