"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { SignInModal } from "@/components/resources/sign-in-modal";

type CommentItem = {
  id: string;
  body: string;
  userName: string;
  userAvatar?: string | null;
  canDelete: boolean;
  createdAt: string;
};

const PAGE_SIZE = 10;

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#10B981,#067A4F)",
  "linear-gradient(135deg,#2563EB,#1E40AF)",
  "linear-gradient(135deg,#8B6BF0,#5B3FD6)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#EF6C7D,#D9415C)",
  "linear-gradient(135deg,#0EA5E9,#0369A1)",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ name, avatar }: { name: string; avatar?: string | null }) {
  const initials = initialsOf(name);
  const gradientIndex =
    [...initials].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
      style={{
        background: AVATAR_GRADIENTS[gradientIndex],
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)",
      }}
    >
      {initials}
    </span>
  );
}

export function ResourceCommentsSection({
  resourceId,
  onChanged,
  compact = false,
}: {
  resourceId: string;
  onChanged?: (total: number) => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      try {
        const res = await fetch(
          `/api/resources/${resourceId}/comments?page=${nextPage}&limit=${PAGE_SIZE}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 0);
        setPage(data.page ?? nextPage);
        setComments((prev) =>
          nextPage === 1 ? (data.comments ?? []) : [...prev, ...(data.comments ?? [])]
        );
      } catch {
        /* ignore */
      }
    },
    [resourceId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await fetchPage(1);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setShowSignIn(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }
      setText("");
      await fetchPage(1);
      onChanged?.(total + 1);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    setError("");
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        setShowSignIn(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => Math.max(0, t - 1));
      onChanged?.(Math.max(0, total - 1));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPage(page + 1);
    setLoadingMore(false);
  };

  return (
    <section id={compact ? undefined : "comments"} className={compact ? "scroll-mt-28" : "mt-8 scroll-mt-28"}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "var(--brand-soft, #E7F8F0)", color: "var(--brand-2, #0FA968)" }}
        >
          <MessageSquare size={17} strokeWidth={2} />
        </span>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
          Comments
        </h2>
        <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--body)" }}>
          {total}
        </span>
      </div>

      <form
        onSubmit={handlePost}
        className="mt-4 rounded-2xl border bg-white p-3.5 shadow-[0_1px_1px_rgba(15,10,40,0.01)] sm:p-4"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Avatar
            name={user?.name ?? "Guest"}
            avatar={user?.avatar ?? null}
          />
          <div className="min-w-0 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                user ? "Add a comment..." : "Sign in to join the conversation"
              }
              maxLength={1000}
              rows={compact ? 2 : 3}
              className="w-full resize-none rounded-xl border px-3 py-2 text-[13px] leading-[1.7] outline-none transition-all focus:border-[#6B4CE0]/60 focus:ring-2 focus:ring-[#6B4CE0]/10 sm:px-3.5 sm:py-2.5 sm:text-[13.5px]"
              style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--bg-soft, #f8f9fc)" }}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] tabular-nums font-medium sm:text-[11.5px]" style={{ color: text.length > 900 ? "#B45309" : "var(--body)" }}>
                {text.length}/1000
              </span>
              <button
                type="submit"
                disabled={posting || !text.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:px-5 sm:py-2 sm:text-[13px]"
                style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
              >
                {posting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {user ? "Post" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-[12px] sm:text-[12.5px]" style={{ color: "#C0392B" }}>
            {error}
          </p>
        )}
      </form>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-10" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Loading comments…</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-5 py-9 text-center" style={{ borderColor: "var(--line)" }}>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-soft)]">
              <MessageSquare size={18} style={{ color: "var(--body)" }} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              No comments yet
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
              Be the first to share your thoughts
            </p>
          </div>
        ) : (
          comments.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border bg-white p-3.5 shadow-[0_1px_1px_rgba(15,10,40,0.01)] transition-shadow hover:shadow-[0_4px_24px_-12px_rgba(15,10,40,0.4)] sm:p-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Avatar name={c.userName} avatar={c.userAvatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13px] font-semibold leading-tight sm:text-[13.5px]" style={{ color: "var(--ink)" }}>
                      {c.userName}
                    </span>
                    <span className="text-[11px] sm:text-[11.5px]" style={{ color: "var(--body)" }}>
                      {formatDate(c.createdAt)}
                    </span>
                    {c.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        aria-label="Delete comment"
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
                        style={{ color: "#DC2626" }}
                      >
                        {deletingId === c.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line break-words text-[13.5px] leading-[1.8] sm:text-[14px]" style={{ color: "var(--body)" }}>
                    {c.body}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}

        {!loading && page < pages && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-auto flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-60"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            Load more comments
          </button>
        )}
      </div>

      {showSignIn && (
        <SignInModal
          title="Sign in to comment"
          message="Join the conversation — sign in with Google to post a comment. Your free account is created automatically if you're new."
          onClose={() => setShowSignIn(false)}
        />
      )}
    </section>
  );
}
