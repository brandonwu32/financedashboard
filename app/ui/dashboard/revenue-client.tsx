"use client";

import React, { useMemo, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Transaction } from "@/app/lib/google-sheets";
import { /* generateYAxis */ } from "@/app/lib/utils";
import { usePeriod } from "@/app/ui/dashboard/period-context";

type RevenuePoint = { month: string; revenue: number };

function formatMonth(date: Date) {
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function formatPeriodLabel(start: Date, periodType: string) {
  if (periodType === "monthly") return formatMonth(start);
  if (periodType === "yearly") return `${start.getFullYear()}`;
  // weekly / biweekly: show short month + day
  return start.toLocaleDateString("default", { month: "short", day: "numeric" });
}

function periodStartDates(periodType: string, count = 12) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const starts: Date[] = [];

  if (periodType === "monthly") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      starts.push(d);
    }
    return starts;
  }

  if (periodType === "yearly") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear() - i, 0, 1);
      d.setHours(0, 0, 0, 0);
      starts.push(d);
    }
    return starts;
  }

  // weekly/biweekly use Saturday-to-Friday windows
  if (periodType === "weekly") {
    // find most recent Saturday (day 6) <= today
    const day = now.getDay();
    const diffToSaturday = (day - 6 + 7) % 7; // days since last Saturday
    const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday);
    saturday.setHours(0, 0, 0, 0);
    // return 7 daily buckets from that Saturday (Saturday..Friday)
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + i);
      starts.push(d);
    }
    return starts;
  }

  // biweekly: start from the first Saturday of the year and find the current 14-day block
  if (periodType === "biweekly") {
    const year = now.getFullYear();
    let first = new Date(year, 0, 1);
    // find first Saturday of the year
    while (first.getDay() !== 6) {
      first.setDate(first.getDate() + 1);
    }
    first.setHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((now.getTime() - first.getTime()) / msPerDay);
    const blockIndex = Math.floor(diffDays / 14);
    const blockStart = new Date(first.getTime() + blockIndex * 14 * msPerDay);
    blockStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate() + i);
      starts.push(d);
    }
    return starts;
  }

  return starts;
}

export default function RevenueClient({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const chartHeight = 220;
  const { periodType } = usePeriod();

  // compute totals for the last 12 periods depending on the selected period type
  const revenue = useMemo(() => {
    const starts = periodStartDates(periodType, 12);
    const points: RevenuePoint[] = starts.map((s) => ({ month: formatPeriodLabel(s, periodType), revenue: 0 }));

    // determine end dates for each period (exclusive)
    const ends: Date[] = starts.map((s, i) => {
      if (i === starts.length - 1) {
        // last period ends at now + 1 day
        return new Date(new Date().getTime() + 24 * 3600 * 1000);
      }
      return starts[i + 1];
    });

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;

      for (let i = 0; i < starts.length; i++) {
        if (d >= starts[i] && d < ends[i]) {
          points[i].revenue += Number(tx.amount || 0) || 0;
          break;
        }
      }
    });

    return points;
  }, [transactions, periodType]);

  // Compute a sensible topLabel based on the max revenue in the current period
  const computeYAxis = (points: RevenuePoint[]) => {
    const max = Math.max(...points.map((p) => p.revenue), 0);
    if (max <= 0) return { yAxisLabels: ["$0"], yAxisValues: [0], topLabel: 1 };

    // Round up to a 'nice' top value (1,2,5 * 10^n)
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const candidates = [1, 2, 5, 10].map((s) => s * magnitude);
    let top = candidates.find((c) => c >= max) || candidates[candidates.length - 1];

    // Compute 4 intervals (top, top-step, ..., 0). Choose integer step.
    const step = Math.ceil(top / 4);
    const values: number[] = [];
    for (let i = 0; i <= 4; i++) {
      const value = Math.max(0, top - step * i);
      values.push(value);
    }

    const yAxisLabels = values.map((v) =>
      v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    );

    // Return values in order (may contain duplicates) so labels align
    return { yAxisLabels, yAxisValues: values, topLabel: top };
  };

  const { yAxisLabels, yAxisValues, topLabel } = computeYAxis(revenue);

  if (!revenue || revenue.length === 0) {
    return <p className="mt-4 text-gray-400">No data available.</p>;
  }

  const [hover, setHover] = useState<{ index: number; amount: number } | null>(null);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Recent Revenue</h2>

      <div className="rounded-md bg-gray-50 p-4">
        <div className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4">
          <div className="col-span-12 flex items-end" style={{ height: `${chartHeight}px` }}>
            {revenue.map((month, idx) => (
              <div key={month.month} className="relative flex-1 flex flex-col items-center gap-2 px-1">
                {/* Tooltip shown on hover */}
                {hover?.index === idx && (
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
                    <div className="rounded-md bg-white shadow px-3 py-1 text-xs font-medium text-gray-900">
                      {month.revenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </div>
                  </div>
                )}

                {(() => {
                  const barHeightPx = ((month.revenue || 0) / (topLabel || 1)) * chartHeight;
                  const safeHeight = Math.max(Math.round(barHeightPx), month.revenue > 0 ? 6 : 2);
                  return (
                    <div
                      onMouseEnter={() => setHover({ index: idx, amount: month.revenue })}
                      onMouseLeave={() => setHover(null)}
                      role="img"
                      aria-label={`${month.month}: ${month.revenue}`}
                      className={`w-full rounded-md transition-all ${month.revenue === 0 ? 'bg-blue-400' : 'bg-orange-400'}`}
                      style={{
                        height: `${safeHeight}px`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                      }}
                    />
                  );
                })()}

                <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">{month.month}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">{/* period label placeholder */}</h3>
        </div>
      </div>
    </div>
  );
}

