"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/app/ui/dashboard/layout";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch budgets from API
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/budgets");
        if (response.ok) {
          const data = await response.json();
          setBudgets(data.budgets || {});
        } else {
          setError("Failed to load budgets");
        }
      } catch (err) {
        console.error("Error fetching budgets:", err);
        setError("Error loading budgets");
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  const handleBudgetChange = (category: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBudgets((prev) => ({
      ...prev,
      [category]: numValue,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ budgets }),
      });

      if (!response.ok) {
        throw new Error("Failed to save budgets");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving budgets:", err);
      setError(err instanceof Error ? err.message : "Error saving budgets");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user?.email) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Budgets
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Set your budget for each spending category. These budgets will be
              used to display progress on the dashboard.
            </p>

            <div className="space-y-4">
              {Object.entries(budgets).map(([category, amount]) => (
                <div key={category} className="flex items-end gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {category}
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) =>
                          handleBudgetChange(category, e.target.value)
                        }
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-6 rounded-md bg-red-50 p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-red-700">
                  ✗ {error}
                </p>
              </div>
            )}

            {saved && (
              <div className="mt-6 rounded-md bg-green-50 p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-green-700">
                  ✓ Budgets saved successfully to spreadsheet
                </p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Budgets"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm sm:text-base text-gray-900 break-all">{session.user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
