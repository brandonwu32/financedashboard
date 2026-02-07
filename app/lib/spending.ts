/**
 * Bi-weekly period utility for tracking expenses between paydays
 * User gets paid on Fridays, so tracking period is Saturday after payday to Friday of payday
 */

export interface SpendingPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
  isCurrentPeriod: boolean;
}

/**
 * Get all bi-weekly periods relative to today
 * @param lastPayday Date of the last payday (Friday)
 * @returns Array of bi-weekly periods
 */
export function getSpendingPeriods(lastPayday: Date = new Date(2026, 0, 30)): SpendingPeriod[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the Saturday after the last payday (start of current tracking period)
  const lastPaydayDate = new Date(lastPayday);
  lastPaydayDate.setHours(0, 0, 0, 0);
  
  const nextSaturday = new Date(lastPaydayDate);
  // If lastPayday is Friday (5), next Saturday is +1 day
  // If lastPayday is any other day, calculate accordingly
  const dayOfWeek = lastPaydayDate.getDay();
  const daysToAdd = dayOfWeek === 5 ? 1 : (6 - dayOfWeek + 7) % 7;
  nextSaturday.setDate(nextSaturday.getDate() + daysToAdd);

  const periods: SpendingPeriod[] = [];

  // Generate periods: 2 in the past, current, and 2 in the future
  for (let i = -2; i <= 2; i++) {
    const startDate = new Date(nextSaturday);
    startDate.setDate(startDate.getDate() + i * 14);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 14 days total (inclusive)

    const isCurrentPeriod = today >= startDate && today <= endDate;

    const label = formatPeriodLabel(startDate, endDate);

    periods.push({
      startDate,
      endDate,
      label,
      isCurrentPeriod,
    });
  }

  return periods;
}

/**
 * Get the current bi-weekly period
 */
export function getCurrentSpendingPeriod(lastPayday: Date = new Date(2026, 0, 30)): SpendingPeriod {
  const periods = getSpendingPeriods(lastPayday);
  const current = periods.find((p) => p.isCurrentPeriod);
  return current || periods[2]; // Default to middle period if not found
}

/**
 * Get the current period based on a period type.
 * Supports 'weekly', 'biweekly', 'monthly', 'yearly'.
 */
export function getCurrentPeriod(periodType: 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'weekly') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;
  let label = "";

  if (periodType === 'monthly') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of month
    label = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } else if (periodType === 'yearly') {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today.getFullYear(), 11, 31);
    label = `${today.getFullYear()}`;
  } else if (periodType === 'biweekly') {
    // Use the bi-weekly logic: find the most recent Saturday that begins the period
    // We'll reuse getSpendingPeriods to find the current biweekly period
    const cur = getCurrentSpendingPeriod();
    startDate = cur.startDate;
    endDate = cur.endDate;
    label = cur.label;
  } else {
    // weekly: start on Sunday and end on Saturday
    const day = today.getDay();
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const sLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const eLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    label = `${sLabel} - ${eLabel}`;
  }

  return {
    startDate,
    endDate,
    label,
    isCurrentPeriod: true,
  } as SpendingPeriod;
}

/**
 * Format a period label like "Jan 5 - Jan 17"
 */
function formatPeriodLabel(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

/**
 * Filter transactions for a specific spending period
 */
export function filterTransactionsBySpendingPeriod(
  transactions: any[],
  period: SpendingPeriod
): any[] {
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    }

    // M/D/YYYY or MM/DD/YYYY
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map((p) => p.trim());
      if (parts.length === 3) {
        const m = Number(parts[0]);
        const d = Number(parts[1]);
        const y = Number(parts[2]);
        if (!Number.isNaN(m) && !Number.isNaN(d) && !Number.isNaN(y)) {
          return new Date(y, m - 1, d);
        }
      }
    }

    // "Jan 10" (no year) -> assume current year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.trim().split(" ");
    if (parts.length >= 2) {
      const mIndex = monthNames.indexOf(parts[0]);
      const day = Number(parts[1]);
      if (mIndex !== -1 && !Number.isNaN(day)) {
        const year = new Date().getFullYear();
        return new Date(year, mIndex, day);
      }
    }

    return null;
  };

  return transactions.filter((t) => {
    const parsed = parseDate((t.date || "").toString());
    if (!parsed) return false;
    parsed.setHours(0, 0, 0, 0);
    return parsed >= period.startDate && parsed <= period.endDate;
  });
}

/**
 * Derive a budget value for a given periodType from a weekly budget value.
 * @param weeklyBudget number weekly budget (base)
 * @param periodType 'weekly'|'biweekly'|'monthly'|'yearly'
 */
export function deriveBudgetForPeriod(weeklyBudget: number, periodType: string = 'weekly') {
  const weekly = Number(weeklyBudget) || 0;
  switch (periodType) {
    case 'biweekly':
    case 'bi-weekly':
      return weekly * 2;
    case 'monthly':
      // approximate monthly from weekly: 52 weeks / 12 months
      return weekly * (52 / 12);
    case 'yearly':
    case 'annual':
      return weekly * 52;
    case 'weekly':
    default:
      return weekly;
  }
}
