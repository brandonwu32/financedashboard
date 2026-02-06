"use client";

import { useState } from "react";
import DashboardLayout from "@/app/ui/dashboard/layout";
import { Transaction } from "@/app/lib/google-sheets";
import { mutate } from "swr";

export default function AddExpensePage() {
  const [manualDate, setManualDate] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualCard, setManualCard] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleAddManual = async () => {
    if (saving) return;
    setError(null);

    if (!manualDate || !manualDescription || !manualAmount) {
      setError("Please fill out date, description, and amount.");
      return;
    }

    const amountNum = Number(String(manualAmount).replace(/[$,]/g, ""));
    if (Number.isNaN(amountNum)) {
      setError("Please enter a valid number for amount.");
      return;
    }

    const formatDateForSheet = (isoDate: string) => {
      if (!isoDate) return "";
      const [year, month, day] = isoDate.split("-");
      // Format as M/D/YYYY (no leading zeros) to match upload statement format
      return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    };

    const tx: Transaction = {
      date: formatDateForSheet(manualDate),
      description: manualDescription,
      amount: amountNum,
      category: manualCategory || "Uncategorized",
      creditCard: manualCard || "",
    } as Transaction;

    setSaving(true);
    setSaveSuccess(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: [tx] }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save transaction");
      }

      setManualDate("");
      setManualDescription("");
      setManualAmount("");
      setManualCategory("");
      setManualCard("");
      setSaveSuccess("Transaction added");

      try {
        mutate("/api/transactions", (current: any) => {
          const prev = (current && current.transactions) || [];
          return { transactions: [...prev, tx] };
        }, false);
        setTimeout(() => mutate("/api/transactions"), 2500);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
          <h1 className="text-lg sm:text-xl font-bold mb-4">Add Expense</h1>

          {error && (
            <div className="rounded-md bg-red-50 p-3 sm:p-4 mb-4">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="e.g., 23.45"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="e.g., Dinner at Joe's"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (optional)</label>
              <input
                type="text"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                placeholder="e.g., Dining"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card (optional)</label>
              <input
                type="text"
                value={manualCard}
                onChange={(e) => setManualCard(e.target.value)}
                placeholder="e.g., Chase Sapphire"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 sm:gap-4">
            <button
              onClick={handleAddManual}
              disabled={saving}
              className={`flex-1 ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white py-2 px-4 rounded-lg font-medium transition text-sm sm:text-base`}
            >
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
            <button
              onClick={() => {
                setManualDate("");
                setManualDescription("");
                setManualAmount("");
                setManualCategory("");
                setManualCard("");
                setError(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition text-sm sm:text-base"
            >
              Clear
            </button>
          </div>

          {saveSuccess && (
            <div className="mt-4 text-sm text-green-700">{saveSuccess}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
