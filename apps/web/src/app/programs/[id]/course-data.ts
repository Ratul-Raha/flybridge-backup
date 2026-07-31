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

export type CourseDetails = {
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  desc: string;
  level: string;
  language: string;
  pace: string;
  stats: { value: string; label: string }[];
  outcomes: string[];
  modules: Module[];
  pdfs: PdfResource[];
  certificate: { title: string; desc: string };
};

export const courseDetails: Record<string, CourseDetails> = {
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
