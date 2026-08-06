export type SuccessStory = {
  src?: string;
  alt: string;
  tag: string;
  tagColor: string;
  quote: string;
  location: string;
  destination: string;
  initials: string;
  gradient: string;
  color: string;
};

export const successStories: SuccessStory[] = [
  {
    src: "/stories/success1.png",
    alt: "FlyBridge learner success story",
    tag: "Work Abroad",
    tagColor: "#14B57E",
    quote:
      "FlyBridge gave me the structure and confidence I needed. The career preparation course helped me land a job in Toronto within three months of completing it.",
    location: "Dhaka, Bangladesh",
    destination: "Toronto, Canada",
    initials: "SR",
    gradient: "linear-gradient(135deg,#0FA968,#188A5D 60%,#0B5E46)",
    color: "#0B5E46",
  },
  {
    src: "/stories/success2.png",
    alt: "FlyBridge learner success story",
    tag: "Study Abroad",
    tagColor: "#2F5FE0",
    quote:
      "The Academic English course was exactly what I needed for my university application. I scored 7.5 on IELTS and got accepted to my dream program.",
    location: "Mumbai, India",
    destination: "Boston, USA",
    initials: "AP",
    gradient: "linear-gradient(135deg,#4A7BFF,#2F5FE0 60%,#1E3F9E)",
    color: "#1E3F9E",
  },
  {
    src: "/stories/success3.png",
    alt: "FlyBridge learner success story",
    tag: "Career Prep",
    tagColor: "#6B4CE0",
    quote:
      "What sets FlyBridge apart is the practical focus. Every module had real-world applications. I finally feel prepared for my international career.",
    location: "Kathmandu, Nepal",
    destination: "Vancouver, Canada",
    initials: "PS",
    gradient: "linear-gradient(135deg,#8A6BF2,#6B4CE0 60%,#4A2FB8)",
    color: "#4A2FB8",
  },
  {
    src: "/stories/success4.png",
    alt: "FlyBridge learner success story",
    tag: "Work Abroad",
    tagColor: "#14B57E",
    quote:
      "I was overwhelmed by visa paperwork until I took the Work Permit Blueprint course. The checklists and templates made the whole process clear — I got my permit on the first try.",
    location: "Dhaka, Bangladesh",
    destination: "Toronto, Canada",
    initials: "IH",
    gradient: "linear-gradient(135deg,#E8A24B,#DB8A2E 60%,#B06218)",
    color: "#B06218",
  },
  {
    src: "/stories/success5.png",
    alt: "FlyBridge learner success story",
    tag: "Study Abroad",
    tagColor: "#2F5FE0",
    quote:
      "The Study Visa Prep course walked me through my visa interview step by step. The mock questions were eerily similar to the real ones — I was approved in two weeks.",
    location: "Chittagong, Bangladesh",
    destination: "New York, USA",
    initials: "NJ",
    gradient: "linear-gradient(135deg,#5E8AFF,#2F5FE0 60%,#17408F)",
    color: "#17408F",
  },
  {
    src: "/stories/success6.png",
    alt: "FlyBridge learner success story",
    tag: "Career Prep",
    tagColor: "#14B57E",
    quote:
      "My interview skills were holding me back. After Interview Readiness, I walked into every meeting with a framework — and it changed how people responded to me.",
    location: "Kolkata, India",
    destination: "Toronto, Canada",
    initials: "RA",
    gradient: "linear-gradient(135deg,#2FBF8F,#188A5D 60%,#0E5E41)",
    color: "#0E5E41",
  },
];

export const successStoryImages = successStories.filter((s) => Boolean(s.src));