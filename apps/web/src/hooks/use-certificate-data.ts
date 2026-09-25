"use client";

import { useCallback, useEffect, useState } from "react";

export type CertificateGradeData = {
  percentage: number;
  grade: string;
  performance?: string;
  englishLevel: string;
  passed: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
};

export type CertificateProgressData = {
  grade: CertificateGradeData;
  certificateIssued: boolean;
};

type UseCertificateData = {
  courseId: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  progress: CertificateProgressData | null;
  serverEligible: boolean;
  issuedCertId: string;
  issuedAt: string | null;
  downloadCount: number;
  loading: boolean;
  certificateEnabled: boolean;
};

export function useCertificateData(slug: string): UseCertificateData {
  const [courseId, setCourseId] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [progress, setProgress] = useState<CertificateProgressData | null>(null);
  const [serverEligible, setServerEligible] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState("");
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [certificateEnabled, setCertificateEnabled] = useState(true);

  const load = useCallback(async () => {
    try {
      const userRes = await fetch("/api/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.name ?? "");
        setUserEmail(userData.email ?? "");
        setUserAvatar(userData.avatar ?? null);
      }

      const courseRes = await fetch(`/api/courses?slug=${slug}`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        const course = courseData.course;
        setCourseTitle(course?.title ?? "");
        setCourseId(course?.id ?? "");
        setCertificateEnabled(course?.certificateEnabled ?? true);
        if (course?.id) {
          const progRes = await fetch(`/api/courses/${course.id}/progress`);
          if (progRes.ok) {
            const progData = await progRes.json();
            setProgress(progData);
          }

          // Authoritative server-side gate: recomputes eligibility from the DB
          // and flips certificateIssued to true when eligible. We must not gate
          // on progress.certificateIssued — that flag is only set by this gate,
          // so using it here would lock eligible users out permanently.
          const certRes = await fetch(`/api/courses/${course.id}/certificate`, {
            cache: "no-store",
          });
          if (certRes.ok) {
            const certData = await certRes.json();
            if (certData?.eligible) {
              setServerEligible(true);
              if (certData.certId) setIssuedCertId(certData.certId);
              if (certData.issuedAt) setIssuedAt(certData.issuedAt);
              if (typeof certData.downloadCount === "number")
                setDownloadCount(certData.downloadCount);
            }
          }
        }
      }
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    courseId,
    courseTitle,
    userName,
    userEmail,
    userAvatar,
    progress,
    serverEligible,
    issuedCertId,
    issuedAt,
    downloadCount,
    loading,
    certificateEnabled,
  };
}