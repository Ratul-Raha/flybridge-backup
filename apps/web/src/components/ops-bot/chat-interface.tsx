"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, Sparkles } from "lucide-react";
import { ChatBody } from "./chat-body";

type BotProfile = {
  name: string;
  avatar: string;
  greeting: string;
  tone: string;
  detailLevel: string;
};

const DEFAULT_PROFILE: BotProfile = {
  name: "Bridge Ops",
  avatar: "",
  greeting:
    "Your AI admin assistant. Ask me about users, orders, courses, seminars, or anything about your business.",
  tone: "balanced",
  detailLevel: "balanced",
};

const QUICK_GROUPS: { title: string; prompts: string[] }[] = [
  {
    title: "Overview",
    prompts: ["Give me a business overview", "Revenue this month vs last month"],
  },
  {
    title: "Orders & Users",
    prompts: ["Show pending orders", "Find users who signed up this month"],
  },
  {
    title: "Content",
    prompts: ["List upcoming seminars", "Which courses are most popular?"],
  },
];

export function OpsBotChat() {
  const [profile, setProfile] = useState<BotProfile>(DEFAULT_PROFILE);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/bot-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setProfile({
          name: typeof data.name === "string" && data.name ? data.name : DEFAULT_PROFILE.name,
          avatar: typeof data.avatar === "string" ? data.avatar : "",
          greeting:
            typeof data.greeting === "string" && data.greeting
              ? data.greeting
              : DEFAULT_PROFILE.greeting,
          tone: typeof data.tone === "string" ? data.tone : DEFAULT_PROFILE.tone,
          detailLevel:
            typeof data.detailLevel === "string" ? data.detailLevel : DEFAULT_PROFILE.detailLevel,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProfileReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="flex flex-col h-[calc(100vh-120px)] rounded-2xl overflow-hidden border"
      style={{ borderColor: "var(--line)" }}
    >
      <ChatBody
        variant="page"
        renderToolbar={({ newChat, hasMessages }) => (
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: "#0E1530" }}>
            <span
              className="relative flex w-10 h-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, var(--brand), #3B2BB0)" }}
            >
              <Bot size={20} style={{ color: "#fff" }} />
              <span
                className="absolute -bottom-[1px] -right-[1px] w-3 h-3 rounded-full border-2"
                style={{ background: "#2BD97E", borderColor: "#0E1530" }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold text-white leading-tight">
                {profile.name}
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.18em] uppercase mt-[2px]"
                style={{ color: "#8FD9B6" }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2BD97E] mr-1.5 align-middle" />
                Online — operational assistant
              </div>
            </div>
            {hasMessages && (
              <button
                type="button"
                onClick={newChat}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/75 hover:text-white hover:bg-white/10 transition"
              >
                <Plus size={14} />
                New Chat
              </button>
            )}
          </div>
        )}
        renderEmpty={({ send }) => (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-6">
            <div
              className="flex w-16 h-16 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(110,76,255,0.18), rgba(59,43,176,0.12))",
                boxShadow: "0 12px 40px -12px rgba(110,76,255,0.4)",
              }}
            >
              <Bot size={30} style={{ color: "var(--brand)" }} />
            </div>
            <div className="text-center">
              <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                {profileReady ? profile.name : "Loading…"}
              </h2>
              <p className="text-[13px] mt-1.5 max-w-[360px]" style={{ color: "var(--body)" }}>
                {profile.greeting}
              </p>
              <div
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase rounded-full px-3 py-1"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Sparkles size={11} />
                {profile.tone} · {profile.detailLevel}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[560px]">
              {QUICK_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-1.5">
                  <p
                    className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] px-1"
                    style={{ color: "#A6ADC0" }}
                  >
                    {group.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.prompts.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="text-[12.5px] font-medium rounded-full px-4 py-2 transition-all duration-200 hover:scale-[1.02]"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
}