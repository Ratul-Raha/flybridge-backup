import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getProgram } from "@/lib/programs";
import { connectDb } from "@/lib/db";
import { publicCoursePricing } from "@/lib/course-discount";
import { hasFreePreview } from "@/lib/course-preview";
import { resolveWishlistDiscount } from "@/lib/wishlist-discount";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CheckoutPanel } from "@/components/programs/checkout-panel";
import { courseDetails } from "../course-data";

type Props = { params: { slug: string } };

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const formatBengaliNumber = (value: number) =>
  String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)]);

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: Props): Metadata {
  const program = getProgram(params.slug);
  const details = courseDetails[params.slug];
  return {
    title: `Checkout — ${details?.title ?? program?.title ?? "Course"} | FlyBridge`,
  };
}

export default async function CheckoutPage({ params }: Props) {
  const program = getProgram(params.slug);
  if (!program || !program.hasDb) notFound();

  const details = courseDetails[params.slug];

  await connectDb();
  const course = await Course.findOne({
    slug: params.slug,
    $or: [{ published: true }, { upcoming: true }],
  });
  if (!course) notFound();

  const courseId = course._id.toString();
  const moduleCount = (course.modules ?? []).length;
  const lessonCount = (course.modules ?? []).reduce(
    (n: number, m: any) => n + (m.lessons?.length ?? 0),
    0
  );

  // What the buyer is charged, resolved from the course's own discount so this
  // page and the order it creates can never quote different numbers.
  const pricing = publicCoursePricing(course);

  // A waitlist member pays a further wishlist discount on top of the general
  // discount. Computed here so the order summary matches what the order API
  // will charge when the buyer confirms.
  const session = await readSession();
  const wishlist = session
    ? await resolveWishlistDiscount({
        itemType: "course",
        itemId: courseId,
        userId: session.userId ?? session.uid,
        email: session.email,
        price: pricing.price ?? 0,
      })
    : null;

  const checkoutCourse = {
    courseId,
    slug: course.slug,
    title: details?.title ?? course.title,
    subtitle: details?.subtitle ?? course.subtitle ?? "",
    description: details?.desc ?? course.description ?? "",
    image: course.image ?? null,
    badge: details?.badge ?? course.badge ?? "COURSE",
    price: course.price ?? 0,
    currency: course.currency ?? "USD",
    prices: wishlist ? { ...pricing.prices, BDT: wishlist.price } : pricing.prices,
    // The summary is arithmetic the buyer can check, so only a running discount
    // gets an original to subtract from. A marketing-only strikethrough has no
    // matching discount, and a summary whose rows do not add up is worse than
    // no strikethrough at all.
    originalPrice:
      pricing.discounted && pricing.price !== null
        ? pricing.price + pricing.savings
        : undefined,
    discountLabel: pricing.discountLabel,
    wishlistDiscountPercent: wishlist?.percent ?? 0,
    wishlistDiscountAmount: wishlist?.amount ?? 0,
    level: details?.level ?? course.level ?? "",
    language: details?.language ?? course.language ?? "",
    pace: details?.pace ?? course.pace ?? "",
    access: details?.access ?? "",
    certificateEnabled: course.certificateEnabled === true,
    upcoming: course.upcoming === true,
    hasFreePreview: (pricing.price ?? 0) > 0 && hasFreePreview(course),
  };

  const isSpokenEnglish = params.slug === "easy-smart-spoken-english";
  const isIelts = params.slug === "ielts-band-score-machine";

  const spokenEnglishStats = [
    { value: "১০০", label: "লেসন" },
    { value: "১০", label: "ইউনিট" },
    { value: "২০", label: "মিনিট / দিন" },
    { value: "লাইভ", label: "সাপোর্ট" },
  ];
  const ieltsStats = [
    { value: "২৫", label: "ভিডিও মাস্টারক্লাস" },
    { value: "০৫", label: "বোনাস ক্লাস" },
    { value: "১৫", label: "ফ্রি মক টেস্ট" },
    { value: "০৪", label: "IELTS স্কিল" },
  ];

  const spokenEnglishItems = [
    {
      title: "১০০টি লেসন · ১০টি ইউনিট",
      description: "দিনে একটি লেসন, প্রায় ২০ মিনিটে—নিজের সময়ে নিজের গতিতে।",
    },
    {
      title: "টক-ব্যাক speaking practice",
      description: "ভিডিও থামিয়ে নিজে মুখে বলুন; শুধু দেখা নয়, প্রতিটি ধাপে প্র্যাকটিস।",
    },
    {
      title: "বাংলা + English-এ শেখা",
      description: "বাংলায় ব্যাখ্যা, পরিচিত পরিস্থিতি, আর মাথায় অনুবাদ না করে express করার পদ্ধতি।",
    },
    {
      title: "Easy & Smart Spoken English Course Book",
      description: "কোর্সের সাথে ফ্রি—ভিডিওতে শিখুন, বইয়ে প্র্যাকটিস করুন।",
    },
    {
      title: "লাইভ সাপোর্ট ও লার্নার কমিউনিটি",
      description: "নিয়মিত অনুশীলন চালিয়ে যেতে সহায়তা ও শেখার কমিউনিটি।",
    },
    ...(course.certificateEnabled
      ? [
          {
            title: "Completion Certificate",
            description: "কোর্সটি শেষ করে আপনার শেখার অগ্রগতি উদ্‌যাপন করুন।",
          },
        ]
      : []),
  ];

  const ieltsItems = [
    {
      title: "২৫টি IELTS video masterclass + ৫টি bonus class",
      description: "পরীক্ষার ফরম্যাট ও model answer ধরে ধাপে ধাপে শিখুন।",
    },
    {
      title: "১৫টি computer-based mock test",
      description: "ওয়েবসাইটে আসল পরীক্ষার মতো স্ক্রিনে অনুশীলন ও নিজের প্রস্তুতি যাচাই।",
    },
    {
      title: "Speaking, Writing, Listening ও Reading",
      description: "চারটি IELTS skill-এর জন্য আলাদা কৌশল, practice ও skill-based lessons।",
    },
    {
      title: "সম্পূর্ণ IELTS Companion PDF book",
      description: "Lesson notes, model answers, Band 6 বনাম Band 7 বিশ্লেষণ ও practice test।",
    },
    {
      title: "Quiz, practice ও নিয়মিত live class",
      description: "শেখা ঝালাই করুন, প্রশ্ন করুন, আর প্রস্তুতি যাচাই করুন।",
    },
    { title: "Lifetime access", description: "নিজের সুবিধামতো সময়ে lessons ও course materials-এ ফিরে আসুন।" },
  ];

  const genericItems = [
    ...(moduleCount || lessonCount
      ? [
          {
            title: `${formatBengaliNumber(moduleCount)}টি মডিউল · ${formatBengaliNumber(lessonCount)}টি লেসন`,
            description: details?.pace ?? course.pace ?? "নিজের সময়ে, নিজের গতিতে শিখুন।",
          },
        ]
      : []),
    ...(details?.features ?? []).slice(0, 4).map((feature) => ({
      title: feature.title,
      description: feature.desc,
    })),
    ...(details?.book
      ? [
          {
            title: details.book.title,
            description: details.book.includedNote || details.book.desc,
          },
        ]
      : []),
    ...(details?.pdfs?.length
      ? [
          {
            title: `${formatBengaliNumber(details.pdfs.length)}টি course PDF resource`,
            description: details.pdfs.map((pdf) => pdf.title).join(" · "),
          },
        ]
      : []),
    ...(course.certificateEnabled
      ? [
          {
            title: details?.certificate?.title ?? "Completion Certificate",
            description: details?.certificate?.desc ?? "কোর্স সম্পন্ন করে সার্টিফিকেট অর্জন করুন।",
          },
        ]
      : []),
  ];

  const genericStats = details?.stats?.length
    ? details.stats.map((stat) => ({ value: stat.value, label: stat.label }))
    : [
        ...(moduleCount ? [{ value: formatBengaliNumber(moduleCount), label: "মডিউল" }] : []),
        ...(lessonCount ? [{ value: formatBengaliNumber(lessonCount), label: "লেসন" }] : []),
        ...(details?.access ? [{ value: details.access, label: "অ্যাক্সেস" }] : []),
        ...(details?.level ? [{ value: details.level, label: "লেভেল" }] : []),
      ].slice(0, 4);

  const checkoutIntro = isSpokenEnglish
    ? "Don’t Translate, Just Express. দিনে মাত্র ২০ মিনিটে, এক লেসন করে ইংরেজিতে নিজের কথা প্রকাশের অনুশীলন শুরু করুন।"
    : isIelts
      ? "চারটি IELTS skill, ২৫টি video masterclass, ৫টি bonus class আর ১৫টি computer-based mock test—আপনার প্রস্তুতির জন্য একটি সম্পূর্ণ practice system।"
      : details?.desc ?? course.description;
  const includedItems = isSpokenEnglish
    ? spokenEnglishItems
    : isIelts
      ? ieltsItems
      : genericItems.length > 0
        ? genericItems
        : [{ title: "কোর্সের সম্পূর্ণ lesson ও learning materials-এ অ্যাক্সেস" }];
  const checkoutStats = isSpokenEnglish ? spokenEnglishStats : isIelts ? ieltsStats : genericStats;

  return (
    <div className="checkout-page">
      <Nav />

      <div className="mx-auto max-w-[1320px] px-[clamp(20px,4.5vw,56px)] pb-5 pt-[112px] sm:pt-[126px]">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#778394]">
          <Link
            href="/"
            className="transition-colors hover:text-[#14845B]"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/programs"
            className="transition-colors hover:text-[#14845B]"
          >
            Programs
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/programs/${params.slug}`}
            className="max-w-[220px] truncate transition-colors hover:text-[#14845B]"
          >
            {checkoutCourse.badge}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#14845B]">Secure checkout</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1320px] px-[clamp(20px,4.5vw,56px)] pb-[88px] sm:pb-[104px]">
        <CheckoutPanel
          course={checkoutCourse}
          moduleCount={moduleCount}
          lessonCount={lessonCount}
          intro={checkoutIntro}
          stats={checkoutStats}
          includedItems={includedItems}
        />
      </section>

      <style>{`
        .checkout-page {
          --body: #39445A;
          --line: #DDE2EC;
        }
      `}</style>
    </div>
  );
}
