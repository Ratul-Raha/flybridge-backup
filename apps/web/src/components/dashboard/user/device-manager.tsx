"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone, Monitor, Trash2, Loader2 } from "lucide-react";

type Device = {
  id: string;
  deviceId: string;
  deviceName: string;
  lastSeenAt: string;
  createdAt: string;
  current?: boolean;
};

function DeviceIcon({ name }: { name: string }) {
  const os = name.toLowerCase();
  const mobile =
    os.includes("iphone") || os.includes("ipad") || os.includes("android");
  return mobile ? (
    <Smartphone size={18} style={{ color: "var(--brand)" }} />
  ) : (
    <Monitor size={18} style={{ color: "var(--brand)" }} />
  );
}

export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load devices");
      setDevices(data.devices ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (device: Device) => {
    if (device.current) return;
    setRemoving(device.id);
    setError(null);
    try {
      const res = await fetch(`/api/devices/${device.deviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove device");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove device");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div
      className="rounded-[24px] border bg-white p-[clamp(20px,3vw,30px)]"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Devices
          </h2>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--body)" }}>
            Your account can be used on up to 2 devices. This protects your purchase
            from being shared. Remove an old device here to free up a slot.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--body)" }} />
          </div>
        ) : devices.length === 0 ? (
          <p className="text-[13px] py-4" style={{ color: "var(--body)" }}>
            No registered devices yet. You&apos;ll be recorded the next time you sign in.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{
                  borderColor: d.current ? "var(--brand)" : "var(--line)",
                  background: d.current ? "var(--brand-soft, rgba(107,76,224,0.05))" : "white",
                }}
              >
                <DeviceIcon name={d.deviceName} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium flex items-center gap-2" style={{ color: "var(--ink)" }}>
                    {d.deviceName}
                    {d.current && (
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{ background: "var(--brand-soft, rgba(107,76,224,0.1))", color: "var(--brand)" }}
                      >
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                    Last active {new Date(d.lastSeenAt).toLocaleString()}
                  </p>
                </div>
                {!d.current && (
                  <button
                    type="button"
                    onClick={() => remove(d)}
                    disabled={removing === d.id}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[6px] text-[12px] font-medium transition-colors hover:bg-red-50"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                  >
                    {removing === d.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-[12.5px]" style={{ color: "#C0392B" }}>
            {error}
          </p>
        )}

        {devices.length >= 2 && (
          <p
            className="font-mono text-[10.5px] uppercase tracking-[0.12em]"
            style={{ color: "var(--body)" }}
          >
            {devices.length}/2 device slots used
          </p>
        )}
      </div>
    </div>
  );
}