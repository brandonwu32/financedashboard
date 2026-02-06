"use client";

import { Transaction } from "@/app/lib/google-sheets";
import { useMemo, useRef, useState, useEffect } from "react";
import { getCurrentBiWeeklyPeriod, filterTransactionsByPeriod } from "@/app/lib/bi-weekly";

export default function SpendingChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const currentPeriod = getCurrentBiWeeklyPeriod();

  const chartData = useMemo(() => {
    const periodTransactions = filterTransactionsByPeriod(transactions, currentPeriod);

    // Helper: format Date -> YYYY-MM-DD (local)
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Build days array in YYYY-MM-DD local format
    const days: string[] = [];
    const currentDate = new Date(currentPeriod.startDate);
    while (currentDate <= currentPeriod.endDate) {
      days.push(formatYMD(new Date(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const dailySpending: Record<string, number> = {};

    // Normalize transaction date strings into YYYY-MM-DD and sum
    const normalizeDateStr = (dateStr: string) => {
      if (!dateStr) return null;
      // already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // M/D/YYYY
      if (dateStr.includes("/")) {
        const p = dateStr.split("/").map((s) => s.trim());
        if (p.length === 3) {
          const mm = String(Number(p[0])).padStart(2, "0");
          const dd = String(Number(p[1])).padStart(2, "0");
          const yy = p[2];
          return `${yy}-${mm}-${dd}`;
        }
      }
      // "Jan 10" -> assume current year
      const parts = dateStr.trim().split(" ");
      if (parts.length >= 2) {
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const mIdx = monthNames.indexOf(parts[0]);
        const d = Number(parts[1]);
        if (mIdx !== -1 && !Number.isNaN(d)) {
          const y = new Date().getFullYear();
          return `${y}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
      }
      return null;
    };

    periodTransactions.forEach((t) => {
      const norm = normalizeDateStr(String(t.date));
      if (!norm) return;

      // Defensive: coerce amount to a number, strip $ and commas
      let amt: number;
      if (typeof t.amount === "number") {
        amt = t.amount;
      } else {
        const cleaned = String(t.amount).replace(/[^0-9.-]+/g, "");
        amt = parseFloat(cleaned) || 0;
        if (cleaned === "" || Number.isNaN(amt)) {
          amt = 0;
        }
      }

      if (days.includes(norm)) {
        dailySpending[norm] = (dailySpending[norm] || 0) + amt;
      }
    });

    // debugging removed

    const parseYMDToDate = (ymd: string) => {
      const [y, m, d] = ymd.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    return days.map((date) => ({
      date: parseYMDToDate(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      amount: dailySpending[date] || 0,
    }));
  }, [transactions, currentPeriod]);

  // debugging removed

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 100);
  const avgDailySpend =
    chartData.reduce((sum, d) => sum + d.amount, 0) / chartData.length;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeightPx, setContainerHeightPx] = useState<number>(0);

  useEffect(() => {
    function update() {
      if (containerRef.current) {
        setContainerHeightPx(containerRef.current.clientHeight);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        Spending Over Time
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-6">{currentPeriod.label}</p>

      <div className="h-48 sm:h-64 flex items-end gap-0.5 sm:gap-1 border border-gray-100 p-1 rounded-md">
        <div ref={containerRef} className="flex-1 h-full flex items-end gap-0.5 sm:gap-1">
        {chartData.map((data, idx) => {
          const pct = maxAmount > 0 ? data.amount / maxAmount : 0;
          const isAboveAvg = data.amount > avgDailySpend;

          // compute pixel height based on measured container height (leave room for labels)
          const availablePx = Math.max(containerHeightPx - 28, 48); // reserve space for labels
          const barPx = Math.max(Math.round(pct * availablePx), 8); // minimum 8px

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group"
              title={`${data.date}: $${data.amount.toFixed(2)}`}
            >
              <div className="text-[10px] text-gray-700 mb-1">
                ${data.amount.toFixed(0)}
              </div>
              <div
                className={`w-full transition-opacity hover:opacity-75 rounded-sm`}
                style={{
                  height: `${barPx}px`,
                  minHeight: `${8}px`,
                  backgroundColor: isAboveAvg ? '#fb923c' : '#2563eb',
                }}
              />
              <span className="text-xs text-gray-500 mt-1 hidden group-hover:inline whitespace-nowrap">
                {data.date}
              </span>
            </div>
          );
        })}
        </div>
      </div>
      {chartData.every((d) => d.amount === 0) && (
        <div className="mt-4 text-center text-sm text-gray-500">
          No spending data for this period.
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Daily Average</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
              ${avgDailySpend.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Highest Day</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
              ${Math.max(...chartData.map((d) => d.amount)).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Active Days</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
              {chartData.filter((d) => d.amount > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
