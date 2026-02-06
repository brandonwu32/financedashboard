"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import DashboardLayout from "@/app/ui/dashboard/layout";
import ExpenseOverview from "@/app/ui/dashboard/expense-overview";
import BudgetMeter from "@/app/ui/dashboard/budget-meter";
import SpendingChart from "@/app/ui/dashboard/spending-chart";
import RecentTransactions from "@/app/ui/dashboard/recent-transactions";
import { Transaction } from "@/app/lib/google-sheets";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data, isLoading } = useSWR(
    session?.user?.email ? "/api/transactions" : null,
    fetcher,
    {
      dedupingInterval: 60_000, // dedupe identical requests for 60s
      revalidateOnFocus: false, // avoid refetch on window focus
      refreshInterval: 5 * 60_000, // optional background refresh every 5 minutes
      shouldRetryOnError: false,
    }
  );

  const transactions: Transaction[] = (data?.transactions as Transaction[]) || [];

  // Redirect to login if not authenticated (middleware should catch this, but as a fallback)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (data && !data.transactions) {
      setError("Failed to load transactions");
    } else {
      setError(null);
    }
  }, [data]);

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 text-sm sm:text-base">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user?.email) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        )}

        <ExpenseOverview transactions={transactions} />

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <BudgetMeter transactions={transactions} />
          <SpendingChart transactions={transactions} />
        </div>

        <RecentTransactions transactions={transactions} />
      </div>
    </DashboardLayout>
  );
}
