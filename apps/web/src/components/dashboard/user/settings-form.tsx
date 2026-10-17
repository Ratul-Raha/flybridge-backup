"use client";

import { useProfileForm, ADDRESS_FIELDS } from "@/components/dashboard/use-profile-form";
import { BD_COUNTRY_CODE } from "@/lib/phone";

export function SettingsForm() {
  const { user, form, setForm, saved, saving, error, save } = useProfileForm();

  if (!user) return null;

  const inputClass =
    "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30" +
    " hover:border-brand-2/60";

  return (
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
            Phone number <span style={{ color: "#C0392B" }}>*</span>
          </label>
          <div className="flex">
            <span
              className="inline-flex items-center px-3 text-[13px] font-medium rounded-l-xl border border-r-0 bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--body)" }}
            >
              {BD_COUNTRY_CODE}
            </span>
            <input
              type="tel"
              value={
                form.phone.startsWith(BD_COUNTRY_CODE)
                  ? form.phone.slice(BD_COUNTRY_CODE.length)
                  : ""
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                setForm({ ...form, phone: digits ? `${BD_COUNTRY_CODE}${digits}` : "" });
              }}
              placeholder="1XXXXXXXXX"
              className={inputClass + " !rounded-l-none"}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
          <p className="text-[11px]" style={{ color: "var(--body)" }}>
            Country code locked to +88 for Bangladesh (required)
          </p>
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
  );
}
