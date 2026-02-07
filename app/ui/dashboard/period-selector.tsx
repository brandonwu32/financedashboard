"use client";

import React from "react";
import { usePeriod } from "@/app/ui/dashboard/period-context";

export default function PeriodSelector() {
  const { periodType, setPeriodType } = usePeriod();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Period</label>
      <select
        value={periodType}
        onChange={(e) => setPeriodType(e.target.value as any)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="weekly">Weekly</option>
        <option value="biweekly">Bi-weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
  );
}
