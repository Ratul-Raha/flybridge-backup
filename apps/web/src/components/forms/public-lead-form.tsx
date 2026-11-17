"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

export type PublicFormField = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  options: { value: string; label: string }[];
  isRequired: boolean;
};

const inputClass =
  "w-full rounded-xl border bg-white px-3.5 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-semibold mb-1.5";

function isEmpty(value: unknown): boolean {
  if (typeof value === "boolean") return !value;
  return value === null || value === undefined || String(value).trim() === "";
}

function CustomField({
  field,
  value,
  onChange,
}: {
  field: PublicFormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const style = { borderColor: "var(--line)", color: "var(--ink)" };

  if (field.type === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        style={style}
      >
        <option value="">Select an option</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={field.placeholder}
        className={inputClass}
        style={style}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2.5 text-[13.5px]" style={{ color: "var(--ink)" }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: "var(--brand)" }}
        />
        Yes
      </label>
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        style={style}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={inputClass}
        style={style}
      />
    );
  }

  const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  return (
    <input
      type={inputType}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
      className={inputClass}
      style={style}
    />
  );
}

export function PublicLeadForm({
  slug,
  listName,
  description,
  fields,
}: {
  slug: string;
  listName: string;
  description: string;
  fields: PublicFormField[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const missing = fields.find((f) => f.isRequired && isEmpty(customFields[f.name]));
    if (missing) {
      setError(`Please fill in "${missing.label}".`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          customFields,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCustomFields({});
    setWebsite("");
    setError(null);
    setSubmitted(false);
  };

  return (
    <main
      className="min-h-screen px-[clamp(16px,4vw,40px)] py-[clamp(32px,7vh,72px)]"
      style={{ background: "linear-gradient(180deg, #F7F5FF 0%, #FFFFFF 46%)" }}
    >
      <div className="mx-auto w-full max-w-[560px]">
        <div className="flex justify-center">
          <Link href="/" className="brand flex flex-col items-center leading-none" aria-label="FlyBridge home">
            <Image
              src="/transparent-logo-dark.png"
              alt="FlyBridge Education Group"
              width={113}
              height={38}
              className="w-auto h-[36px] object-contain"
              priority
            />
          </Link>
        </div>

        <div
          className="mt-7 overflow-hidden rounded-2xl border bg-white"
          style={{ borderColor: "var(--line)", boxShadow: "0 24px 60px -32px rgba(18,32,67,0.18)" }}
        >
          {submitted ? (
            <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(15,169,104,0.12)", color: "#0FA968" }}
              >
                <CheckCircle2 size={28} />
              </span>
              <h1 className="font-display mt-5 text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                Thank you!
              </h1>
              <p className="mt-2 max-w-[380px] text-[14px] leading-[1.6]" style={{ color: "var(--body)" }}>
                We&apos;ve received your details and will be in touch soon.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-7 inline-flex items-center rounded-full border px-5 py-[9px] text-[13px] font-semibold transition-colors hover:bg-[var(--bg-soft)]"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                Submit another response
              </button>
            </div>
          ) : (
            <>
              <div className="border-b px-6 py-6 sm:px-8" style={{ borderColor: "var(--line)" }}>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--brand)" }}
                >
                  FlyBridge Education Group
                </p>
                <h1
                  className="font-display mt-2 text-[clamp(21px,3vw,26px)] font-semibold tracking-[-0.02em]"
                  style={{ color: "var(--ink)" }}
                >
                  {listName}
                </h1>
                <p className="mt-1.5 text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                  {description || "Share your details and our team will get back to you."}
                </p>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-6 sm:px-8">
                {error && (
                  <p
                    className="rounded-xl px-4 py-3 text-[13px] font-medium"
                    style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}
                  >
                    {error}
                  </p>
                )}

                <div>
                  <label className={labelClass} style={{ color: "var(--ink)" }}>
                    Full name <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} style={{ color: "var(--ink)" }}>
                    Email address <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} style={{ color: "var(--ink)" }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880…"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    autoComplete="tel"
                  />
                </div>

                {fields.map((field) => (
                  <div key={field.id}>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>
                      {field.label} {field.isRequired && <span style={{ color: "#C0392B" }}>*</span>}
                    </label>
                    <CustomField
                      field={field}
                      value={customFields[field.name]}
                      onChange={(v) =>
                        setCustomFields((prev) => ({ ...prev, [field.name]: v }))
                      }
                    />
                  </div>
                ))}

                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-[11px] text-[14px] font-semibold text-white transition-all hover:-translate-y-[1px] hover:opacity-95 disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  {busy ? "Submitting…" : "Submit"}
                </button>

                <p className="text-center text-[11.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                  By submitting you agree to our{" "}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-brand-2">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
