"use client";

import React, { useMemo } from "react";
import { Transaction } from "@/app/lib/google-sheets";
import { getCurrentSpendingPeriod, getCurrentPeriod, filterTransactionsBySpendingPeriod } from "@/app/lib/spending";
import { usePeriod } from "@/app/ui/dashboard/period-context";

export default function ExpenseOverview({ transactions }: { transactions: Transaction[] }) {
	const { periodType } = usePeriod();
	const current = getCurrentPeriod(periodType as any);

	// Transactions in the current period
	const periodTx = filterTransactionsBySpendingPeriod(transactions, current);

	// compute totals and averages
	const totalSpent = useMemo(
		() => periodTx.reduce((s, t) => s + (Number(t.amount) || 0), 0),
		[periodTx]
	);

	const txnCount = periodTx.length;
	const avgTransaction = txnCount > 0 ? totalSpent / txnCount : 0;

	// compute previous period by shifting current period by its length
	const periodMs = current.endDate.getTime() - current.startDate.getTime() + 24 * 60 * 60 * 1000;
	const previousPeriod = {
		startDate: new Date(current.startDate.getTime() - periodMs),
		endDate: new Date(current.endDate.getTime() - periodMs),
		label: "",
		isCurrentPeriod: false,
	};

	const prevTx = filterTransactionsBySpendingPeriod(transactions, previousPeriod as any);
	const prevTotal = prevTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
	const changePercent = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

	const formatPeriodLabel = (startDate: Date, endDate: Date) => {
		const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
		const startDay = startDate.getDate();
		const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
		const endDay = endDate.getDate();

		if (startMonth === endMonth) {
			return `${startMonth} ${startDay} - ${endDay}`;
		} else {
			return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
		}
	};

	return (
		<div className="grid gap-3 sm:gap-4 md:grid-cols-3">
			<div className="bg-white rounded-lg shadow p-4 sm:p-6">
				<h3 className="text-xs sm:text-sm font-medium text-gray-500">Current Period Spending</h3>
				<p className="text-xs sm:text-sm text-gray-500 mt-1">{current.label}</p>
				<p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">${totalSpent.toFixed(2)}</p>
				<p className="text-xs sm:text-sm text-gray-600 mt-1">{txnCount} transactions</p>
			</div>

			<div className="bg-white rounded-lg shadow p-4 sm:p-6">
				<h3 className="text-xs sm:text-sm font-medium text-gray-500">Average Transaction</h3>
				<p className="text-xs sm:text-sm text-gray-500 mt-1">{current.label}</p>
				<p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">${avgTransaction.toFixed(2)}</p>
				<p className="text-xs sm:text-sm text-gray-600 mt-1">This period</p>
			</div>

			<div className="bg-white rounded-lg shadow p-4 sm:p-6">
				<h3 className="text-xs sm:text-sm font-medium text-gray-500">Change vs. Last Period</h3>
				<p className="text-xs sm:text-sm text-gray-500 mt-1">Last period: {formatPeriodLabel(previousPeriod.startDate, previousPeriod.endDate)}</p>
				<p className={`text-2xl sm:text-3xl font-bold mt-2 ${changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
					{changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
				</p>
				<p className="text-xs sm:text-sm text-gray-600 mt-1">Amount: ${prevTotal.toFixed(2)}</p>
			</div>
		</div>
	);
}

