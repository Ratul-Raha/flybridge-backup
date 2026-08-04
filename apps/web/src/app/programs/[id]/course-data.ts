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
  outcomes: string[];
  modules: Module[];
  pdfs: PdfResource[];
  certificate: { title: string; desc: string };
  cta?: { title: string; desc: string };
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
    price: "৳২,৯৯৯",
    originalPrice: "৳৯,৯৯৯",
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
      "Follow a clear roadmap — from preparation to visa approval",
      "Prepare your complete application with step-by-step video guidance",
      "Generate a perfect, personal SOP in minutes with the AI generator",
      "Save time with ready-made document templates & practical resources",
      "Get direct answers in live expert Q&A sessions",
      "Have live support beside you at every step",
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
      desc: "Get 3 months of full access — all video lessons, the AI SOP generator, document templates, live Q&A and support for ৳২,৯৯৯ only.",
    },
  },
  "obocheton-mone-ilish-level-01": {
    slug: "obocheton-mone-ilish-level-01",
    badge: "ENGLISH",
    title: "অবচেতন মনে ইলিশ Level 01",
    subtitle: "Spoken English for Success",
    desc: "Practical, confident communication for everyday and interviews.",
    level: "Beginner friendly",
    language: "বাংলা + English",
    pace: "Self-paced · 30 lessons",
    stats: [
      { value: "30", label: "Video lessons" },
      { value: "3", label: "PDF resources" },
      { value: "1", label: "Completion certificate" },
    ],
    outcomes: [
      "Speak with confidence in everyday conversations",
      "Handle job interviews with clear, structured answers",
      "Sound more natural with the right stress and rhythm",
      "Understand fast speech and respond without hesitation",
    ],
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
};
