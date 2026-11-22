"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./spoken-english-landing.module.css";
import { trackSpokenEnglishEvent } from "./spoken-english-interactions";

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
  const [openUnit, setOpenUnit] = useState<number | null>(0);

  return (
    <div className={styles.curriculumList}>
      {units.map((unit, index) => {
        const isOpen = openUnit === index;
        const panelId = `spoken-unit-panel-${index + 1}`;
        const triggerId = `spoken-unit-trigger-${index + 1}`;

        return (
          <article
            key={unit.title}
            className={`${styles.curriculumItem} ${isOpen ? styles.curriculumItemOpen : ""}`}
          >
            <h3 className={styles.curriculumItemHeading}>
              <button
                id={triggerId}
                className={styles.curriculumTrigger}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpenUnit(isOpen ? null : index);
                  if (!isOpen) {
                    trackSpokenEnglishEvent("spoken_english_curriculum_expand", {
                      unit_index: index + 1,
                    });
                  }
                }}
              >
                <span className={styles.curriculumNode} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.curriculumTriggerCopy}>
                  <span className={styles.curriculumUnitTitle}>{unit.title}</span>
                  <span className={styles.curriculumUnitMeta}>১০টি লেসন</span>
                </span>
                <ChevronDown className={styles.curriculumChevron} aria-hidden="true" size={18} />
              </button>
            </h3>

            <div
              id={panelId}
              className={`${styles.curriculumPanel} ${isOpen ? styles.curriculumPanelOpen : ""}`}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
            >
              <div className={styles.curriculumPanelInner}>
                <p>{unit.description}</p>
                <span>10 LESSONS IN THIS UNIT</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
