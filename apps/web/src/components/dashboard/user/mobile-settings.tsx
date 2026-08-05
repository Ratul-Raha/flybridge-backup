"use client";

import { useProfileForm, ADDRESS_FIELDS } from "@/components/dashboard/use-profile-form";
import { Avatar } from "@/components/dashboard/avatar";
import { Mail, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function MobileSettings() {
  const { user, form, setForm, saved, saving, error, save } = useProfileForm();
  const { signOut } = useAuth();

  if (!user) return null;

  const inputClass =
    "w-full text-[15px] rounded-xl border bg-white px-4 py-[12px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30" +
    " hover:border-brand-2/60";

  const setAddress = (field: string, value: string) =>
    setForm({ ...form, address: { ...form.address, [field]: value } });

  return (
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <div
        className="px-6 py-6 rounded-[24px] border bg-white flex flex-col items-center gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <Avatar name={form.name || "?"} src={form.avatar || null} size={84} />
        <div className="text-center">
          <p className="font-display text-[19px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
            {form.name || "Your name"}
          </p>
          <p className="text-[13px] mt-1 flex items-center justify-center gap-1.5" style={{ color: "var(--body)" }}>
            <Mail size={13} />
            {user.email}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
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

      {/* Personal info */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <MapPin size={14} style={{ color: "var(--brand)" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Personal info
          </h2>
        </div>
        <div
          className="rounded-2xl border bg-white overflow-hidden p-5 flex flex-col gap-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5">
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
        </div>
      </section>

      {/* Address */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <MapPin size={14} style={{ color: "var(--brand)" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Address
          </h2>
        </div>
        <div className="rounded-[24px] border bg-white p-5 flex flex-col gap-4" style={{ borderColor: "var(--line)" }}>
          {ADDRESS_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                {field.label}
              </label>
              <input
                type="text"
                value={form.address[field.key] ?? ""}
                onChange={(e) => setAddress(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-[12.5px] px-1" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-full text-white text-[14.5px] font-semibold px-6 py-[13px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>

      <button
        type="button"
        onClick={signOut}
        className="flex items-center justify-center gap-2 rounded-full border px-4 py-[13px] text-[13.5px] font-medium transition-colors duration-200 hover:bg-[#FDF1F0] hover:text-[#C0392B]"
        style={{ borderColor: "var(--line)", color: "var(--body)" }}
      >
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
