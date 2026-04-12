"use client";

import { useEffect, useRef } from "react";
import { ProcessedEntry } from "@/lib/types";
import { linearTrend, formatRate } from "@/lib/calculations";

declare const Chart: any;

interface ChartsProps {
  entries: ProcessedEntry[];
}

function trendDataset(
  label: string,
  dates: string[],
  values: number[],
  color: string,
  unit: string,
  yAxisID?: string
) {
  const { points, slopePerDay } = linearTrend(dates, values);
  const rate = formatRate(slopePerDay, unit);
  const ds: any = {
    label: `${label}: ${rate}`,
    data: points,
    borderColor: color,
    borderDash: [8, 4],
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    tension: 0,
  };
  if (yAxisID) ds.yAxisID = yAxisID;
  return ds;
}

const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#9ca3af", font: { size: 11 } } },
  },
  scales: {
    x: {
      type: "time",
      time: { unit: "week", tooltipFormat: "dd MMM yyyy" },
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#9ca3af", font: { size: 10 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#9ca3af", font: { size: 10 } },
    },
  },
};

export default function Charts({ entries }: ChartsProps) {
  const weightRef = useRef<HTMLCanvasElement>(null);
  const bodyCompRef = useRef<HTMLCanvasElement>(null);
  const fatMuscleRef = useRef<HTMLCanvasElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const lbmFatRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!entries.length || typeof Chart === "undefined") return;

    Object.values(chartsRef.current).forEach((c: any) => c?.destroy());
    chartsRef.current = {};

    const dates = entries.map((e) => e.date);
    const weights = entries.map((e) => e.weight);

    // Weight chart
    if (weightRef.current) {
      chartsRef.current.weight = new Chart(weightRef.current, {
        type: "line",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Poids (kg)",
              data: weights,
              borderColor: "#818cf8",
              backgroundColor: "rgba(129,140,248,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
              pointHoverRadius: 5,
            },
            trendDataset("Tendance poids", dates, weights, "#818cf8", "kg"),
          ],
        },
        options: chartOptions,
      });
    }

    // Body comp
    const comp = entries.filter((e) => e.fat && e.muscle);
    const compDates = comp.map((e) => e.date);
    const fatVals = comp.map((e) => e.fat!);
    const muscleVals = comp.map((e) => e.muscle!);

    if (bodyCompRef.current && comp.length) {
      chartsRef.current.bodyComp = new Chart(bodyCompRef.current, {
        type: "line",
        data: {
          labels: compDates,
          datasets: [
            {
              label: "Graisse (%)",
              data: fatVals,
              borderColor: "#f472b6",
              backgroundColor: "rgba(244,114,182,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
            {
              label: "Muscle (%)",
              data: muscleVals,
              borderColor: "#34d399",
              backgroundColor: "rgba(52,211,153,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
            {
              label: "Os (%)",
              data: comp.map((e) => e.bone),
              borderColor: "#fbbf24",
              backgroundColor: "rgba(251,191,36,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
            trendDataset("Tendance graisse", compDates, fatVals, "#f472b6", "%"),
            trendDataset("Tendance muscle", compDates, muscleVals, "#34d399", "%"),
          ],
        },
        options: chartOptions,
      });
    }

    // Fat vs Muscle (dual axis)
    if (fatMuscleRef.current && comp.length) {
      chartsRef.current.fatMuscle = new Chart(fatMuscleRef.current, {
        type: "line",
        data: {
          labels: compDates,
          datasets: [
            {
              label: "Graisse (%)",
              data: fatVals,
              borderColor: "#f472b6",
              tension: 0.3,
              pointRadius: 2,
              yAxisID: "y",
            },
            {
              label: "Muscle (%)",
              data: muscleVals,
              borderColor: "#34d399",
              tension: 0.3,
              pointRadius: 2,
              yAxisID: "y1",
            },
            trendDataset("Tendance graisse", compDates, fatVals, "#f472b6", "%", "y"),
            trendDataset("Tendance muscle", compDates, muscleVals, "#34d399", "%", "y1"),
          ],
        },
        options: {
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            y: {
              ...chartOptions.scales.y,
              position: "left",
              title: { display: true, text: "Graisse %", color: "#f472b6" },
            },
            y1: {
              ...chartOptions.scales.y,
              position: "right",
              grid: { drawOnChartArea: false },
              title: { display: true, text: "Muscle %", color: "#34d399" },
            },
          },
        },
      });
    }

    // Water
    const waterEntries = entries.filter((e) => e.water);
    if (waterRef.current && waterEntries.length) {
      const wDates = waterEntries.map((e) => e.date);
      const wVals = waterEntries.map((e) => e.water!);
      chartsRef.current.water = new Chart(waterRef.current, {
        type: "line",
        data: {
          labels: wDates,
          datasets: [
            {
              label: "Eau (%)",
              data: wVals,
              borderColor: "#60a5fa",
              backgroundColor: "rgba(96,165,250,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
            trendDataset("Tendance eau", wDates, wVals, "#60a5fa", "%"),
          ],
        },
        options: chartOptions,
      });
    }

    // LBM vs Fat (kg)
    const lbmEntries = entries.filter((e) => e.lbm && e.fatKg);
    if (lbmFatRef.current && lbmEntries.length) {
      const lDates = lbmEntries.map((e) => e.date);
      const lbmVals = lbmEntries.map((e) => e.lbm!);
      const fatKgVals = lbmEntries.map((e) => e.fatKg!);
      chartsRef.current.lbmFat = new Chart(lbmFatRef.current, {
        type: "line",
        data: {
          labels: lDates,
          datasets: [
            {
              label: "Masse maigre (kg)",
              data: lbmVals,
              borderColor: "#34d399",
              backgroundColor: "rgba(52,211,153,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
              yAxisID: "y",
            },
            {
              label: "Masse grasse (kg)",
              data: fatKgVals,
              borderColor: "#f472b6",
              backgroundColor: "rgba(244,114,182,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
              yAxisID: "y1",
            },
            trendDataset("Tendance maigre", lDates, lbmVals, "#34d399", "kg", "y"),
            trendDataset("Tendance grasse", lDates, fatKgVals, "#f472b6", "kg", "y1"),
          ],
        },
        options: {
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            y: {
              ...chartOptions.scales.y,
              position: "left",
              title: { display: true, text: "Maigre (kg)", color: "#34d399" },
            },
            y1: {
              ...chartOptions.scales.y,
              position: "right",
              grid: { drawOnChartArea: false },
              title: { display: true, text: "Grasse (kg)", color: "#f472b6" },
            },
          },
        },
      });
    }

    return () => {
      Object.values(chartsRef.current).forEach((c: any) => c?.destroy());
    };
  }, [entries]);

  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 max-[900px]:grid-cols-1">
      <ChartCard title="Evolution du poids">
        <canvas ref={weightRef} />
      </ChartCard>
      <ChartCard title="Composition corporelle">
        <canvas ref={bodyCompRef} />
      </ChartCard>
      <ChartCard title="Masse grasse vs Musculaire">
        <canvas ref={fatMuscleRef} />
      </ChartCard>
      <ChartCard title="Hydratation">
        <canvas ref={waterRef} />
      </ChartCard>
      <ChartCard title="Masse maigre vs Masse grasse (kg)">
        <canvas ref={lbmFatRef} />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 min-h-[300px]">
      <h2 className="text-sm font-semibold text-[#9ca3af] mb-3">{title}</h2>
      <div className="max-h-[260px]">{children}</div>
    </div>
  );
}
