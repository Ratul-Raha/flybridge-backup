"use client";

import { useProfileForm, ADDRESS_FIELDS } from "@/components/dashboard/use-profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/dashboard/avatar";

export function ProfileDashboard() {
  const { user, loading, form, setForm, saved, saving, error, save } = useProfileForm();

  if (loading || !user) {
    return <p style={{ color: "var(--body)" }}>Loading…</p>;
  }

  const inputClass =
    "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30" +
    " hover:border-brand-2/60";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account details."
      />

      <div className="grid md:grid-cols-[300px_1fr] gap-7">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border bg-white p-7 text-center h-fit" style={{ borderColor: "var(--line)" }}>
          <Avatar name={form.name || "?"} src={form.avatar || null} size={92} />
          <div>
            <p className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
              {form.name || "Your name"}
            </p>
            <p className="text-[13px]" style={{ color: "var(--body)" }}>
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[6px]"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              {user.accountType}
            </span>
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[6px]"
              style={
                user.subscription === "paid"
                  ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                  : { background: "var(--bg-soft)", color: "var(--body)" }
              }
            >
              {user.subscription}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border bg-white p-[clamp(20px,3vw,30px)]" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Email <span className="text-[11px] font-normal" style={{ color: "var(--body)" }}>(managed by Google)</span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--body)", background: "var(--bg-soft)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Phone number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 800 000 0000"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Avatar URL
              </label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                placeholder="https://…"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div>
              <p className="text-[12.5px] font-medium mb-3" style={{ color: "var(--ink)" }}>
                Address
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ADDRESS_FIELDS.map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={form.address[field.key] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, [field.key]: e.target.value },
                        })
                      }
                      placeholder={field.placeholder}
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[12.5px]" style={{ color: "#C0392B" }}>
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="text-[13px] font-medium" style={{ color: "var(--brand)" }}>
                  Saved ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}