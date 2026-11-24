"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./spoken-english-review-toasts.module.css";

export type SpokenEnglishSideReview = {
  id: string;
  name: string;
  date: string;
  text: string;
};

export function SpokenEnglishReviewToasts({ reviews }: { reviews: SpokenEnglishSideReview[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const review = reviews[index];

  useEffect(() => {
    if (reviews.length === 0 || dismissed) return;

    const timer = window.setTimeout(() => setVisible(true), 3200);
    return () => window.clearTimeout(timer);
  }, [reviews.length, dismissed]);

  useEffect(() => {
    if (!visible || paused || dismissed || !review) return;

    const timer = window.setTimeout(() => {
      if (index >= reviews.length - 1) {
        setDismissed(true);
        setVisible(false);
        return;
      }
      setIndex((current) => current + 1);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [visible, paused, dismissed, index, reviews.length, review]);

  if (!visible || dismissed || !review) return null;

  return (
    <aside
      className={styles.wrap}
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <article className={styles.card} key={review.id}>
        <button
          type="button"
          className={styles.close}
          onClick={() => {
            setDismissed(true);
            setVisible(false);
          }}
          aria-label="বন্ধ করুন"
        >
          <X size={14} aria-hidden="true" />
        </button>

        <header className={styles.header}>
          <span className={styles.initial} aria-hidden="true">
            {Array.from(review.name.trim())[0] || "শি"}
          </span>
          <div className={styles.meta}>
            <strong>{review.name}</strong>
            <span>
              recommends <b>Easy &amp; Smart Spoken English.</b>
            </span>
            <time>{review.date} · Facebook</time>
          </div>
          <span className={styles.facebookMark} aria-label="Facebook">
            f
          </span>
        </header>

        <p className={styles.text}>{review.text}</p>

        <footer className={styles.footer}>
          <span>Facebook recommendation</span>
          <span>Easy &amp; Smart Spoken English</span>
        </footer>
      </article>
    </aside>
  );
}
