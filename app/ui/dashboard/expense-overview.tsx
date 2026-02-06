import { Transaction } from "@/app/lib/google-sheets";
import { getCurrentBiWeeklyPeriod, filterTransactionsByPeriod } from "@/app/lib/bi-weekly";

export default function ExpenseOverview({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const currentPeriod = getCurrentBiWeeklyPeriod();
  const previousPeriod = {
    startDate: new Date(currentPeriod.startDate.getTime() - 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(currentPeriod.endDate.getTime() - 14 * 24 * 60 * 60 * 1000),
  };

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

  const thisperiodTransactions = filterTransactionsByPeriod(transactions, currentPeriod);
  const totalSpent = thisperiodTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgTransaction =
    thisperiodTransactions.length > 0
      ? totalSpent / thisperiodTransactions.length
      : 0;

  const prevPeriodTransactions = filterTransactionsByPeriod(transactions, {
    startDate: previousPeriod.startDate,
    endDate: previousPeriod.endDate,
    label: "",
    isCurrentPeriod: false,
  });

  const prevPeriodTotal = prevPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
  const changePercent = prevPeriodTotal > 0 
    ? ((totalSpent - prevPeriodTotal) / prevPeriodTotal) * 100 
    : 0;

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500">Current Period Spending</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{currentPeriod.label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          ${totalSpent.toFixed(2)}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {thisperiodTransactions.length} transactions
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500">Average Transaction</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{currentPeriod.label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          ${avgTransaction.toFixed(2)}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          This period
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500">
          Change vs. Last Period
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Last period: {formatPeriodLabel(previousPeriod.startDate, previousPeriod.endDate)}</p>
        <p className={`text-2xl sm:text-3xl font-bold mt-2 ${changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Amount: ${prevPeriodTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
