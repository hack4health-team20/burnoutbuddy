"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { WeeklySummary } from "@/lib/analytics";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface WeeklyChartProps {
  summary: WeeklySummary;
}

export const WeeklyChart = ({ summary }: WeeklyChartProps) => {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.update();
  }, [summary]);

  const labels = summary.points.map((point) => point.label);
  const data = {
    labels,
    datasets: [
      {
        type: "line" as const,
        label: "Check-ins",
        data: summary.points.map((point) => point.checkIns),
        borderColor: "#5f7adb",
        backgroundColor: "rgba(95, 122, 219, 0.15)",
        borderWidth: 3,
        tension: 0.45,
        fill: true,
      },
      {
        type: "bar" as const,
        label: "Resets",
        data: summary.points.map((point) => point.resets),
        backgroundColor: "rgba(81, 192, 169, 0.5)",
        borderRadius: 999,
        barThickness: 16,
      },
    ],
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/40 bg-white/75 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Weekly view</p>
          <h3 className="text-xl font-semibold text-[var(--text)]">Check-ins & Micro-resets</h3>
        </div>
        <div className="text-sm text-[var(--muted)]">
          Streak: <span className="font-semibold text-[var(--text)]">{summary.streak} days</span>
          {summary.bestDay ? ` • Best flow: ${summary.bestDay}` : ""}
        </div>
      </div>
      <div className="mt-6">
        <Line
          ref={chartRef}
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "top" as const,
                labels: {
                  color: "#435273",
                  usePointStyle: true,
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.formattedValue}`,
                },
                backgroundColor: "rgba(22, 32, 61, 0.9)",
                titleColor: "#f8fbff",
                bodyColor: "#f8fbff",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(67, 82, 115, 0.08)",
                  drawBorder: false,
                },
                ticks: {
                  precision: 0,
                  color: "#435273",
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: "#435273",
                },
              },
            },
          }}
          height={260}
        />
      </div>
    </div>
  );
};
