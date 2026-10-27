"use client";

import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((navigator as any).standalone) return true;
  return false;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      // Show iOS install button since beforeinstallprompt won't fire
      setVisible(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (isIOSDevice) {
      setShowIOSModal(true);
      return;
    }
    
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    setShowIOSModal(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  };

  if (!visible && !showIOSModal) return null;

  return (
    <>
      {visible && !showIOSModal && (
        <button
          onClick={install}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
        >
          <Download size={16} />
          Install App
        </button>
      )}

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Install FlyBridge
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                To install this app on your iOS device:
              </p>
              <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                    1
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Tap the Share button</span>
                    <Share size={18} className="text-blue-500" />
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                    2
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Scroll down and tap</span>
                    <span className="font-medium">"Add to Home Screen"</span>
                    <PlusSquare size={18} className="text-gray-500" />
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                    3
                  </span>
                  <span>Tap "Add" in the top right corner</span>
                </li>
              </ol>
            </div>
            <div className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
              <button
                onClick={dismiss}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Don't show again
              </button>
              <button
                onClick={() => setShowIOSModal(false)}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
