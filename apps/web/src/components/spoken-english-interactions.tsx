"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mic2, Pause, Play } from "lucide-react";
import styles from "./spoken-english-landing.module.css";

type SpokenEnglishEvent =
  | "spoken_english_landing_view"
  | "spoken_english_hero_cta_click"
  | "spoken_english_final_cta_click"
  | "spoken_english_mobile_cta_click"
  | "spoken_english_curriculum_expand"
  | "spoken_english_course_preview_play";

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      params?: Record<string, string | number | boolean>,
    ) => void;
  }
}

export function trackSpokenEnglishEvent(
  eventName: SpokenEnglishEvent,
  params: Record<string, string | number | boolean> = {},
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    course_slug: "easy-smart-spoken-english",
    ...params,
  });
}

export function SpokenEnglishPageView() {
  useEffect(() => {
    trackSpokenEnglishEvent("spoken_english_landing_view");
  }, []);

  return null;
}

export function TrackedEnrollmentLink({
  href,
  eventName,
  id,
  className,
  tabIndex,
  children,
}: {
  href: string;
  eventName: SpokenEnglishEvent;
  id?: string;
  className: string;
  tabIndex?: number;
  children: ReactNode;
}) {
  return (
    <Link
      id={id}
      className={className}
      href={href}
      tabIndex={tabIndex}
      onClick={() => trackSpokenEnglishEvent(eventName)}
    >
      {children}
    </Link>
  );
}

export function SpeakingLessonPreview() {
  const [showSample, setShowSample] = useState(false);

  function toggleSample() {
    const next = !showSample;
    setShowSample(next);
    if (next) trackSpokenEnglishEvent("spoken_english_course_preview_play");
  }

  return (
    <div className={styles.methodPreview}>
      <div className={styles.methodPreviewTop}>
        <span className={styles.methodPreviewBrand}>
          <span className={styles.methodPreviewLogo}>e</span>
          LESSON PREVIEW · UNIT 1
        </span>
        <span className={styles.methodPreviewProgress}>
          01 <i /> 10
        </span>
      </div>
      <div className={styles.methodPrompt}>
        <span>YOUR SPEAKING PROMPT</span>
        <h3>What do you usually do in the morning?</h3>
        <p>আপনার সকালের রুটিন নিয়ে ইংরেজিতে বলুন।</p>
      </div>
      <div className={styles.methodPromptActions}>
        <span className={styles.methodSpeakHint}>
          <span>
            <Mic2 size={16} aria-hidden="true" />
          </span>
          <span>
            <b>এবার আপনি বলুন</b>
            <small>Pause করুন, তারপর মুখে বলুন</small>
          </span>
        </span>
        <button
          type="button"
          className={styles.methodSampleButton}
          aria-expanded={showSample}
          aria-controls="spoken-english-sample-response"
          onClick={toggleSample}
        >
          {showSample ? (
            <Pause size={14} aria-hidden="true" />
          ) : (
            <Play size={14} fill="currentColor" aria-hidden="true" />
          )}
          {showSample ? "উদাহরণ লুকান" : "একটি উদাহরণ দেখুন"}
        </button>
      </div>
      <div
        id="spoken-english-sample-response"
        className={`${styles.methodSample} ${showSample ? styles.methodSampleVisible : ""}`}
        aria-hidden={!showSample}
      >
        <div className={styles.methodSampleInner}>
          <span>
            <Check size={13} aria-hidden="true" /> SAMPLE RESPONSE
          </span>
          <p>“I usually have breakfast and get ready for my day.”</p>
        </div>
      </div>
    </div>
  );
}

export function SpokenEnglishMobileBar({ href, enrolled }: { href: string; enrolled: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const heroCta = document.getElementById("spoken-english-hero-cta");
    const finalCta = document.getElementById("spoken-english-final-cta");
    const footer = document.querySelector("footer");
    const visibility = new Map<Element, boolean>();
    const targets = [heroCta, finalCta, footer].filter((target): target is HTMLElement =>
      Boolean(target),
    );
    let heroWasSeen = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target, entry.isIntersecting);
          if (entry.target === heroCta && entry.isIntersecting) heroWasSeen = true;
        });

        const heroVisible = heroCta ? (visibility.get(heroCta) ?? true) : false;
        const finalVisible = finalCta ? (visibility.get(finalCta) ?? false) : false;
        const footerVisible = footer ? (visibility.get(footer) ?? false) : false;
        setVisible(heroWasSeen && !heroVisible && !finalVisible && !footerVisible);
      },
      { threshold: 0.05 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`${styles.mobileEnrollmentBar} ${visible ? styles.mobileEnrollmentBarVisible : ""}`}
      aria-hidden={!visible}
    >
      <div className={styles.mobileEnrollmentCopy}>
        <b>Easy &amp; Smart</b>
        <span>{enrolled ? "আপনার কোর্স" : "Spoken English Course"}</span>
      </div>
      <TrackedEnrollmentLink
        className={styles.mobileEnrollmentButton}
        href={href}
        eventName="spoken_english_mobile_cta_click"
        tabIndex={visible ? 0 : -1}
      >
        {enrolled ? "কোর্সে যান" : "আজই শুরু করুন"}
        <ArrowRight size={15} aria-hidden="true" />
      </TrackedEnrollmentLink>
    </div>
  );
}
