export type ChartData = {
  chartType: "line" | "bar" | "pie" | "table";
  title?: string;
  xAxis?: string[];
  yAxisLabel?: string;
  categories?: string[];
  series: { name: string; data: number[] }[];
  unit?: string;
  source?: string;
};
