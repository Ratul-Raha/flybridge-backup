import styles from "./spoken-english-landing.module.css";

const units = [
  { title: "Hello, Me", description: "নিজের পরিচয়, পরিবার" },
  { title: "My Day", description: "রুটিন, সময়" },
  { title: "Out and About", description: "কেনাকাটা, খাবার, রাস্তা" },
  { title: "People and Places", description: "মানুষ আর জায়গার বর্ণনা" },
  { title: "Right Now", description: "এখন কী হচ্ছে, ফোন, আবহাওয়া" },
  { title: "Yesterday", description: "গতকাল কী হয়েছে" },
  { title: "Plans and Future", description: "প্ল্যান, দাওয়াত, ভ্রমণ" },
  { title: "Health and Help", description: "ডাক্তার, সাহায্য চাওয়া" },
  { title: "Work and Study", description: "চাকরি, ইন্টারভিউ, ইমেইল" },
  { title: "Real-Life Confidence", description: "মতামত দেওয়া, ২ মিনিট কথা বলা" },
];

export function SpokenEnglishCurriculum() {
  return (
    <div className={styles.curriculumGrid}>
      {units.map((unit, index) => (
        <article className={styles.curriculumCard} key={unit.title}>
          <div className={styles.curriculumCardTop}>
            <span className={styles.curriculumNode} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles.curriculumUnitMeta}>১০টি লেসন</span>
          </div>
          <h3 className={styles.curriculumUnitTitle}>{unit.title}</h3>
          <p className={styles.curriculumUnitDescription}>{unit.description}</p>
        </article>
      ))}
    </div>
  );
}
