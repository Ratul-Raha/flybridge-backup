"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, ChevronRight, ChevronDown } from "lucide-react";
import { SectionCard, StatusPill } from "@/components/dashboard/automations/ui";

type Conversation = {
  id: string;
  title: string;
  status: string;
  messageCount: number;
  toolsUsed: string[];
  adminUser: string;
  startedAt: string;
  lastMessageAt: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  toolCalls: Array<{
    toolId: string;
    parameters: Record<string, unknown>;
    status: string;
  }>;
  createdAt: string;
};

export function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bot-config/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadConversation = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setMessages([]);
      return;
    }
    setSelectedId(id);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/bot-config/conversations/${id}`);
      const data = await res.json();
      setMessages(data.messages);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <SectionCard title="Conversation History">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading conversations...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Conversation History"
        subtitle="View all bot conversations and their tool usage"
      >
        {conversations.length === 0 ? (
          <p className="text-[13px] py-4 text-center" style={{ color: "var(--body)" }}>
            No conversations yet. Start chatting with the bot to see history here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => (
              <div key={conv.id}>
                <button
                  type="button"
                  onClick={() => loadConversation(conv.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition hover:bg-[var(--bg-soft)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <MessageSquare size={16} style={{ color: "var(--brand)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {conv.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--body)" }}>
                      {conv.adminUser} · {conv.messageCount} messages · {conv.toolsUsed.length} tools used
                    </div>
                  </div>
                  <div className="text-[11px] shrink-0" style={{ color: "var(--body)" }}>
                    {formatDate(conv.lastMessageAt)}
                  </div>
                  {selectedId === conv.id ? (
                    <ChevronDown size={14} style={{ color: "var(--body)" }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: "var(--body)" }} />
                  )}
                </button>

                {selectedId === conv.id && (
                  <div className="ml-8 mt-2 mb-2 p-3 rounded-xl" style={{ background: "var(--bg-soft)" }}>
                    {loadingMessages ? (
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--body)" }}>
                        <Loader2 size={13} className="animate-spin" />
                        Loading messages...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`text-[12px] rounded-lg p-2.5 ${
                              msg.role === "user" ? "ml-8" : "mr-8"
                            }`}
                            style={{
                              background: msg.role === "user" ? "var(--brand-soft)" : "#fff",
                              color: msg.role === "user" ? "var(--brand-2)" : "var(--ink)",
                              border: msg.role === "user" ? "none" : "1px solid var(--line)",
                            }}
                          >
                            <div className="font-medium text-[10px] uppercase tracking-wide mb-1 opacity-60">
                              {msg.role}
                            </div>
                            {msg.content && (
                              <div className="whitespace-pre-wrap">{msg.content.slice(0, 500)}</div>
                            )}
                            {msg.toolCalls.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {msg.toolCalls.map((tc, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono"
                                    style={{ background: "rgba(110,76,255,0.1)", color: "#6E4CFF" }}
                                  >
                                    {tc.toolId}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
