"use client";

import type { MockTestChart } from "@/lib/mock-test-ui";
import { WritingChart } from "@/components/shared/writing-chart";

export function WritingTaskChart({ chart }: { chart: MockTestChart }) {
  return <WritingChart chart={chart} />;
}
