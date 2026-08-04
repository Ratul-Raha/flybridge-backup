import {
  Video,
  Route,
  Cpu,
  FileText,
  MessageCircle,
  Headphones,
  type LucideIcon,
} from "lucide-react";

export type BlueprintFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export const BLUEPRINT_FEATURES: BlueprintFeature[] = [
  {
    icon: Video,
    title: "Step-by-step Video Guidance",
    desc: "ধাপে ধাপে সহজ ও কার্যকরী ভিডিওর মাধ্যমে প্রসেস সম্পন্ন করুন।",
  },
  {
    icon: Route,
    title: "Guided Roadmap",
    desc: "প্রিপারেশন থেকে ভিসা এপ্রুভাল, পুরো জার্নির স্পষ্ট নির্দেশনা।",
  },
  {
    icon: Cpu,
    title: "AI SOP Generator",
    desc: "মিনিটেই তৈরি করুন পারফেক্ট, পার্সোনাল SOP।",
  },
  {
    icon: FileText,
    title: "Document Templates & Practical Resources",
    desc: "সময় বাঁচান রেডি-মেইড টেমপ্লেট ও প্র্যাকটিক্যাল রিসোর্সের মাধ্যমে।",
  },
  {
    icon: MessageCircle,
    title: "Live Q&A Sessions",
    desc: "সরাসরি এক্সপার্টের সাথে লাইভ প্রশ্নোত্তর সেশন।",
  },
  {
    icon: Headphones,
    title: "Live Support",
    desc: "যেকোনো প্রশ্নে আমরা আছি আপনার পাশে।",
  },
];
