"use client";

import { useEffect, useState } from "react";
import { Card } from "./card";

type Course = {
  id: string;
  title: string;
  joinees: number;
  paid: number;
};

export function TopCourses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch("/api/admin/reports/top-courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setCourses(res.data?.courses ?? []))
      .catch(() => {});
  }, []);

  return (
    <Card title="Top selling courses" subtitle="Course name, joinees and paid users">
      {courses.length === 0 ? (
        <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
          No registrations yet — top courses will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                <th className="pb-3 font-medium">Course</th>
                <th className="pb-3 font-medium text-right">Joinees</th>
                <th className="pb-3 font-medium text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t text-[13.5px]" style={{ borderColor: "var(--line)" }}>
                  <td className="py-3 pr-4 font-medium truncate max-w-[180px]" style={{ color: "var(--ink)" }}>
                    {c.title}
                  </td>
                  <td className="py-3 text-right font-semibold" style={{ color: "var(--ink)" }}>
                    {c.joinees}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="font-mono text-[10px] font-semibold rounded-full px-2.5 py-1"
                      style={
                        c.paid > 0
                          ? { background: "rgba(245,158,11,0.12)", color: "#B45309" }
                          : { background: "rgba(14,165,233,0.12)", color: "#0369A1" }
                      }
                    >
                      {c.paid}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}