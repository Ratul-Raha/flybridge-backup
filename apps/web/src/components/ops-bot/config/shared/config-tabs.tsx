"use client";

export type Tab = {
  id: string;
  label: string;
};

export function ConfigTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b" style={{ borderColor: "var(--line)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className="px-4 py-2.5 text-[13px] font-medium transition-colors relative"
          style={{
            color: active === tab.id ? "var(--brand)" : "var(--body)",
          }}
        >
          {tab.label}
          {active === tab.id && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: "var(--brand)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
