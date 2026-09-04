"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.isSecureContext === "boolean" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<void> {
  if (!reg.pushManager) return;

  let sub: PushSubscription | null = await reg.pushManager.getSubscription();

  if (!sub) {
    const permission =
      typeof Notification.requestPermission === "function"
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== "granted") return;
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await fetchVapidKey(),
    });
    if (!sub) return;
  }

  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        },
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // non-fatal — browser will resubscribe on next visit
  }
}

async function fetchVapidKey(): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    const res = await fetch("/api/push/vapid-key", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { key?: string };
    if (!data.key) return null;
    return urlBase64ToUint8Array(data.key);
  } catch {
    return null;
  }
}

/**
 * Always-on Chrome push notifications. Runs silently when a signed-in user
 * views any page: registers the service worker, subscribes when permission is
 * already granted, and queues one gesture-triggered attempt (Chrome requires a
 * user gesture to show the permission prompt) otherwise. Renders nothing.
 */
export function PushEnabler() {
  useEffect(() => {
    if (!isSupported()) return;

    let cancelled = false;
    let removeGesture: (() => void) | null = null;

    const enable = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (cancelled) return;
          if (Notification.permission === "granted") {
            subscribeToPush(reg).catch(() => {});
            return;
          }
          if (Notification.permission === "default") {
            const attempt = () => {
              removeGesture?.();
              removeGesture = null;
              subscribeToPush(reg).catch(() => {});
            };
            window.addEventListener("pointerdown", attempt, { once: false });
            window.addEventListener("keydown", attempt, { once: false });
            window.addEventListener("touchstart", attempt, { once: false });
            removeGesture = () => {
              window.removeEventListener("pointerdown", attempt);
              window.removeEventListener("keydown", attempt);
              window.removeEventListener("touchstart", attempt);
            };
          }
        })
        .catch(() => {});
    };

    enable();

    return () => {
      cancelled = true;
      removeGesture?.();
    };
  }, []);

  return null;
}
