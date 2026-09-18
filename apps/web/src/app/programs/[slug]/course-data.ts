import type { LucideIcon } from "lucide-react";
import { BookOpen, Bot, Brain, FileText, MessageCircle, Mic, Users } from "lucide-react";

export type Lesson = {
  title: string;
  duration: string;
};

export type Module = {
  title: string;
  lessons: Lesson[];
};

export type PdfResource = {
  title: string;
  desc: string;
  pages: number;
  size: string;
};

export type Review = {
  name: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  verified?: boolean;
};

export type RatingSummary = {
  average: number;
  count: number;
  distribution: number[];
};

export type CourseOutcome = {
  title: string;
  desc?: string;
};

export type CourseFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type Highlight = {
  title: string;
  sub: string;
};

export type CourseBook = {
  title: string;
  desc: string;
  includedNote: string;
  image: string;
};

export type TargetBand = {
  label: string;
  value: string;
  sub: string;
};

export type Step = {
  title: string;
  desc: string;
};

export type StepsSection = {
  title: string;
  subtitle?: string;
  cards: Step[];
};

export type CurriculumModule = {
  title: string;
  lessonCount: string;
  items: string[];
  capstone: string;
};

export type CurriculumSection = {
  label?: string;
  title: string;
  subtitle: string;
  modules: CurriculumModule[];
  note?: string;
};

export type ComparisonSection = {
  title: string;
  leftLabel: string;
  rightLabel: string;
  rows: { left: string; right: string }[];
};

export type Faq = {
  q: string;
  a: string;
};

export type PricingSection = {
  title: string;
  subtitle?: string;
  price: string;
  note?: string;
  ctaLabel: string;
  ctaHref: string;
  includedLine?: string;
  paymentLabel?: string;
  paymentMethods?: string[];
};

export type CourseDetails = {
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  desc: string;
  level: string;
  language: string;
  pace: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  access?: string;
  rating?: RatingSummary;
  reviews?: Review[];
  stats: { value: string; label: string }[];
  outcomes: CourseOutcome[];
  features?: CourseFeature[];
  featuresDesc?: string;
  highlights?: Highlight[];
  highlightsDesc?: string;
  book?: CourseBook;
  modules: Module[];
  pdfs: PdfResource[];
  certificate: { title: string; desc: string };
  cta?: { title: string; desc: string };
  heroPill?: string;
  titleAccent?: string;
  targetBand?: TargetBand;
  heroCta?: { label: string; href: string };
  heroStats?: { value: string; label: string }[];
  problem?: { title: string; desc: string };
  steps?: StepsSection;
  curriculum?: CurriculumSection;
  comparison?: ComparisonSection;
  pricing?: PricingSection;
  faqs?: Faq[];
};

export const courseDetails: Record<string, CourseDetails> = {
  "study-visa-prep-us": {
    slug: "study-visa-prep-us",
    badge: "STUDY ABROAD",
    title: "Student Visa Blueprint™",
    subtitle: "Your Study Abroad Journey, Simplified",
    desc: "The complete step-by-step system to prepare your study visa application with confidence.",
    level: "Beginner friendly",
    language: "বাংলা + English",
    pace: "Self-paced · 3-month access",
    price: "$29.99",
    originalPrice: "$99.99",
    savings: "70%",
    access: "৩ মাসের পূর্ণ এক্সেস",
    rating: {
      average: 4.9,
      count: 128,
      distribution: [112, 12, 3, 1, 0],
    },
    reviews: [
      {
        name: "Nafisa Rahman",
        rating: 5,
        date: "২ মাস আগে",
        text: "ভিসা প্রসেসে প্রথমবার হাত দিয়েছি। Blueprint-এর রোডম্যাপ ছাড়া এত সহজে বোঝা যেত না — প্রিপারেশন থেকে অ্যাপ্রুভাল পর্যন্ত প্রতিটি স্টেপের ভিডিও গাইডেন্স একদম স্পষ্ট।",
        helpful: 24,
        verified: true,
      },
      {
        name: "Tanvir Ahmed",
        rating: 5,
        date: "৩ মাস আগে",
        text: "AI SOP Generator সত্যিই গেম চেঞ্জার। SOP নিয়ে এত চিন্তা ছিল, মিনিটেই ড্রাফট পেয়ে নিজের ভাষায় এডিট করেছি। রেডি-মেইড টেমপ্লেটগুলো অনেক সময় বাঁচিয়েছে।",
        helpful: 19,
        verified: true,
      },
      {
        name: "Sadia Islam",
        rating: 5,
        date: "১ মাস আগে",
        text: "লাইভ Q&A সেশনে এক্সপার্টের সাথে সরাসরি প্রশ্ন করার সুযোগটা দারুণ। আমার সব ডাউট ক্লিয়ার হয়েছে, এখন ইন্টারভিউয়ের জন্য পুরোপুরি কনফিডেন্ট।",
        helpful: 15,
        verified: true,
      },
      {
        name: "Rakibul Hasan",
        rating: 4,
        date: "২ মাস আগে",
        text: "খুবই হেল্পফুল কোর্স। ফাইন্যান্সিয়াল প্রুফ নিয়ে যত ডাউট ছিল, মডিউল ৫ পড়েই সব ক্লিয়ার। আরও বেশি টেমপ্লেট থাকলে আরও ভালো হতো।",
        helpful: 11,
      },
      {
        name: "Farhana Akter",
        rating: 5,
        date: "৩ সপ্তাহ আগে",
        text: "লাইভ সাপোর্টে যেকোনো প্রশ্নে সাথে সাথে উত্তর পাই। ডকুমেন্ট চেকলিস্ট ফোলো করে সব কাগজপত্র ঠিকঠাক সাজিয়েছি — এখন শুধু অ্যাপ্রুভালের অপেক্ষা।",
        helpful: 9,
        verified: true,
      },
      {
        name: "Mehedi Hasan",
        rating: 5,
        date: "২ সপ্তাহ আগে",
        text: "জিরো থেকে শুরু করে ৬ সপ্তাহে ভিসা-রেডি হয়েছি। 'প্রস্তুতি থেকে এপ্রুভাল' পুরো জার্নিটা এত গুছিয়ে কেউ শেখায়নি। ৩ মাসের এক্সেসে পুরো কোর্স শেষ করেছি।",
        helpful: 13,
        verified: true,
      },
    ],
    stats: [
      { value: "৩", label: "মাসের পূর্ণ এক্সেস" },
      { value: "৩০", label: "ভিডিও লেসন" },
      { value: "৬", label: "রিসোর্স ও টুলস" },
    ],
    outcomes: [
      { title: "Follow a clear roadmap — from preparation to visa approval" },
      { title: "Prepare your complete application with step-by-step video guidance" },
      { title: "Generate a perfect, personal SOP in minutes with the AI generator" },
      { title: "Save time with ready-made document templates & practical resources" },
      { title: "Get direct answers in live expert Q&A sessions" },
      { title: "Have live support beside you at every step" },
    ],
    modules: [
      {
        title: "Orientation & Your Roadmap",
        lessons: [
          { title: "সূচনা: Blueprint কীভাবে কাজ করে", duration: "05:20" },
          { title: "৩ মাসের প্ল্যান, সপ্তাহে সপ্তাহে", duration: "07:45" },
          { title: "ভিসা জার্নি এক নজরে", duration: "08:30" },
          { title: "টুলস পরিচিতি: AI SOP, টেমপ্লেট ও আরও", duration: "06:15" },
          { title: "ওয়ার্কস্পেস ও ফোল্ডার সেটআপ", duration: "05:50" },
        ],
      },
      {
        title: "Choosing Your Destination",
        lessons: [
          { title: "দেশ ও বিশ্ববিদ্যালয় শর্টলিস্ট", duration: "12:10" },
          { title: "প্রোফাইল অনুযায়ী প্রোগ্রাম বাছাই", duration: "10:25" },
          { title: "ইনটেক, ডেডলাইন ও টাইমলাইন", duration: "09:40" },
          { title: "টিউশন, খরচ ও স্কলারশিপ", duration: "11:05" },
        ],
      },
      {
        title: "Building Your Application File",
        lessons: [
          { title: "ট্রান্সক্রিপ্ট, সার্টিফিকেট ও অনুবাদ", duration: "09:15" },
          { title: "পাসপোর্ট, ফটো ও প্রয়োজনীয় কাগজপত্র", duration: "07:30" },
          { title: "ইংরেজি দক্ষতার শর্ত বুঝে নিন", duration: "10:40" },
          { title: "ডকুমেন্ট চেকলিস্ট ও ট্র্যাকার ব্যবহার", duration: "08:05" },
        ],
      },
      {
        title: "SOP, Essays & the AI Generator",
        lessons: [
          { title: "ভিসা অফিসার SOP-তে কী খোঁজেন", duration: "12:30" },
          { title: "আপনার গল্প সাজান: Blueprint ফ্রেমওয়ার্ক", duration: "13:15" },
          { title: "AI SOP জেনারেটর ধাপে ধাপে", duration: "11:50" },
          { title: "AI ড্রাফট এডিট করে নিজের ভাষায়", duration: "09:25" },
          { title: "SOP রিভিউ চেকলিস্ট", duration: "06:40" },
        ],
      },
      {
        title: "Financial Proof & Sponsorship",
        lessons: [
          { title: "গ্রহণযোগ্য ফাইন্যান্সিয়াল প্রুফ", duration: "10:10" },
          { title: "ব্যাংক স্টেটমেন্ট, FDR ও লোন", duration: "12:45" },
          { title: "স্পনসরশিপ লেটার: শক্তিশালীভাবে লিখুন", duration: "08:35" },
          { title: "সাধারণ ভুল ও সমাধান", duration: "09:20" },
        ],
      },
      {
        title: "Visa Application & Interview",
        lessons: [
          { title: "ফর্ম ফিলিং: ধাপে ধাপে", duration: "14:00" },
          { title: "সাপোর্টিং ডকুমেন্টস চেকলিস্ট", duration: "08:50" },
          { title: "ইন্টারভিউ: কী জিজ্ঞেস করে, কেন", duration: "15:20" },
          { title: "প্র্যাকটিস: মক ইন্টারভিউ সেশন", duration: "18:05" },
          { title: "কঠিন প্রশ্নেও আত্মবিশ্বাসী উত্তর", duration: "11:35" },
        ],
      },
      {
        title: "Approval & Departure",
        lessons: [
          { title: "অ্যাপ্রুভালের পর: ফি, মেডিকেল ও ক্লিয়ারেন্স", duration: "10:30" },
          { title: "আবাসন, ফ্লাইট ও আগমনের চেকলিস্ট", duration: "09:45" },
          { title: "প্রথম মাস বিদেশে: পথচলা সঠিক রাখুন", duration: "08:15" },
        ],
      },
    ],
    pdfs: [
      {
        title: "Document Checklist & Tracker",
        desc: "The complete list of documents, tracked module by module.",
        pages: 12,
        size: "1.9 MB",
      },
      {
        title: "SOP Framework & AI Prompt Guide",
        desc: "The exact structure and prompts to write a standout SOP.",
        pages: 24,
        size: "3.4 MB",
      },
      {
        title: "Visa Interview Question Bank",
        desc: "Real interview questions with confident answer frameworks.",
        pages: 32,
        size: "3.1 MB",
      },
    ],
    certificate: {
      title: "Completion Certificate",
      desc: "Earn a verified FlyBridge certificate when you complete the full Blueprint — from roadmap to visa approval.",
    },
    cta: {
      title: "Ready to prepare your visa application with confidence?",
      desc: "Get 3 months of full access — all video lessons, the AI SOP generator, document templates, live Q&A and support for $29.99 only.",
    },
  },
  "obocheton-mone-ilish-level-01": {
    slug: "obocheton-mone-ilish-level-01",
    badge: "ENGLISH",
    title: "অবচেতন মনে ইংলিশ-Level 01",
    subtitle: "Subconscious English Fluency Program",
    desc: "A practical 30-lesson English course on pronunciation, everyday small talk, workplace communication, interviews and real listening practice — taught in বাংলা + English.",
    level: "Beginner friendly",
    language: "বাংলা + English",
    pace: "Self-paced · 30 lessons",
    stats: [
      { value: "30", label: "Video lessons" },
      { value: "3", label: "PDF resources" },
      { value: "1", label: "Completion certificate" },
    ],
    featuresDesc:
      "প্রথম ভিডিও থেকে সাবলীলভাবে ইংরেজিতে কথা বলা — প্রতিটি রিসোর্স একই প্যাকেজের অন্তর্ভুক্ত।",
    features: [
      {
        icon: Brain,
        title: "Subconscious Method (Step-by-Step Video Guide)",
        desc: "গ্রামার ও অনুবাদের চিন্তা ছাড়া অবচেতন মনে স্বাভাবিকভাবে ইংরেজি চিন্তা ও আয়ত্ত করার সহজ ও কার্যকরী নির্দেশিকা।",
      },
      {
        icon: Mic,
        title: "Premium Resources for Speaking",
        desc: "কথা বলার জড়তা কাটাতে রেডি-মেড রিয়েল-লাইফ কনভারসেশন স্ক্রিপ্ট, ডেইলি ফ্রেজবুক এবং অডিও লিসেনিং ড্রিল।",
      },
      {
        icon: Bot,
        title: "AI Practice Partner",
        desc: "যেকোনো সময় স্পোকেন প্র্যাকটিস ও তাৎক্ষণিক উচ্চারণ শোধরাতে আপনার ২৪/৭ ভার্চুয়াল প্র্যাকটিস পার্টনার।",
      },
      {
        icon: FileText,
        title: "PDF Books & Workbooks",
        desc: "পড়াশোনা সহজ ও গোছানো করতে গুরুত্বপূর্ণ স্ট্রাকচার, ভোকাবুলারি ও ওয়ার্কবুকের কমপ্লিট পিডিএফ সংগ্রহ।",
      },
      {
        icon: MessageCircle,
        title: "Live Q&A & Speaking Sessions",
        desc: "সরাসরি ইন্সট্রাক্টরের সাথে কথা বলার প্র্যাকটিস, ভুল শুধরে নেওয়া এবং প্রশ্ন-উত্তরের বিশেষ লাইভ সেশন।",
      },
      {
        icon: Users,
        title: "Live Support & Community",
        desc: "প্র্যাকটিসের সময় যেকোনো সমস্যা সমাধান ও সাপোর্ট দিতে একটি একটিভ লার্নিং কম্যুনিটি।",
      },
    ],
    outcomes: [
      {
        title: "Think directly in English without translating in your head",
        desc: "বাংলা থেকে মনে মনে অনুবাদ না করে একদম সাবলীল ও স্বতঃস্ফূর্তভাবে ইংরেজিতে কথা বলতে পারবেন।",
      },
      {
        title: "Speak English naturally without fearing grammar rules",
        desc: "গ্রামারের ভুল নিয়ে দুশ্চিন্তা না করে অবচেতন মনে সাবলীল এবং অটোমেটিক ফ্লোতে কথা বলবেন।",
      },
      {
        title: "Understand native speakers and fast speech effortlessly",
        desc: "নেটিভ স্পিকারদের দ্রুত ইংরেজি শোনামাত্র বুঝতে পারবেন এবং কোনো দ্বিধা ছাড়াই উত্তর দিতে পারবেন।",
      },
      {
        title: "Overcome hesitation and boost public speaking confidence",
        desc: "কথা বলার ভয় ও জড়তা কাটিয়ে যেকোনো রিয়েল-লাইফ কনভারসেশন ও প্রেজেন্টেশনে আত্মবিশ্বাসী থাকবেন।",
      },
    ],
    highlightsDesc: "Everything you need to master English fluency with confidence, in one place.",
    highlights: [
      {
        title: "50 Video Lessons",
        sub: "Step-by-step practical video lessons to master subconscious fluency at your own pace",
      },
      {
        title: "Frequent Live Q&A Sessions",
        sub: "Ask questions directly to experts, clear your doubts, and practice live",
      },
      {
        title: "Practical Resources & PDFs",
        sub: "Conversation templates, speaking scripts, audio drills & practical workbooks included",
      },
    ],
    book: {
      title: "অবচেতন মনে ইংলিশ — Level 01",
      desc: "কোর্সের সাথে যুক্ত প্র্যাকটিক্যাল ইংরেজি শেখার বইটি — মডিউল অনুযায়ী সাজানো চ্যাপ্টার, ডেইলি ফ্রেজবুক, উচ্চারণ গাইড ও প্র্যাকটিস এক্সারসাইজ একই প্যাকেজের অন্তর্ভুক্ত।",
      includedNote: "The printed course book is included free with enrollment.",
      image: "/programs/spoken-english-book.png",
    },
    modules: [
      {
        title: "Foundation Sounds & Rhythm",
        lessons: [
          { title: "ইংরেজি উচ্চারণের মূল ধ্বনি", duration: "08:12" },
          { title: "Stress ও intonation বোঝা", duration: "09:04" },
          { title: "Common vowel sounds: short vs long", duration: "10:21" },
          { title: "Linking words naturally", duration: "07:48" },
          { title: "Practice: repeat & shadow (intro)", duration: "12:30" },
        ],
      },
      {
        title: "Everyday Small Talk",
        lessons: [
          { title: "Greetings & introductions", duration: "06:40" },
          { title: "Talking about your day", duration: "08:15" },
          { title: "At the café & ordering food", duration: "07:55" },
          { title: "Making small talk with strangers", duration: "09:20" },
          { title: "Practice: 5-minute dialogue", duration: "11:05" },
        ],
      },
      {
        title: "Workplace English",
        lessons: [
          { title: "Introductions at work", duration: "08:10" },
          { title: "Asking for help politely", duration: "07:32" },
          { title: "Giving a short update", duration: "09:18" },
          { title: "Emails: writing clearly", duration: "12:44" },
          { title: "Practice: role-play at the office", duration: "13:02" },
        ],
      },
      {
        title: "Interviews & Speaking Up",
        lessons: [
          { title: "Common interview questions", duration: "14:20" },
          { title: "Tell me about yourself (frame)", duration: "12:36" },
          { title: "Answering with STAR method", duration: "15:08" },
          { title: "Asking questions back", duration: "08:47" },
          { title: "Mock interview practice", duration: "18:25" },
        ],
      },
      {
        title: "Listening & Response",
        lessons: [
          { title: "Understanding fast speech", duration: "10:30" },
          { title: "Recognizing question types", duration: "08:55" },
          { title: "Responding naturally", duration: "09:40" },
          { title: "Clarifying & rephrasing", duration: "08:12" },
          { title: "Practice: listen and reply", duration: "12:18" },
        ],
      },
      {
        title: "Confidence in Action",
        lessons: [
          { title: "Filler phrases & thinking time", duration: "07:26" },
          { title: "Pronunciation tune-up", duration: "09:35" },
          { title: "Final speaking drill", duration: "11:50" },
          { title: "Recording & self-review", duration: "10:15" },
          { title: "Capstone: full mock conversation", duration: "20:00" },
        ],
      },
    ],
    pdfs: [
      {
        title: "Pronunciation Reference Card",
        desc: "A printable cheat-sheet for every sound covered in the course.",
        pages: 12,
        size: "2.4 MB",
      },
      {
        title: "100 Everyday Phrases Workbook",
        desc: "Practice exercises to make common phrases stick.",
        pages: 28,
        size: "4.1 MB",
      },
      {
        title: "Interview Question Bank & Templates",
        desc: "Real questions with ready-to-adapt answer frameworks.",
        pages: 34,
        size: "3.8 MB",
      },
    ],
    certificate: {
      title: "Completion Certificate",
      desc: "Earn a verified FlyBridge certificate when you finish all 30 lessons.",
    },
  },
  "easy-smart-spoken-english": {
    slug: "easy-smart-spoken-english",
    badge: "ENGLISH",
    title: "Easy & Smart Spoken English",
    subtitle: "Speak English with Confidence in Real Life",
    desc: "A practical spoken English course built around real conversations, daily phrases and confident speaking — designed for beginners who want to think and speak in English naturally.",
    level: "Beginner friendly",
    language: "বাংলা + English",
    pace: "Self-paced · 6-week program",
    rating: {
      average: 4.8,
      count: 64,
      distribution: [52, 8, 3, 1, 0],
    },
    reviews: [
      {
        name: "Tasnim Rahman",
        rating: 5,
        date: "৩ সপ্তাহ আগে",
        text: "ক্লাসে যে স্ক্রিপ্ট ও ড্রিল দেওয়া হয়, সেগুলো ফলো করে এখন অফিসেও ইংরেজিতে কথা বলতে পারি। আগে একদম ভয় পেতাম, এখন কনফিডেন্স বেড়েছে।",
        helpful: 18,
        verified: true,
      },
      {
        name: "Sakib Hasan",
        rating: 5,
        date: "১ মাস আগে",
        text: "প্রতিটি লেসন ছোট ছোট ও সহজ — রোজ ২০ মিনিট করে শিখতে পারি। Daily Phrase Book টা অসাধারণ।",
        helpful: 14,
        verified: true,
      },
      {
        name: "Nusrat Jahan",
        rating: 5,
        date: "২ সপ্তাহ আগে",
        text: "AI Practice Partner দিয়ে প্র্যাকটিস করে ইন্টারভিউতে ইংরেজিতে উত্তর দিতে পেরেছি। এটাই আমার জন্য সবচেয়ে বড় সাফল্য।",
        helpful: 11,
        verified: true,
      },
      {
        name: "Rafiq Uddin",
        rating: 4,
        date: "২ মাস আগে",
        text: "কোর্সটি খুবই কার্যকর। শুধু একটু বেশি লাইভ সেশন থাকলে আরও ভালো হতো। তবে overall অনেক উপকার হয়েছে।",
        helpful: 8,
      },
    ],
    stats: [
      { value: "৬", label: "সপ্তাহের প্রোগ্রাম" },
      { value: "২৪", label: "ভিডিও লেসন" },
      { value: "৩", label: "PDF রিসোর্স" },
    ],
    outcomes: [
      { title: "Think in English and speak without translating in your head" },
      { title: "Handle everyday conversations — greetings, shopping, travel, office" },
      { title: "Speak confidently in job interviews and professional settings" },
      { title: "Understand native speakers and respond naturally" },
      { title: "Build a daily English habit that lasts beyond the course" },
      { title: "Use proper pronunciation and natural intonation" },
    ],
    features: [
      {
        icon: Mic,
        title: "Real Conversation Scripts",
        desc: "রিয়েল-লাইফ পরিস্থিতিতে ব্যবহৃত কথোপকথনের স্ক্রিপ্ট — অফিস, কফিশপ, ইন্টারভিউ ও ভ্রমণে সরাসরি ব্যবহার করুন।",
      },
      {
        icon: Brain,
        title: "Smart Fluency Method",
        desc: "গ্রামার রটনো ছাড়াই অবচেতন মনে ইংরেজি চিন্তা ও কথা বলার সহজ পদ্ধতি।",
      },
      {
        icon: Bot,
        title: "AI Practice Partner",
        desc: "যেকোনো সময় ২৪/৭ AI প্র্যাকটিস পার্টনারের সাথে কথা বলুন ও উচ্চারণ শুধরুন।",
      },
      {
        icon: FileText,
        title: "Daily Phrase Book & PDFs",
        desc: "প্রতিদিনের ব্যবহার্য ফ্রেজ, ভোকাবুলারি ও ওয়ার্কশিটের কমপ্লিট PDF সংগ্রহ।",
      },
      {
        icon: MessageCircle,
        title: "Live Speaking Sessions",
        desc: "সরাসরি ইন্সট্রাক্টরের সাথে প্র্যাকটিস সেশনে কথা বলুন ও ভুল শুধরে নিন।",
      },
      {
        icon: Users,
        title: "Community Support",
        desc: "একটিভ লার্নিং কম্যুনিটিতে অন্যদের সাথে প্র্যাকটিস করুন ও সাপোর্ট পান।",
      },
    ],
    featuresDesc:
      "প্রথম লেসন থেকেই কথা বলা শুরু করুন — প্রতিটি রিসোর্স একই প্যাকেজের অন্তর্ভুক্ত।",
    highlightsDesc: "Everything you need to start speaking English with confidence, in one place.",
    highlights: [
      {
        title: "24 Video Lessons",
        sub: "Short, practical lessons you can finish in 15–20 minutes each",
      },
      {
        title: "Live Speaking Practice",
        sub: "Weekly live sessions to practice real conversations with instructors",
      },
      {
        title: "Daily Phrase Book & PDFs",
        sub: "Ready-to-use conversation scripts, vocabulary lists and worksheets",
      },
    ],
    book: {
      title: "Easy & Smart Spoken English — Course Book",
      desc: "কোর্সের সাথে যুক্ত প্র্যাকটিক্যাল স্পোকেন ইংলিশ বইটি — ডেইলি ফ্রেজ, কনভারসেশন স্ক্রিপ্ট, উচ্চারণ গাইড ও প্র্যাকটিস এক্সারসাইজ একই প্যাকেজে।",
      includedNote: "The course book is included free with enrollment.",
      image: "/programs/easy-smart-spoken-english-book.png",
    },
    modules: [
      {
        title: "Getting Started — Your English Foundation",
        lessons: [
          { title: "কোর্সের পরিচিতি ও কীভাবে ফলো করবেন", duration: "05:10" },
          { title: "ইংরেজি ভয় ছাড়ার সহজ কৌশল", duration: "08:20" },
          { title: "Basic greetings ও introductions", duration: "07:45" },
          { title: "Daily routine নিয়ে কথা বলা", duration: "09:30" },
          { title: "Practice: নিজের সম্পর্কে ২ মিনিট কথা বলুন", duration: "10:00" },
        ],
      },
      {
        title: "Everyday Conversations",
        lessons: [
          { title: "কফিশপে অর্ডার করা ও ছোট কথা বলা", duration: "08:15" },
          { title: "Market & shopping conversations", duration: "09:40" },
          { title: "Asking for directions & getting around", duration: "07:55" },
          { title: "Talking about your day & hobbies", duration: "08:30" },
          { title: "Practice: role-play — ৫ মিনিট ডায়ালগ", duration: "11:20" },
        ],
      },
      {
        title: "Workplace & Professional English",
        lessons: [
          { title: "Office introductions & small talk", duration: "08:50" },
          { title: "Emails: writing clearly and politely", duration: "12:10" },
          { title: "Phone calls & video meetings", duration: "09:45" },
          { title: "Giving updates & asking for help", duration: "07:30" },
          { title: "Practice: mock office conversation", duration: "13:15" },
        ],
      },
      {
        title: "Interview & Confidence Building",
        lessons: [
          { title: "Common interview questions & answers", duration: "14:00" },
          { title: '"Tell me about yourself" — frame your story', duration: "12:25" },
          { title: "Answering with STAR method in English", duration: "15:30" },
          { title: "Handling tricky questions calmly", duration: "10:40" },
          { title: "Practice: full mock interview", duration: "18:10" },
        ],
      },
      {
        title: "Pronunciation & Natural Flow",
        lessons: [
          { title: "Common sounds Bangladeshi speakers struggle with", duration: "11:20" },
          { title: "Stress, rhythm & intonation basics", duration: "09:55" },
          { title: "Linking words naturally in fast speech", duration: "08:40" },
          { title: "Shadowing technique for better pronunciation", duration: "10:15" },
          { title: "Practice: record & compare your speech", duration: "12:30" },
        ],
      },
      {
        title: "Real-World Speaking Mastery",
        lessons: [
          { title: "Travel English — airport, hotel, restaurant", duration: "10:00" },
          { title: "Social situations — parties, networking, events", duration: "09:20" },
          { title: "Expressing opinions & disagreeing politely", duration: "08:50" },
          { title: "Storytelling & holding a conversation", duration: "11:40" },
          { title: "Capstone: 10-minute spontaneous English talk", duration: "15:00" },
        ],
      },
    ],
    pdfs: [
      {
        title: "Daily Phrase Book",
        desc: "100+ everyday phrases organized by situation — ready to use immediately.",
        pages: 22,
        size: "2.8 MB",
      },
      {
        title: "Vocabulary Builder Workbook",
        desc: "Practice exercises for the most useful words and expressions.",
        pages: 30,
        size: "3.5 MB",
      },
      {
        title: "Interview Question Bank & Answer Templates",
        desc: "Real interview questions with sample answers you can adapt.",
        pages: 28,
        size: "3.2 MB",
      },
    ],
    certificate: {
      title: "Completion Certificate",
      desc: "Earn a verified FlyBridge certificate when you complete all 24 lessons and the final speaking challenge.",
    },
  },
  "ielts-band-score-machine": {
    slug: "ielts-band-score-machine",
    badge: "IELTS",
    title: "IELTS Band Score Machine",
    titleAccent: "— শুরু থেকে শেষ, একই জায়গায়",
    subtitle: "Target Band 7 2026",
    heroPill: "🔥 IELTS Band Score Machine — ব্যাচ ১-এর ওয়েটলিস্ট খোলা রয়েছে",
    targetBand: { label: "TARGET", value: "Band 7", sub: "IELTS 2026" },
    desc: "Speaking, Writing, Listening ও Reading — চারটা স্কিলেই টার্গেট স্কোর পাওয়ার এক সম্পূর্ণ সিস্টেম। আপনার বর্তমান লেভেল যা-ই হোক, স্কোর বাড়াবে নিখুঁতভাবে।",
    level: "Beginner to advanced",
    language: "বাংলা + English",
    pace: "Self-paced · 30 masterclasses",
    access: "1 year access",
    heroCta: { label: "এখনই ওয়েটলিস্টে জয়েন করুন", href: "#pricing" },
    heroStats: [
      { value: "৩০", label: "ভিডিও মাস্টারক্লাস" },
      { value: "Live", label: "নিয়মিত লাইভ সেমিনার" },
      { value: "০৫", label: "বোনাস ক্লাস" },
      { value: "১৫", label: "ওয়েবসাইটেই মক এক্সাম" },
    ],
    stats: [
      { value: "৩০", label: "ভিডিও মাস্টারক্লাস" },
      { value: "৪", label: "মডিউল" },
      { value: "৪০+", label: "প্র্যাকটিস টেস্ট" },
    ],
    problem: {
      title: "বেশিরভাগ IELTS কোর্স শুধু টিপস শেখায়, পরীক্ষাটা শেখায় না",
      desc: '"বেশি প্র্যাকটিস করো", "ভালো ভোকাবুলারি ইউজ করো" — এইসব জেনারেল কথা তো সবাই বলে। কিন্তু আসল প্রশ্ন হলো — Band 6 আর Band 8-এর উত্তরের মধ্যে আসলে পার্থক্যটা কোথায়? পরীক্ষার পুরো ৪০টা প্রশ্ন একসাথে কেমন দেখতে হয়, সেটা কখনো দেখেছেন? বেশিরভাগ কোর্স ঠিক এই জায়গাতেই আটকে যায়। আর এই গ্যাপ দূর করতেই এসেছে IELTS Band Score Machine।',
    },
    steps: {
      title: "একটা সিস্টেম। চারটা স্কিল। পরীক্ষা যেভাবে হয়, ঠিক সেভাবেই তৈরি।",
      cards: [
        {
          title: "১. আসল জিনিসটা দেখুন",
          desc: "ভিডিওর মাধ্যমে রিয়েল টেস্ট ফরম্যাট, রিয়েল মডেল আনসার ও এক্সাম-লেভেলের মেটেরিয়াল — কোনো সহজ ফেইক এক্সাম্পল নয়।",
        },
        {
          title: "২. পার্থক্যটা বুঝুন",
          desc: "প্রতিটা লেসনে সরাসরি Band 6 বনাম Band 8+ তুলনা আছে, তাই জানবেন ঠিক কী ফিক্স করতে হবে।",
        },
        {
          title: "৩. প্র্যাকটিস করুন",
          desc: "প্রতিটা লেসনে ওয়ার্কশিট, ড্রিল, আর সেলফ-চেক লিস্ট — শুধু পড়া না, সাথে সাথে প্র্যাকটিস।",
        },
      ],
    },
    featuresDesc:
      "Speaking, Writing, Listening ও Reading — চারটা স্কিল আয়ত্তের সম্পূর্ণ সিস্টেম একই প্যাকেজের অন্তর্ভুক্ত।",
    features: [
      {
        icon: Brain,
        title: "Band 6 বনাম Band 8+ তুলনা",
        desc: "প্রতিটা লেসনে সরাসরি দেখানো হয় কোন উত্তরটা কেন কম স্কোর পায় আর কোনটা Band 8+ — তাই জানবেন ঠিক কী ফিক্স করতে হবে।",
      },
      {
        icon: Mic,
        title: "IELTS Speaking Masterclass",
        desc: "Part 1, 2 আর 3-এর সম্পূর্ণ কৌশল, Cue Card প্রস্তুতি, PREP Method আর ৩০টা মডেল আনসার।",
      },
      {
        icon: FileText,
        title: "IELTS Writing Mastery",
        desc: "Academic ও General Training Task 1, Task 2-এর প্যারাগ্রাফিং, Band 8+ ভোকাবুলারি আর ৫ ধরনের Essay Structure Formula।",
      },
      {
        icon: MessageCircle,
        title: "IELTS Listening Mastery",
        desc: "চার সেকশনের Question Type, রিয়েল টেস্ট, Distractor ধরার কৌশল আর ফাইনাল চেকিং সিস্টেম।",
      },
      {
        icon: Users,
        title: "IELTS Reading Mastery",
        desc: "Skimming, Scanning, True/False/Not Given, Matching Headings সহ সব প্রশ্ন টাইপে সময়-ভাগ করা কৌশল।",
      },
      {
        icon: Bot,
        title: "লাইভ সেমিনার ও সাপোর্ট",
        desc: "নিয়মিত লাইভ সেমিনার, ৫টা বোনাস ক্লাস আর ওয়েবসাইটেই ১ বছরের জন্য ডেস্কটপ-ভিত্তিক ১৫টা মক এক্সামের সুবিধা।",
      },
      {
        icon: BookOpen,
        title: "Companion Book (PDF)",
        desc: "প্রতিটা লেসনের মূল শিক্ষা, মডেল আনসার, Band 6 বনাম Band 8+ তুলনা আর প্র্যাকটিস টেস্ট — সবকিছু একসাথে একটা সম্পূর্ণ companion PDF বইয়ে।",
      },
    ],
    book: {
      title: "IELTS Band Score Machine — Companion Book",
      desc: "৩০টা ভিডিও মাস্টারক্লাসের পাশাপাশি একটা সম্পূর্ণ companion PDF বই — প্রতিটা লেসনের মূল শিক্ষা, প্রতিটা মডেল আনসার, Band 6 বনাম Band 8+ তুলনা, আর প্রতিটা প্র্যাকটিস টেস্ট, সব একসাথে।",
      includedNote: "The complete companion book is included free with every enrollment.",
      image: "/programs/ielts-band-score-machine-book.svg",
    },
    outcomes: [
      { title: "Speaking-এর Part 1, 2, 3-এ আত্মবিশ্বাসের সাথে উত্তর দিতে পারবেন" },
      { title: "Writing Task 1 ও Task 2-এর Band 8+ স্ট্রাকচার নিজে লিখতে পারবেন" },
      { title: "Listening-এর প্রতিটা সেকশনে ফাঁদ চিনে সঠিক উত্তর ধরতে পারবেন" },
      { title: "Reading-এ সময় ভাগ করে True/False/Not Given সহ সব প্রশ্নে দক্ষ হবেন" },
      { title: "ওয়েবসাইটে একাধিক ফুল-লেংথ মক টেস্টে ১ বছরের জন্য নিজের স্কোর যাচাই করতে পারবেন" },
      { title: "পরীক্ষার দিনের জন্য IELTS Band Score Machine-এর প্রমাণিত ফ্রেমওয়ার্ক পাবেন" },
    ],
    curriculum: {
      label: "কারিকুলাম",
      title: "৩০টা লেসন, ৪টা মডিউল",
      subtitle: "কোনো কনফিউশন নেই — প্রতিটা মডিউল আপনাকে ব্যান্ড ৮+ এর দিকে এগিয়ে নিয়ে যাবে",
      modules: [
        {
          title: "IELTS Speaking Mastery",
          lessonCount: "৭টা লেসন",
          items: [
            "Speaking Test আর Band Descriptors-এর সম্পূর্ণ ওভারভিউ",
            "Part 1: দ্রুত উত্তর দেওয়া আর উত্তর বাড়ানোর কৌশল",
            "Part 2 Cue Card: ১ মিনিট প্রস্তুতি, ২ মিনিট বলা",
            "Part 3: Abstract Reasoning আর PREP Method",
            "দ্বিধা ও ভুল সংশোধন এড়ানোর উপায়",
          ],
          capstone: "৩০টা সম্পূর্ণ মডেল আনসার",
        },
        {
          title: "IELTS Writing Mastery",
          lessonCount: "৭টা লেসন",
          items: [
            "Task 1: Band Descriptors, Tone আর Overview লেখা",
            "Academic Task 1: Line Graph, Bar Chart, Table, Process",
            "GT Task 1: Formal, Semi-Formal, Informal লেটার",
            "Task 2: ৫ মিনিটে প্ল্যান করা আর প্যারাগ্রাফিং",
            "Task 2-এর Band 8+ ভোকাবুলারি ও Cohesive Devices",
          ],
          capstone: "৫ ধরনের Essay Structure Formula",
        },
        {
          title: "IELTS Listening Mastery",
          lessonCount: "৭টা লেসন",
          items: [
            "Listening Test-এর সম্পূর্ণ গঠন ও Question Type",
            "Section 1 ও 2: ফর্ম, নাম্বার, নাম, ম্যাপ — রিয়েল টেস্টসহ",
            "Section 3 ও 4: Multiple Choice, Matching, লেকচার",
            "যেসব ফাঁদে সবাই পড়ে: Self-Correction, Distractor",
          ],
          capstone: "Word Limit ও ফাইনাল চেকিং সিস্টেম",
        },
        {
          title: "IELTS Reading Mastery",
          lessonCount: "৯টা লেসন",
          items: [
            "Reading-এর ভিত্তি: সময় ভাগ, Skimming ও Scanning",
            "True/False/Not Given — কনফিউশন দূর করা",
            "Matching Headings ও Paragraph Features",
            "Gapped Text ও Exact Word Rule",
            "Multiple Choice ও Paraphrased ফাঁদ ধরা",
          ],
          capstone: "সম্পূর্ণ Reading Masterclass",
        },
      ],
      note: "Listening আর Speaking-এর প্রতিটা লেসনে একটা সম্পূর্ণ, বাস্তব প্র্যাকটিস টেস্ট আছে — শুধু একটা এক্সাম্পল না। কোর্স শেষ হওয়ার আগেই আপনি পরীক্ষার প্রতিটা অংশের জন্য একাধিক ফুল-লেংথ মক টেস্ট প্র্যাকটিস করে ফেলবেন।",
    },
    comparison: {
      title: 'এটা আরেকটা "টিপস অ্যান্ড ট্রিকস" কোর্স না',
      leftLabel: "সাধারণ IELTS কোর্স",
      rightLabel: "IELTS Band Score Machine",
      rows: [
        {
          left: 'ভাসা ভাসা পরামর্শ ("আরও প্র্যাকটিস করো")',
          right: "প্রতিটা লেসনে সরাসরি Band 6 বনাম Band 8+ তুলনা",
        },
        { left: "দুই-একটা উদাহরণ বাক্য", right: "সম্পূর্ণ মডেল আনসার, শব্দসংখ্যা ও ব্যান্ড স্কোরসহ বিশ্লেষণ" },
        {
          left: "একটা মক টেস্ট, থাকলেও থাকতে পারে",
          right: "ওয়েবসাইটেই ১৫টা ফুল-লেংথ মক টেস্ট (ডেস্কটপ)",
        },
        { left: "শুধু সাধারণ ভিডিও ক্লাসে সীমাবদ্ধ", right: "৩০টি ভিডিও মাস্টারক্লাস + সম্পূর্ণ PDF বই" },
        { left: "গ্রামার-টিপস নির্ভর সেশন", right: "স্কিল-ভিত্তিক, আসল পরীক্ষা ও রিয়েল টেস্ট ফরম্যাটে সাজানো" },
      ],
    },
    modules: [
      {
        title: "IELTS Speaking Mastery",
        lessons: [
          { title: "Speaking Test আর Band Descriptors-এর সম্পূর্ণ ওভারভিউ", duration: "09:20" },
          { title: "Part 1: দ্রুত উত্তর দেওয়া আর উত্তর বাড়ানোর কৌশল", duration: "10:45" },
          { title: "Part 2 Cue Card: ১ মিনিট প্রস্তুতি, ২ মিনিট বলা", duration: "12:30" },
          { title: "Part 3: Abstract Reasoning আর PREP Method", duration: "13:15" },
          { title: "দ্বিধা ও ভুল সংশোধন এড়ানোর উপায়", duration: "08:50" },
          { title: "Speaking Mock Test: ফুল-লেংথ প্র্যাকটিস ও রিভিউ", duration: "16:30" },
          { title: "Capstone: ৩০টা সম্পূর্ণ মডেল আনসার", duration: "18:00" },
        ],
      },
      {
        title: "IELTS Writing Mastery",
        lessons: [
          { title: "Task 1: Band Descriptors, Tone আর Overview লেখা", duration: "11:20" },
          { title: "Academic Task 1: Line Graph, Bar Chart, Table, Process", duration: "14:05" },
          { title: "GT Task 1: Formal, Semi-Formal, Informal লেটার", duration: "12:40" },
          { title: "Task 2: ৫ মিনিটে প্ল্যান করা আর প্যারাগ্রাফিং", duration: "13:50" },
          { title: "Task 2-এর Band 8+ ভোকাবুলারি ও Cohesive Devices", duration: "11:35" },
          { title: "Writing Mock Test: Task 1 + Task 2 সম্পূর্ণ রিভিউ", duration: "17:10" },
          { title: "Capstone: ৫ ধরনের Essay Structure Formula", duration: "16:20" },
        ],
      },
      {
        title: "IELTS Listening Mastery",
        lessons: [
          { title: "Listening Test-এর সম্পূর্ণ গঠন ও Question Type", duration: "09:40" },
          { title: "Section 1 ও 2: ফর্ম, নাম্বার, নাম, ম্যাপ — রিয়েল টেস্টসহ", duration: "15:10" },
          { title: "Section 3 ও 4: Multiple Choice, Matching, লেকচার", duration: "14:25" },
          { title: "যেসব ফাঁদে সবাই পড়ে: Self-Correction, Distractor", duration: "10:55" },
          { title: "Section 1-এর রিয়েল টাইম প্র্যাকটিস: নাম, নাম্বার ও তারিখ", duration: "13:00" },
          { title: "Full Listening Mock Test ও ব্যাখ্যাসহ রিভিউ", duration: "18:20" },
          { title: "Capstone: Word Limit ও ফাইনাল চেকিং সিস্টেম", duration: "12:30" },
        ],
      },
      {
        title: "IELTS Reading Mastery",
        lessons: [
          { title: "Reading-এর ভিত্তি: সময় ভাগ, Skimming ও Scanning", duration: "10:15" },
          { title: "True/False/Not Given — কনফিউশন দূর করা", duration: "13:05" },
          { title: "Matching Headings ও Paragraph Features", duration: "12:50" },
          { title: "Gapped Text ও Exact Word Rule", duration: "11:30" },
          { title: "Multiple Choice ও Paraphrased ফাঁদ ধরা", duration: "12:10" },
          { title: "Passage 1: সম্পূর্ণ প্র্যাকটিস ও ব্যাখ্যা", duration: "18:40" },
          { title: "Passage 2: সম্পূর্ণ প্র্যাকটিস ও ব্যাখ্যা", duration: "17:25" },
          { title: "Full Reading Mock Test: সময় ধরে প্র্যাকটিস ও রিভিউ", duration: "19:15" },
          { title: "Capstone: সম্পূর্ণ Reading Masterclass", duration: "20:00" },
        ],
      },
    ],
    pdfs: [
      {
        title: "IELTS Band Score Machine Companion Book",
        desc: "Every lesson, model answer and Band 6 vs Band 8+ comparison — designed for mobile reading.",
        pages: 180,
        size: "12.4 MB",
      },
      {
        title: "Speaking Model Answers Pack",
        desc: "30 complete, exam-ready model answers across Part 1, 2 and 3.",
        pages: 46,
        size: "4.2 MB",
      },
      {
        title: "Full-Length Practice Test Pack",
        desc: "Multiple full-length mock tests for Listening, Reading and Writing with answer keys.",
        pages: 96,
        size: "8.6 MB",
      },
    ],
    certificate: {
      title: "Completion Certificate",
      desc: "Earn a verified FlyBridge certificate when you complete all 30 masterclasses and the full-length practice tests.",
    },
    pricing: {
      title: "১লা অক্টোবরের আগেই সিট বুক করুন",
      subtitle: "আর্লি-বার্ড ডিসকাউন্ট শীঘ্রই ঘোষণা করা হবে",
      price: "শীঘ্রই ঘোষণা",
      note: "এককালীন পেমেন্ট · ১ বছরের সম্পূর্ণ অ্যাক্সেস",
      ctaLabel: "এখনই ওয়েটলিস্টে জয়েন করুন",
      ctaHref: "#waitlist",
      includedLine: "৩০টা মাস্টারক্লাস · লাইভ সেমিনার · সম্পূর্ণ PDF বই",
      paymentLabel: "নিরাপদ পেমেন্ট, যেভাবে আপনার সুবিধা",
      paymentMethods: ["bKash", "Nagad", "Rocket", "Stripe"],
    },
    faqs: [
      {
        q: "এটা Academic নাকি General Training-এর জন্য?",
        a: "দুটোই কভার করা হয়েছে। Writing মডিউলে Academic Task 1 আর General Training Task 1 — দুটোরই আলাদা লেসন আছে।",
      },
      {
        q: "এটা কি সেলফ-পেসড, নাকি নির্দিষ্ট সময়ে ক্লাস হয়?",
        a: "৩০টা মূল মাস্টারক্লাস সেলফ-পেসড। লাইভ সেমিনার নির্দিষ্ট সময়ে হবে, কিন্তু রেকর্ড করা থাকবে।",
      },
      {
        q: "PDF বইটা কি সব প্ল্যানের সাথেই পাওয়া যাবে?",
        a: "হ্যাঁ — যারাই এনরোল করবে, তারা সবাই companion বইও পাবে।",
      },
      {
        q: "পেমেন্ট কীভাবে করব?",
        a: "bKash, Nagad, Rocket, অথবা Card (Stripe-এর মাধ্যমে) — যেটা আপনার জন্য সহজ।",
      },
      {
        q: "আমার Band Score যদি এখন অনেক কম হয়?",
        a: "প্রতিটা মডিউলের প্রথম লেসন একদম শুরু থেকে শুরু হয় — আগে থেকে কিছু জানা থাকতে হবে না।",
      },
    ],
    cta: {
      title: "আপনার Target Band। একটাই সম্পূর্ণ সিস্টেম।",
      desc: "লঞ্চ হচ্ছে ১লা অক্টোবর, ২০২৬ — ৩০টা মাস্টারক্লাস, লাইভ সেমিনার, ৫টা বোনাস ক্লাস আর সম্পূর্ণ PDF বই।",
    },
  },
};
