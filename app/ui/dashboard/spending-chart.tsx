"use client";

import React, { useMemo } from "react";
import { Transaction } from "@/app/lib/google-sheets";
import { getCurrentSpendingPeriod, filterTransactionsBySpendingPeriod } from "@/app/lib/spending";
import { usePeriod } from "@/app/ui/dashboard/period-context";

export default function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const { periodType } = usePeriod();
  const current = getCurrentSpendingPeriod();
  const periodTx = filterTransactionsBySpendingPeriod(transactions, current);

  const buckets = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.forEach((t) => {
      const cat = (t.category || "Other").toString();
      map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [periodTx]);

  const max = Math.max(1, ...buckets.map(([, v]) => v));

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-3">Spending Breakdown</h3>
      <div className="space-y-3">
        {buckets.length === 0 && <p className="text-sm text-gray-500">No spending for this period.</p>}
        {buckets.map(([cat, amt]) => (
          <div key={cat}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-700 truncate">{cat}</span>
              <span className="text-sm font-medium text-gray-800">${amt.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(amt / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
