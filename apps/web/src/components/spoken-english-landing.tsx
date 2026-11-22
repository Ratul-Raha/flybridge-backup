import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Languages,
  MessageCircle,
  MessagesSquare,
  Mic2,
  Pause,
  Play,
  Star,
  Timer,
  Users,
  UserRound,
} from "lucide-react";
import styles from "./spoken-english-landing.module.css";
import { SpokenEnglishCurriculum } from "./spoken-english-curriculum";
import {
  SpeakingLessonPreview,
  SpokenEnglishMobileBar,
  SpokenEnglishPageView,
  TrackedEnrollmentLink,
} from "./spoken-english-interactions";

const ENROLLMENT_HREF = "/programs/easy-smart-spoken-english/checkout";

const navigation = [
  { label: "কোর্স সম্পর্কে", href: "#course" },
  { label: "কী শিখবেন", href: "#outcomes" },
  { label: "কারিকুলাম", href: "#curriculum" },
  { label: "FAQ", href: "/faq" },
];

export type SpokenEnglishReview = {
  id: string;
  rating: number;
  text: string;
  userName: string;
};

const beforeItems = ["কথা বলার আগে অনুবাদ করা", "ভুল হওয়ার ভয়", "সহজ বাক্যেও আটকে যাওয়া"];

const afterItems = [
  "পরিচিত পরিস্থিতিতে ইংরেজি বলা",
  "ছোট ছোট বাক্য দিয়ে শুরু",
  "ধীরে ধীরে নিজের কথা প্রকাশ করা",
];

export function SpokenEnglishLanding({
  enrolled = false,
  reviews = [],
}: {
  enrolled?: boolean;
  reviews?: SpokenEnglishReview[];
}) {
  const ctaHref = enrolled ? "/dashboard/courses/easy-smart-spoken-english/learn" : ENROLLMENT_HREF;
  const ctaLabel = enrolled ? "কোর্সে ফিরে যান" : "আজই শুরু করুন";

  return (
    <>
      <SpokenEnglishPageView />
      <main className={styles.landing} lang="bn">
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link
              className={styles.wordmark}
              href="/easy-smart-spoken-english"
              aria-label="Easy & Smart Spoken English — home"
            >
              <span className={styles.wordmarkName}>
                Easy <i>&</i> Smart
              </span>
              <span className={styles.wordmarkCourse}>SPOKEN ENGLISH</span>
            </Link>

            <nav className={styles.navigation} aria-label="কোর্স নেভিগেশন">
              {navigation.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <TrackedEnrollmentLink
              className={styles.headerCta}
              href={ctaHref}
              eventName="spoken_english_hero_cta_click"
            >
              {ctaLabel}
              <ArrowRight aria-hidden="true" size={15} />
            </TrackedEnrollmentLink>
          </div>
        </header>

        <section className={styles.hero} id="course" aria-labelledby="spoken-english-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} aria-hidden="true" />
                100-DAY SPOKEN ENGLISH COURSE
              </div>

              <h1 id="spoken-english-title" className={styles.title}>
                <span className={styles.titleBengali}>১০০ দিনে হয়ে উঠুন</span>
                <span className={styles.titleAccent}>English-এর Boss</span>
              </h1>

              <p className={styles.problem}>
                ইংরেজি বুঝেন, কিন্তু বলতে গেলে আটকে যান?
                <br />
                সমস্যা আপনার না, সমস্যা মাথায় অনুবাদ করার অভ্যাসে।
              </p>

              <p className={styles.method}>
                <span className={styles.methodMark} aria-hidden="true">
                  “
                </span>
                Don&apos;t Translate, Just Express.
              </p>

              <p className={styles.description}>
                দিনে মাত্র ১টা লেসন, মাত্র ২০ মিনিটে। ধাপে ধাপে শিখুন ইংরেজিতে নিজের কথা প্রকাশ
                করতে।
              </p>

              <div className={styles.actions}>
                <TrackedEnrollmentLink
                  id="spoken-english-hero-cta"
                  className={styles.primaryCta}
                  href={ctaHref}
                  eventName="spoken_english_hero_cta_click"
                >
                  {ctaLabel}
                  <ArrowRight aria-hidden="true" size={18} />
                </TrackedEnrollmentLink>
                <span className={styles.lessonCount}>
                  100 LESSONS <b>·</b> 10 UNITS
                </span>
              </div>

              <div className={styles.trust} aria-label="কোর্স সুবিধা">
                <span>
                  <Check aria-hidden="true" size={15} /> সাথে সাথে অ্যাক্সেস
                </span>
                <span>
                  <Check aria-hidden="true" size={15} /> লাইভ সাপোর্ট
                </span>
              </div>
            </div>

            <div className={styles.preview} aria-label="কোর্স লেসনের নমুনা">
              <div className={styles.previewOrbit} aria-hidden="true" />
              <div className={`${styles.floatBadge} ${styles.lessonsBadge}`}>
                <span className={styles.badgeIcon}>
                  <Play aria-hidden="true" size={12} fill="currentColor" />
                </span>
                <span>
                  <b>100 LESSONS</b>
                  <small>একটি করে ধাপ</small>
                </span>
              </div>

              <div className={styles.lessonCard}>
                <div className={styles.lessonTopbar}>
                  <span className={styles.lessonBrand}>
                    <span className={styles.brandMark}>e</span> EASY & SMART
                  </span>
                  <span className={styles.lessonTag}>LESSON 01</span>
                </div>
                <div className={styles.lessonContent}>
                  <span className={styles.lessonKicker}>TODAY&apos;S SPEAKING PRACTICE</span>
                  <p className={styles.lessonPrompt}>
                    Tell me about
                    <br />
                    your morning.
                  </p>
                  <p className={styles.lessonBangla}>আপনার সকালটা কেমন কাটে—ইংরেজিতে বলুন।</p>

                  <div className={styles.speakPrompt}>
                    <span className={styles.micIcon}>
                      <Mic2 aria-hidden="true" size={17} />
                    </span>
                    <span>
                      <b>এবার আপনি বলুন</b>
                      <small>Pause the video · Speak out loud</small>
                    </span>
                    <span className={styles.soundBars} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>

                  <div className={styles.progressMeta}>
                    <span>YOUR FIRST STEP</span>
                    <b>
                      01 <small>/ 100</small>
                    </b>
                  </div>
                  <div className={styles.progressTrack}>
                    <span />
                  </div>
                </div>
                <div className={styles.lessonBottom}>
                  <span>
                    <span className={styles.playButton}>
                      <Play aria-hidden="true" size={12} fill="currentColor" />
                    </span>{" "}
                    Lesson preview
                  </span>
                  <span>20 MIN / DAY</span>
                </div>
              </div>

              <div className={`${styles.floatBadge} ${styles.timeBadge}`}>
                <span className={styles.timeDot} aria-hidden="true" />
                <span>
                  <b>20 MIN / DAY</b>
                  <small>আপনার নিজের গতিতে</small>
                </span>
              </div>
              <div className={styles.decorativeNote} aria-hidden="true">
                “
              </div>
            </div>
          </div>
          <div className={styles.heroBottomFade} aria-hidden="true" />
        </section>

        <section className={styles.statsSection} aria-label="কোর্সের পরিসংখ্যান">
          <div className={styles.statsInner}>
            <dl className={styles.statsGrid}>
              <div className={styles.statItem}>
                <dt>লেসন</dt>
                <dd>১০০</dd>
              </div>
              <div className={styles.statItem}>
                <dt>ইউনিট</dt>
                <dd>১০</dd>
              </div>
              <div className={styles.statItem}>
                <dt>ফ্রি বই</dt>
                <dd>১</dd>
              </div>
            </dl>
            <p className={styles.statsNote}>
              A complete speaking journey, from the basics to real-life conversations.
            </p>
          </div>
        </section>

        <section
          className={styles.transformationSection}
          id="transformation"
          aria-labelledby="transformation-title"
        >
          <div className={styles.transformationInner}>
            <div className={styles.transformationIntro}>
              <span className={styles.transformationEyebrow}>THE SHIFT</span>
              <h2 id="transformation-title" className={styles.transformationTitle}>
                ইংরেজি বুঝেন, কিন্তু বলতে গেলে আটকে যান?
              </h2>
              <p className={styles.transformationDescription}>
                আপনি অনেক ইংরেজি শব্দ জানেন। Grammar-ও কিছুটা বোঝেন। কিন্তু কথা বলতে গেলেই মাথায়
                বাংলা আসে, তারপর ইংরেজিতে অনুবাদ করতে গিয়ে কথাটা আটকে যায়। এই অভ্যাসটাই ধীরে ধীরে
                বদলাতে সাহায্য করবে Easy &amp; Smart Spoken English Course.
              </p>
            </div>

            <div className={styles.transformationCards}>
              <article className={`${styles.transformationCard} ${styles.beforeCard}`}>
                <div className={styles.transformationCardTop}>
                  <span className={styles.transformationCardLabel}>BEFORE · THE OLD HABIT</span>
                  <span className={styles.transformationIcon} aria-hidden="true">
                    <Languages size={19} />
                  </span>
                </div>
                <h3 className={styles.transformationCardTitle}>মাথায় বাংলা, মুখে ইংরেজি</h3>
                <ul className={styles.transformationList}>
                  {beforeItems.map((item) => (
                    <li key={item}>
                      <span className={styles.beforeMarker} aria-hidden="true">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <span className={styles.transformConnector} aria-hidden="true">
                <ArrowRight className={styles.desktopTransformArrow} size={19} />
                <ArrowDown className={styles.mobileTransformArrow} size={19} />
              </span>

              <article className={`${styles.transformationCard} ${styles.afterCard}`}>
                <div className={styles.transformationCardTop}>
                  <span className={styles.transformationCardLabel}>AFTER · A NEW WAY</span>
                  <span className={styles.transformationIcon} aria-hidden="true">
                    <MessageCircle size={19} />
                  </span>
                </div>
                <h3 className={styles.transformationCardTitle}>ভাবুন, বলুন, Express করুন</h3>
                <ul className={styles.transformationList}>
                  {afterItems.map((item) => (
                    <li key={item}>
                      <span className={styles.afterMarker} aria-hidden="true">
                        <Check size={13} strokeWidth={2.7} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <p className={styles.transformationReassurance}>
              <span>আপনি ইংরেজি পারেন না, এমন নয়।</span> আপনার দরকার সঠিক speaking practice.
            </p>
          </div>
        </section>

        <section className={styles.featuresSection} id="features" aria-labelledby="features-title">
          <div className={styles.featuresInner}>
            <div className={styles.featuresIntro}>
              <span className={styles.featuresEyebrow}>WHAT&apos;S INCLUDED</span>
              <h2 id="features-title" className={styles.featuresTitle}>
                কী কী পাচ্ছেন?
              </h2>
              <p className={styles.featuresDescription}>প্রথম দিন থেকেই মুখে বলা শুরু।</p>
            </div>

            <div className={styles.featureGrid}>
              <article className={styles.featureCard}>
                <div
                  className={`${styles.featureVisual} ${styles.talkbackVisual}`}
                  aria-hidden="true"
                >
                  <div className={styles.videoTopbar}>
                    <span className={styles.videoWindowDots}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>LESSON 08 · SPEAKING PRACTICE</span>
                  </div>
                  <div className={styles.videoPrompt}>
                    <span>YOUR TURN</span>
                    <b>What would you say?</b>
                  </div>
                  <div className={styles.videoPauseRow}>
                    <span className={styles.pauseButton}>
                      <Pause size={13} fill="currentColor" />
                    </span>
                    <span>
                      <b>Pause &amp; speak</b>
                      <small>ভিডিও থামিয়ে বলুন</small>
                    </span>
                    <span className={styles.visualSoundBars}>
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                  <div className={styles.videoProgress}>
                    <span />
                  </div>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>01</span>
                  <span className={styles.featureTag}>SPEAK OUT LOUD</span>
                </div>
                <h3 className={styles.featureTitle}>টক-ব্যাক ভিডিও</h3>
                <p className={styles.featureDescription}>
                  ভিডিও থামবে, আপনি বলবেন। শুধু দেখা না, মুখে বলা।
                </p>
              </article>

              <article className={styles.featureCard}>
                <div className={`${styles.featureVisual} ${styles.localVisual}`} aria-hidden="true">
                  <div className={styles.localPrompt}>
                    <span>বাংলায় বুঝুন</span>
                    <b>আজ আপনার দিন কেমন গেল?</b>
                  </div>
                  <div className={styles.localConnector}>
                    <ArrowRight size={16} />
                  </div>
                  <div className={styles.localAnswer}>
                    <span>SAY IT IN ENGLISH</span>
                    <b>How was your day?</b>
                  </div>
                  <span className={styles.localStamp}>
                    <Languages size={13} /> বাংলা + English
                  </span>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>02</span>
                  <span className={styles.featureTag}>MADE FOR US</span>
                </div>
                <h3 className={styles.featureTitle}>একদম আমাদের মতো করে</h3>
                <p className={styles.featureDescription}>
                  বাংলায় বোঝানো, আমাদের চেনা পরিস্থিতি দিয়ে।
                </p>
              </article>

              <article className={styles.featureCard}>
                <div
                  className={`${styles.featureVisual} ${styles.mistakeVisual}`}
                  aria-hidden="true"
                >
                  <span className={styles.mistakeKicker}>A COMMON BANGLA TRAP</span>
                  <div className={styles.wrongPhrase}>
                    <span>COMMON MISTAKE</span>
                    <b>Myself Rafi</b>
                    <i>×</i>
                  </div>
                  <div className={styles.correctPhrase}>
                    <span>SAY THIS INSTEAD</span>
                    <b>I&apos;m Rafi.</b>
                    <Check size={15} />
                  </div>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>03</span>
                  <span className={styles.featureTag}>SPEAK NATURALLY</span>
                </div>
                <h3 className={styles.featureTitle}>বাংলার ফাঁদ</h3>
                <p className={styles.featureDescription}>
                  “Myself Rafi” বলেন? পরিচিত ভুলগুলো ধরিয়ে শিখুন আরও স্বাভাবিকভাবে বলতে।
                </p>
              </article>

              <article className={styles.featureCard}>
                <div className={`${styles.featureVisual} ${styles.bookVisual}`}>
                  <span className={styles.bookIncludedBadge}>
                    <BookOpen size={12} /> INCLUDED FREE
                  </span>
                  <Image
                    src="/programs/spoken-english-book.png"
                    alt="Easy & Smart Spoken English Course Book cover"
                    width={158}
                    height={224}
                    sizes="158px"
                    className={styles.bookCover}
                  />
                  <span className={styles.bookVisualNote}>
                    ভিডিওতে শিখুন
                    <br />
                    বইয়ে প্র্যাকটিস করুন
                  </span>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>04</span>
                  <span className={styles.featureTag}>YOUR PRACTICE BOOK</span>
                </div>
                <h3 className={styles.featureTitle}>ফ্রি কোর্স বুক</h3>
                <p className={styles.featureDescription}>
                  কোর্সের সাথে প্র্যাকটিস বুকও পাচ্ছেন। ভিডিওতে শিখুন, বইয়ে প্র্যাকটিস করুন।
                </p>
              </article>

              <article className={styles.featureCard}>
                <div
                  className={`${styles.featureVisual} ${styles.certificateVisual}`}
                  aria-hidden="true"
                >
                  <div className={styles.certificateSheet}>
                    <span className={styles.certificateEyebrow}>COURSE COMPLETION</span>
                    <span className={styles.certificateRule} />
                    <b>Spoken English</b>
                    <span className={styles.certificateSub}>Certificate of Completion</span>
                    <BadgeCheck className={styles.certificateSeal} size={30} />
                  </div>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>05</span>
                  <span className={styles.featureTag}>CELEBRATE YOUR PROGRESS</span>
                </div>
                <h3 className={styles.featureTitle}>সার্টিফিকেট</h3>
                <p className={styles.featureDescription}>
                  কোর্সটি শেষ করে অর্জন করুন Completion Certificate.
                </p>
              </article>

              <article className={styles.featureCard}>
                <div
                  className={`${styles.featureVisual} ${styles.supportVisual}`}
                  aria-hidden="true"
                >
                  <div className={styles.supportHeader}>
                    <span className={styles.supportAvatar}>
                      <Users size={17} />
                    </span>
                    <span>
                      <b>LEARNING COMMUNITY</b>
                      <small>Practice together</small>
                    </span>
                    <span className={styles.supportOnline} />
                  </div>
                  <div className={`${styles.chatBubble} ${styles.questionBubble}`}>
                    কথা বলতে গিয়ে আটকে গেলে কী করব?
                  </div>
                  <div className={`${styles.chatBubble} ${styles.replyBubble}`}>
                    ছোট বাক্য দিয়ে শুরু করুন—ধীরে ধীরে সহজ হবে।
                  </div>
                  <span className={styles.supportHelp}>
                    <MessageCircle size={13} /> LIVE SUPPORT
                  </span>
                </div>
                <div className={styles.featureHeadingRow}>
                  <span className={styles.featureIndex}>06</span>
                  <span className={styles.featureTag}>LEARN TOGETHER</span>
                </div>
                <h3 className={styles.featureTitle}>কখনো একা না</h3>
                <p className={styles.featureDescription}>
                  লাইভ সাপোর্ট আর লার্নার কমিউনিটিতে প্র্যাকটিস চালিয়ে যান।
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.bookSection} id="book" aria-labelledby="book-title">
          <div className={styles.bookInner}>
            <div className={styles.bookStage}>
              <div className={styles.bookHalo} aria-hidden="true" />
              <span className={styles.bookFreeBadge}>
                <BookOpen size={14} aria-hidden="true" /> FREE WITH THE COURSE
              </span>
              <Image
                src="/programs/spoken-english-book.png"
                alt="Easy & Smart Spoken English Course Book cover"
                width={421}
                height={598}
                sizes="(max-width: 767px) 210px, (max-width: 1023px) 260px, 320px"
                className={styles.editorialBookCover}
              />
            </div>

            <div className={styles.bookCopy}>
              <span className={styles.bookEyebrow}>FREE COURSE BOOK</span>
              <h2 id="book-title" className={styles.bookTitle}>
                বইটা কোর্সের সাথেই পাচ্ছেন
              </h2>
              <p className={styles.bookDescription}>
                প্রতিটা লেসনের সাথে বইয়ের পেজ মেলানো। ভিডিওতে শিখুন, বইয়ে প্র্যাকটিস করুন।
              </p>

              <div className={styles.bookDetails}>
                <span className={styles.bookDetailsIcon} aria-hidden="true">
                  <BookOpen size={19} />
                </span>
                <span className={styles.bookDetailsName}>
                  <small>YOUR COURSE COMPANION</small>
                  <b>Easy &amp; Smart Spoken English Course Book</b>
                </span>
                <span className={styles.bookPrice}>ফ্রি</span>
              </div>

              <div className={styles.bookPracticeFlow}>
                <span>ভিডিওতে শিখুন</span>
                <ArrowRight size={15} aria-hidden="true" />
                <span>বইয়ে প্র্যাকটিস করুন</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.outcomesSection} id="outcomes" aria-labelledby="outcomes-title">
          <div className={styles.outcomesGlow} aria-hidden="true" />
          <div className={styles.outcomesInner}>
            <div className={styles.outcomesIntro}>
              <span className={styles.outcomesEyebrow}>YOUR SPEAKING JOURNEY</span>
              <h2 id="outcomes-title" className={styles.outcomesTitle}>
                ১০০ দিন পর আপনি পারবেন
              </h2>
              <p className={styles.outcomesDescription}>
                শুধু English শেখা নয়, প্রতিদিনের পরিচিত পরিস্থিতিতে নিজের কথা প্রকাশ করতে শিখুন।
              </p>
            </div>

            <div className={styles.outcomesGrid}>
              <article className={styles.outcomeCard}>
                <div className={styles.outcomeCardTop}>
                  <span className={styles.outcomeNumber}>01</span>
                  <span className={styles.outcomeIcon} aria-hidden="true">
                    <UserRound size={21} />
                  </span>
                </div>
                <span className={styles.outcomeEnglish}>INTRODUCE YOURSELF</span>
                <h3 className={styles.outcomeCardTitle}>নিজের পরিচয় দিতে</h3>
                <p className={styles.outcomeCardDescription}>
                  খুব সহজে আর স্মার্টলি নিজের পরিচয় দিতে।
                </p>
              </article>

              <article className={styles.outcomeCard}>
                <div className={styles.outcomeCardTop}>
                  <span className={styles.outcomeNumber}>02</span>
                  <span className={styles.outcomeIcon} aria-hidden="true">
                    <MessagesSquare size={21} />
                  </span>
                </div>
                <span className={styles.outcomeEnglish}>REAL-LIFE CONVERSATIONS</span>
                <h3 className={styles.outcomeCardTitle}>বাস্তব জীবনে কথা বলতে</h3>
                <p className={styles.outcomeCardDescription}>
                  দোকান, ডাক্তার, অফিস আর ইন্টারভিউতে ইংরেজিতে কথা বলতে।
                </p>
              </article>

              <article className={styles.outcomeCard}>
                <div className={styles.outcomeCardTop}>
                  <span className={styles.outcomeNumber}>03</span>
                  <span className={styles.outcomeIcon} aria-hidden="true">
                    <Timer size={21} />
                  </span>
                </div>
                <span className={styles.outcomeEnglish}>SPEAK FOR TWO MINUTES</span>
                <h3 className={styles.outcomeCardTitle}>না থেমে কথা বলতে</h3>
                <p className={styles.outcomeCardDescription}>না থেমে ২ মিনিট ইংরেজিতে বলতে।</p>
              </article>
            </div>
          </div>
        </section>

        <section
          className={styles.curriculumSection}
          id="curriculum"
          aria-labelledby="curriculum-title"
        >
          <div className={styles.curriculumGlow} aria-hidden="true" />
          <div className={styles.curriculumInner}>
            <div className={styles.curriculumAside}>
              <span className={styles.curriculumEyebrow}>YOUR 100-LESSON JOURNEY</span>
              <h2 id="curriculum-title" className={styles.curriculumTitle}>
                ১০টি ইউনিট, ধাপে ধাপে
              </h2>
              <p className={styles.curriculumDescription}>
                প্রতিটা ইউনিটে ১০টি লেসন। Hello থেকে শুরু, শেষে ২ মিনিট না থেমে কথা বলা।
              </p>

              <div className={styles.journeyCard}>
                <div className={styles.journeyCardHeader}>
                  <span>THE SPEAKING PATH</span>
                  <span>১০০ লেসন</span>
                </div>
                <div className={styles.journeyTrack} aria-hidden="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <i key={index} className={index === 0 ? styles.journeyStepActive : ""} />
                  ))}
                </div>
                <div className={styles.journeyEndpoints}>
                  <span>HELLO, ME</span>
                  <ArrowRight size={14} aria-hidden="true" />
                  <span>REAL-LIFE CONFIDENCE</span>
                </div>
              </div>
            </div>

            <SpokenEnglishCurriculum />
          </div>
        </section>

        <section className={styles.methodSection} id="method" aria-labelledby="method-title">
          <div className={styles.methodInner}>
            <div className={styles.methodIntro}>
              <span className={styles.methodEyebrow}>DON&apos;T TRANSLATE, JUST EXPRESS</span>
              <h2 id="method-title" className={styles.methodTitle}>
                শুধু দেখবেন না, মুখে বলবেন
              </h2>
              <p className={styles.methodDescription}>
                প্রতিটা লেসনে ভিডিওর সাথে সাথে আপনিও বলবেন। ধীরে ধীরে মাথায় অনুবাদ করার অভ্যাস
                কমিয়ে ইংরেজিতে নিজের কথা প্রকাশ করার প্র্যাকটিস করবেন।
              </p>
            </div>

            <div className={styles.methodSteps}>
              <article className={styles.methodStep}>
                <span className={styles.methodStepIcon}>
                  <Play size={16} fill="currentColor" aria-hidden="true" />
                </span>
                <span className={styles.methodStepNumber}>01 · WATCH</span>
                <h3>একটি ছোট ভিডিও দেখুন</h3>
              </article>
              <span className={styles.methodStepConnector} aria-hidden="true">
                <ArrowRight size={17} />
              </span>
              <article className={styles.methodStep}>
                <span className={styles.methodStepIcon}>
                  <Pause size={16} fill="currentColor" aria-hidden="true" />
                </span>
                <span className={styles.methodStepNumber}>02 · PAUSE &amp; SPEAK</span>
                <h3>ভিডিও থামিয়ে নিজে বলুন</h3>
              </article>
              <span className={styles.methodStepConnector} aria-hidden="true">
                <ArrowRight size={17} />
              </span>
              <article className={styles.methodStep}>
                <span className={styles.methodStepIcon}>
                  <MessageCircle size={17} aria-hidden="true" />
                </span>
                <span className={styles.methodStepNumber}>03 · EXPRESS</span>
                <h3>নিজের জীবনে কথাগুলো ব্যবহার করুন</h3>
              </article>
            </div>

            <SpeakingLessonPreview />
          </div>
        </section>

        {reviews.length > 0 && (
          <section
            className={styles.reviewsSection}
            id="student-feedback"
            aria-labelledby="reviews-title"
          >
            <div className={styles.reviewsInner}>
              <div className={styles.reviewsIntro}>
                <span className={styles.reviewsEyebrow}>STUDENT FEEDBACK</span>
                <h2 id="reviews-title" className={styles.reviewsTitle}>
                  কোর্সের রিভিউ
                </h2>
                <p>এই কোর্স সম্পর্কে জমা পড়া রিভিউ থেকে।</p>
              </div>
              <div className={styles.reviewGrid}>
                {reviews.map((review) => (
                  <article key={review.id} className={styles.reviewCard}>
                    <div
                      className={styles.reviewStars}
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={14}
                          aria-hidden="true"
                          fill={index < review.rating ? "currentColor" : "transparent"}
                        />
                      ))}
                    </div>
                    <blockquote>“{review.text}”</blockquote>
                    <div className={styles.reviewAuthor}>
                      <span className={styles.reviewInitial} aria-hidden="true">
                        {review.userName.trim().charAt(0) || "শি"}
                      </span>
                      <span>{review.userName || "শিক্ষার্থী"}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section
          className={styles.finalCtaSection}
          id="final-enrollment"
          aria-labelledby="final-cta-title"
        >
          <div className={styles.finalCtaGlow} aria-hidden="true" />
          <div className={styles.finalCtaInner}>
            <span className={styles.finalCtaEyebrow}>YOUR NEXT STEP</span>
            <h2 id="final-cta-title" className={styles.finalCtaTitle}>
              {enrolled ? "আপনার শেখার যাত্রা চালিয়ে যান" : "এবার আপনার পালা।"}
            </h2>
            <p className={styles.finalCtaDescription}>
              {enrolled
                ? "যেখান থেকে থেমেছিলেন, সেখান থেকেই আবার শুরু করুন।"
                : "দিনে মাত্র ২০ মিনিট, এক লেসন করে—আজই শুরু করুন নিজের কথা ইংরেজিতে প্রকাশ করার প্র্যাকটিস।"}
            </p>
            <TrackedEnrollmentLink
              id="spoken-english-final-cta"
              className={styles.finalCtaButton}
              href={ctaHref}
              eventName="spoken_english_final_cta_click"
            >
              {enrolled ? "কোর্সে ফিরে যান" : "চলুন শুরু করি"}
              <ArrowRight size={17} aria-hidden="true" />
            </TrackedEnrollmentLink>
            <p className={styles.finalCtaTrust}>
              <Check size={14} aria-hidden="true" /> সাথে সাথে অ্যাক্সেস <i /> লাইভ সাপোর্ট
            </p>
          </div>
        </section>
      </main>
      <SpokenEnglishMobileBar href={ctaHref} enrolled={enrolled} />
    </>
  );
}
