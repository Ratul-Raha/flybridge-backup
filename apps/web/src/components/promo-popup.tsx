"use client";

import { useEffect, useState } from "react";
import { CoursePromo } from "@/components/test";
import { X } from "lucide-react";

export function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New course offer"
    >
      <div
        className="absolute inset-0 bg-[rgba(18,32,67,0.5)] backdrop-blur-[2px] animate-fade-in"
        onClick={() => setOpen(false)}
      />

      <div
        className="relative w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-[22px] bg-white animate-fade-up"
        style={{ boxShadow: "0 40px 80px -30px rgba(18,32,67,0.45)" }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close popup"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white border border-line transition-transform hover:scale-105"
        >
          <X className="w-4 h-4" style={{ color: "var(--ink)" }} />
        </button>

        <div className="p-4 sm:p-6">
          <div className="hidden sm:block">
            <CoursePromo />
          </div>
          <div className="sm:hidden">
            <CoursePromo image={false} />
          </div>
        </div>
      </div>
    </div>
  );
}