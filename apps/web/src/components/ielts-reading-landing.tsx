import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  FileSearch,
  ListChecks,
  MessageCircle,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react";
import styles from "./ielts-reading-landing.module.css";
import {
  IeltsReadingEnrollmentLink,
  IeltsReadingMobileBar,
  IeltsReadingPageView,
} from "./ielts-reading-interactions";

const COURSE_SLUG = "easy-smart-ielts-reading";
const ENROLLMENT_HREF = `/programs/${COURSE_SLUG}/checkout`;

const features = [
  {
    icon: ScanSearch,
    title: "রিডিং স্কিলস",
    description:
      "Skimming, Scanning আর Keyword ধরার কৌশল—পুরো প্যাসেজ না বুঝেও সঠিক উত্তর খোঁজার পদ্ধতি।",
    marker: "FIND THE SIGNAL",
  },
  {
    icon: ListChecks,
    title: "প্রশ্নভিত্তিক স্ট্র্যাটেজি",
    description:
      "True/False/Not Given, Matching Headings, Summary আর প্রতিটি প্রশ্ন টাইপের আলাদা সমাধান কৌশল।",
    marker: "QUESTION BY QUESTION",
  },
  {
    icon: FileSearch,
    title: "গাইডেড প্র্যাকটিস",
    description:
      "প্রতিটি লেসনে ধাপে ধাপে প্রশ্ন সমাধান—কেন উত্তরটা সঠিক বা ভুল, তা হাতে-কলমে দেখানো।",
    marker: "FOLLOW THE EVIDENCE",
  },
  {
    icon: Target,
    title: "১০০% ফ্যামিলিয়ারিটি",
    description:
      "পরীক্ষার বাস্তব প্যাসেজ, ট্র্যাপ আর টাইম ম্যানেজমেন্টের সাথে পুরোপুরি পরিচিত হওয়া।",
    marker: "KNOW THE FORMAT",
  },
  {
    icon: Clock3,
    title: "প্রতিদিনের রুটিন",
    description:
      "দিনে মাত্র ২০ মিনিট। কাজের বা পড়াশোনার ব্যস্ততার মাঝেও ধারাবাহিক প্রস্তুতি।",
    marker: "20 MIN / DAY",
  },
  {
    icon: MessageCircle,
    title: "কখনো একা না",
    description: "লাইভ সাপোর্ট আর আমাদের কমিউনিটি—আটকে গেলে সমাধান হাতের কাছেই।",
    marker: "LIVE SUPPORT",
  },
];

const pillars = [
  { number: "01", title: "Skills", description: "প্যাসেজে তথ্য খুঁজুন" },
  { number: "02", title: "Strategy", description: "প্রশ্নের ধরন বুঝুন" },
  { number: "03", title: "Practice", description: "ধাপে ধাপে সমাধান করুন" },
  { number: "04", title: "Familiarity", description: "পরীক্ষার সাথে পরিচিত হন" },
];

const outcomes = [
  "৬০ মিনিটের ভেতর সবগুলো প্যাসেজ ও প্রশ্ন সময়মতো শেষ করতে",
  "True/False/Not Given এবং কঠিন প্রশ্নগুলোর প্যাটার্ন সহজে ধরতে",
  "অনুমানের বদলে প্রমাণ দেখে আত্মবিশ্বাসের সাথে সঠিক উত্তর দিতে",
];

const phases = [
  {
    number: "01",
    title: "Reading Skills",
    description: "Skimming, scanning, keyword mapping, context বোঝা",
    tag: "BUILD THE FOUNDATION",
  },
  {
    number: "02",
    title: "Question Strategies",
    description: "TFNG, headings, matching, completion ও সব প্রশ্ন টাইপ",
    tag: "CHOOSE THE APPROACH",
  },
  {
    number: "03",
    title: "Guided Practice",
    description: "বাস্তব প্যাসেজে লাইভ সমাধান ও কমন ট্র্যাপ ধরা",
    tag: "WORK THROUGH EVIDENCE",
  },
  {
    number: "04",
    title: "Test Familiarity",
    description: "পরীক্ষার চাপ, টাইমিং আর ফুল-লেংথ প্রস্তুতি",
    tag: "BRING IT TO THE TEST",
  },
];

export function IeltsReadingLanding({ enrolled = false }: { enrolled?: boolean }) {
  const ctaHref = enrolled
    ? `/dashboard/courses/${COURSE_SLUG}/learn`
    : ENROLLMENT_HREF;
  const ctaLabel = enrolled ? "কোর্সে ফিরে যান" : "আজই শুরু করুন";

  return (
    <>
      <IeltsReadingPageView />
      <main className={styles.landing} lang="bn">
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link
              className={styles.wordmark}
              href="/programs/easy-smart-ielts-reading"
              aria-label="Easy & Smart IELTS Reading — home"
            >
              <span className={styles.wordmarkName}>
                Easy <i>&amp;</i> Smart
              </span>
              <span className={styles.wordmarkCourse}>
                <i>IELTS</i> READING
              </span>
            </Link>

            <nav className={styles.navigation} aria-label="কোর্স নেভিগেশন">
              <a href="#included">কী কী পাচ্ছেন</a>
              <a href="#outcomes">কী শিখবেন</a>
              <a href="#curriculum">কারিকুলাম</a>
              <Link href="/faq">FAQ</Link>
            </nav>

            <IeltsReadingEnrollmentLink
              className={styles.headerCta}
              href={ctaHref}
              eventName="ielts_reading_hero_cta_click"
            >
              {ctaLabel}
              <ArrowRight aria-hidden="true" size={15} />
            </IeltsReadingEnrollmentLink>
          </div>
        </header>

        <section className={styles.hero} id="course" aria-labelledby="reading-title">
          <div className={styles.heroRule} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span aria-hidden="true" />
                EASY &amp; SMART SERIES
              </div>
              <p className={styles.programName}>
                Easy &amp; Smart <span>IELTS</span> Reading
              </p>
              <h1 id="reading-title" className={styles.heroTitle}>
                <span className={styles.heroTitleQuestion}>IELTS Reading-এ সময় ফুরিয়ে যায়?</span>
                {" "}
                <span className={styles.heroTitlePromise}>
                  <span className={styles.heroTitleDuration}>৪০ দিনে</span>
                  <span className={styles.heroTitleResult}>স্কোর বাড়াতে শিখুন</span>
                </span>
              </h1>
              <p className={styles.heroProblem}>
                <span className={styles.heroPainPoint}>প্যাসেজ বুঝতে গিয়ে সময় শেষ হয়ে যাচ্ছে?</span>
                <span className={styles.heroReassurance}>
                  সমস্যা আপনার ইংরেজির না, <strong>সমস্যা সঠিক কৌশল আর অভ্যাস না থাকায়।</strong>
                </span>
              </p>
              <p className={styles.heroDescription}>
                দিনে মাত্র ১টা ভিডিও, মাত্র ২০ মিনিটে। Skills, Strategy, Practice আর
                Familiarity—সব একসাথে।
              </p>

              <div className={styles.heroActions}>
                <IeltsReadingEnrollmentLink
                  id="ielts-reading-hero-cta"
                  className={styles.primaryCta}
                  href={ctaHref}
                  eventName="ielts_reading_hero_cta_click"
                >
                  {ctaLabel}
                  <ArrowRight aria-hidden="true" size={18} />
                </IeltsReadingEnrollmentLink>
                <div className={styles.heroMicrocopy}>
                  <span>
                    <Check size={14} aria-hidden="true" /> সাথে সাথে অ্যাক্সেস
                  </span>
                  <i aria-hidden="true" />
                  <span>
                    <Check size={14} aria-hidden="true" /> লাইভ সাপোর্ট
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual} aria-label="IELTS Reading study workspace">
              <div className={styles.visualMeta}>
                <span className={styles.visualMetaBrand}>
                  <span>e</span> EASY &amp; SMART
                </span>
                <span className={styles.visualBadge}>40 VIDEOS · 20 MIN/DAY</span>
              </div>
              <div className={styles.readingSheet}>
                <div className={styles.sheetHeader}>
                  <span>READING WORKSPACE</span>
                  <span>ILLUSTRATIVE EXAMPLE</span>
                </div>
                <div className={styles.sheetBody}>
                  <div className={styles.sheetPageNumber}>01 <i /> 03</div>
                  <h2>Find the idea.<br />Follow the evidence.</h2>
                  <p className={styles.passageLabel}>PASSAGE EXCERPT</p>
                  <p className={styles.passageText}>
                    Urban green spaces can help lower <mark>surface temperatures</mark> and
                    create more comfortable routes for people walking through the city.
                  </p>
                  <div className={styles.annotationRow}>
                    <span className={styles.annotationLine} aria-hidden="true" />
                    <span>
                      <b>KEYWORD FOUND</b>
                      <small>surface temperatures</small>
                    </span>
                    <span className={styles.annotationCheck} aria-hidden="true">
                      <Check size={14} />
                    </span>
                  </div>
                  <div className={styles.questionReference}>
                    <span className={styles.questionNumber}>Q. 04</span>
                    <span>Locate the supporting evidence in the passage.</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                </div>
                <div className={styles.sheetFooter}>
                  <span><BookOpen size={13} aria-hidden="true" /> SCAN · MATCH · VERIFY</span>
                  <span>PAGE 01</span>
                </div>
              </div>
              <div className={styles.visualIndex} aria-hidden="true">READ WITH INTENTION</div>
            </div>
          </div>
          <div className={styles.heroBottom} aria-hidden="true">
            <span>SKILLS</span><i /><span>STRATEGY</span><i /><span>PRACTICE</span><i /><span>FAMILIARITY</span>
          </div>
        </section>

        <section className={styles.statsSection} aria-label="কোর্সের পরিসংখ্যান">
          <dl className={styles.statsInner}>
            <div className={styles.statItem}>
              <dd>৪০</dd><dt>ভিডিও লেসন</dt>
            </div>
            <div className={styles.statItem}>
              <dd>২০</dd><dt>মিনিট প্রতিদিন</dt>
            </div>
            <div className={styles.statItem}>
              <dd>১০০%</dd><dt>সিলেবাস কভার</dt>
            </div>
          </dl>
        </section>

        <section className={styles.featuresSection} id="included" aria-labelledby="included-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <span className={styles.sectionEyebrow}>WHAT&apos;S INCLUDED</span>
              <h2 id="included-title">কী কী পাচ্ছেন?</h2>
              <p>প্রথম দিন থেকেই স্কোর বাড়ানোর বাস্তব কৌশল।</p>
            </div>
            <div className={styles.featureGrid}>
              {features.map(({ icon: Icon, title, description, marker }, index) => (
                <article className={styles.featureCard} key={title}>
                  <div className={styles.featureTop}>
                    <span className={styles.featureNumber}>0{index + 1}</span>
                    <span className={styles.featureIcon} aria-hidden="true"><Icon size={19} /></span>
                  </div>
                  <span className={styles.featureMarker}>{marker}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.methodSection} aria-labelledby="method-title">
          <div className={styles.methodInner}>
            <div className={styles.methodIntro}>
              <span className={styles.sectionEyebrow}>HOW IT WORKS</span>
              <h2 id="method-title">৪০ দিনে কীভাবে প্রস্তুত হবেন</h2>
              <p>প্রতিদিন মাত্র ২০ মিনিটে ১টি ভিডিও। নিয়ম বুঝুন, কৌশল প্রয়োগ করুন, আর আত্মবিশ্বাস বাড়ান।</p>
              <span className={styles.coveredBadge}><Sparkles size={14} aria-hidden="true" /> 100% COVERED</span>
            </div>
            <div className={styles.pillarPath}>
              {pillars.map((pillar, index) => (
                <div className={styles.pillarWrap} key={pillar.title}>
                  <article className={styles.pillar}>
                    <span className={styles.pillarNumber}>{pillar.number}</span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                  </article>
                  {index < pillars.length - 1 && <span className={styles.pillarConnector} aria-hidden="true"><ArrowRight size={16} /></span>}
                </div>
              ))}
            </div>
            <div className={styles.lessonTotal}>
              <span className={styles.lessonTotalIcon}><BookOpen size={17} aria-hidden="true" /></span>
              <span><b>৪০ লেসন</b><small>দিনে একটি ভিডিও · ২০ মিনিট প্রতিদিন</small></span>
              <span className={styles.lessonTrack} aria-hidden="true"><i /></span>
            </div>
          </div>
        </section>

        <section className={styles.outcomesSection} id="outcomes" aria-labelledby="outcomes-title">
          <div className={styles.outcomesInner}>
            <div className={styles.outcomesIntro}>
              <span className={styles.sectionEyebrow}>WHAT YOU WILL LEARN</span>
              <h2 id="outcomes-title">৪০ দিন পর আপনি পারবেন</h2>
            </div>
            <ol className={styles.outcomeList}>
              {outcomes.map((outcome, index) => (
                <li key={outcome}>
                  <span className={styles.outcomeNumber}>0{index + 1}</span>
                  <p>{outcome}</p>
                  <Check size={18} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
          <span className={styles.marginNote} aria-hidden="true">EVIDENCE OVER GUESSWORK</span>
        </section>

        <section className={styles.curriculumSection} id="curriculum" aria-labelledby="curriculum-title">
          <div className={styles.curriculumInner}>
            <div className={styles.curriculumIntro}>
              <span className={styles.sectionEyebrow}>CURRICULUM</span>
              <h2 id="curriculum-title">৪০টি ভিডিও, ৪টি মূল স্তম্ভে</h2>
              <p>প্রতিদিন ২০ মিনিট করে ৪০টি লেসন। Skills, Strategy, Practice আর Familiarity—সব ১০০% সম্পন্ন।</p>
              <div className={styles.curriculumMeta}>
                <span>40 VIDEOS</span><i /><span>20 MIN / DAY</span>
              </div>
            </div>
            <div className={styles.phaseList}>
              {phases.map((phase) => (
                <article className={styles.phase} key={phase.number}>
                  <span className={styles.phaseNumber}>{phase.number}</span>
                  <div className={styles.phaseContent}>
                    <span className={styles.phaseTag}>{phase.tag}</span>
                    <h3>{phase.title}</h3>
                    <p>{phase.description}</p>
                  </div>
                  <span className={styles.phaseMark} aria-hidden="true"><Check size={16} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCtaSection} id="final-enrollment" aria-labelledby="final-cta-title">
          <div className={styles.finalCtaInner}>
            <span className={styles.finalCtaEyebrow}>YOUR NEXT STEP</span>
            <h2 id="final-cta-title">আপনি কি জানেন?</h2>
            <p>সঠিক পদ্ধতিতে প্রস্তুতি নিলে Reading-এ ভালো স্কোর করা অনেক সহজ। এবার আপনার পালা।</p>
            <IeltsReadingEnrollmentLink
              id="ielts-reading-final-cta"
              className={styles.finalCtaButton}
              href={ctaHref}
              eventName="ielts_reading_final_cta_click"
            >
              {enrolled ? "কোর্সে ফিরে যান" : "চলুন শুরু করি"}
              <ArrowRight size={17} aria-hidden="true" />
            </IeltsReadingEnrollmentLink>
            <span className={styles.finalCtaFootnote}>EASY &amp; SMART SERIES <i /> IELTS READING</span>
          </div>
        </section>
      </main>
      <IeltsReadingMobileBar href={ctaHref} enrolled={enrolled} />
    </>
  );
}
