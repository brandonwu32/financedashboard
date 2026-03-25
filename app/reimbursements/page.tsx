"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import DashboardLayout from "@/app/ui/dashboard/layout";
import { Transaction } from "@/app/lib/google-sheets";

export default function Reimbursements() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data, isLoading, mutate } = useSWR(
    session?.user?.email ? "/api/transactions" : null,
    fetcher,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      refreshInterval: 5 * 60_000,
      shouldRetryOnError: false,
    }
  );

  const transactions: Transaction[] = (data?.transactions as Transaction[]) || [];

  // Filter for reimbursable transactions
  const reimbursableTransactions = transactions
    .filter((t) => t.reimbursable)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (data && data.onboarded === false) {
      router.push("/new-user");
      return;
    }

    if (data && !data.transactions) {
      setError("Failed to load transactions");
    } else {
      setError(null);
    }
  }, [data]);

  const handleMarkReimbursed = async (transaction: Transaction, index: number) => {
    try {
      setProcessing((prev) => new Set(prev).add(index));

      const response = await fetch("/api/reimbursement-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record reimbursement");
      }

      // Refresh the transactions list
      await mutate();
      setError(null);
    } catch (err) {
      console.error("Error marking as reimbursed:", err);
      setError(err instanceof Error ? err.message : "Failed to record reimbursement");
    } finally {
      setProcessing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reimbursements</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage expenses awaiting reimbursement
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">
                    Description
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700 hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700 hidden md:table-cell">
                    Card
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-center font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reimbursableTransactions.map((transaction, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-2 text-gray-600 whitespace-nowrap">
                      {transaction.date ? (() => {
                        // Handle both MM/DD/YYYY and YYYY-MM-DD formats
                        let dateObj: Date;
                        if (transaction.date.includes("/")) {
                          // MM/DD/YYYY format
                          const [mm, dd, yyyy] = transaction.date.split("/");
                          dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
                        } else {
                          // YYYY-MM-DD format
                          const [year, month, day] = transaction.date.split("-");
                          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        }
                        return dateObj.toLocaleDateString();
                      })() : ""}
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-gray-900 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-gray-600 hidden md:table-cell">
                      {transaction.creditCard}
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-center">
                      <button
                        onClick={() => handleMarkReimbursed(transaction, idx)}
                        disabled={processing.has(idx)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs sm:text-sm font-medium rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                      >
                        {processing.has(idx) ? "Processing..." : "Settle"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reimbursableTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No reimbursable expenses at this time</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
