"use client";

import { Transaction } from "@/app/lib/google-sheets";
import { useMemo, useEffect, useState } from "react";
import {
  getCurrentSpendingPeriod,
  getCurrentPeriod,
  filterTransactionsBySpendingPeriod,
  deriveBudgetForPeriod,
} from "@/app/lib/spending";
import { usePeriod } from "@/app/ui/dashboard/period-context";

export default function BudgetMeter({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch("/api/budgets");
        if (response.ok) {
          const data = await response.json();
          setBudgets(data.budgets || {});
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  const { periodType } = usePeriod();
  const currentPeriod = getCurrentPeriod(periodType);
  const periodTransactions = filterTransactionsBySpendingPeriod(transactions, currentPeriod);

  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};

    periodTransactions.forEach((t) => {
      const category = t.category || "Other";
      spending[category] = (spending[category] || 0) + t.amount;
    });

    return spending;
  }, [periodTransactions]);

  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  // derive budgets for the selected period (spreadsheet stores weekly budgets)
  const derivedBudgets = useMemo(() => {
    const out: Record<string, number> = {};
    Object.entries(budgets).forEach(([k, v]) => {
      const num = Number(v) || 0;
      out[k] = deriveBudgetForPeriod(num, periodType);
    });
    return out;
  }, [budgets, periodType]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Budget Status</h2>
        <p className="text-gray-500">Loading budgets...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Budget Status</h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-6">{currentPeriod.label}</p>

      <div className="space-y-4 sm:space-y-6">
        {topCategories.map(([category, spent]) => {
          const budget = derivedBudgets[category] || 500;
          const percentage = (spent / budget) * 100;
          const isOver = spent > budget;

          return (
            <div key={category}>
              <div className="flex justify-between mb-1 sm:mb-2 gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                  {category}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                    isOver ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ${spent.toFixed(2)} / ${budget.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    percentage > 100 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {isOver && (
                <p className="text-xs text-red-600 mt-1">
                  Over budget by ${(spent - budget).toFixed(2)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
