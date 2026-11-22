"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./ielts-reading-landing.module.css";

type ReadingEvent =
  | "ielts_reading_landing_view"
  | "ielts_reading_hero_cta_click"
  | "ielts_reading_final_cta_click"
  | "ielts_reading_mobile_cta_click";

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      params?: Record<string, string | number | boolean>,
    ) => void;
  }
}

function trackReadingEvent(eventName: ReadingEvent) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, { course_slug: "easy-smart-ielts-reading" });
}

export function IeltsReadingPageView() {
  useEffect(() => {
    trackReadingEvent("ielts_reading_landing_view");
  }, []);

  return null;
}

export function IeltsReadingEnrollmentLink({
  href,
  eventName,
  id,
  className,
  tabIndex,
  children,
}: {
  href: string;
  eventName: ReadingEvent;
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
      onClick={() => trackReadingEvent(eventName)}
    >
      {children}
    </Link>
  );
}

export function IeltsReadingMobileBar({
  href,
  enrolled,
}: {
  href: string;
  enrolled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const heroCta = document.getElementById("ielts-reading-hero-cta");
    const finalCta = document.getElementById("ielts-reading-final-cta");
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
        <span>{enrolled ? "আপনার কোর্স" : "IELTS Reading"}</span>
      </div>
      <IeltsReadingEnrollmentLink
        className={styles.mobileEnrollmentButton}
        href={href}
        eventName="ielts_reading_mobile_cta_click"
        tabIndex={visible ? 0 : -1}
      >
        {enrolled ? "কোর্সে যান" : "আজই শুরু করুন"}
        <ArrowRight size={15} aria-hidden="true" />
      </IeltsReadingEnrollmentLink>
    </div>
  );
}
