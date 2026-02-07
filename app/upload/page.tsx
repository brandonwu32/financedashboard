"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/app/ui/dashboard/layout";
import { Transaction } from "@/app/lib/google-sheets";
import EditableTransactionsTable from "@/app/ui/upload/editable-transactions-table";

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [creditCard, setCreditCard] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<null | { allowed: boolean; onboarded: boolean }>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const isSaveDisabled = saving || (onboarding ? !onboarding.onboarded : false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (!mounted) return;
        const json = await res.json().catch(() => ({}));
        setOnboarding({ allowed: Boolean(json.allowed), onboarded: Boolean(json.onboarded) });
      } catch (e) {
        if (!mounted) return;
        setOnboarding({ allowed: false, onboarded: false });
      } finally {
        if (mounted) setOnboardingLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (creditCard) formData.append("creditCard", creditCard);
      if (cutoffDate) formData.append("cutoffDate", cutoffDate);

      const response = await fetch("/api/parse-transactions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse transactions");
      }

      const data = await response.json();
      setResult(data);
      setShowPreview(true);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to parse transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToSheet = async () => {
    if (!result?.transactions) return;
    if (saving) return; // already in progress

    setSaving(true);
    setSaveSuccess(null);
    setError(null);

    try {
      // Re-check onboarding briefly before attempting save
      try {
        const statusRes = await fetch("/api/onboarding/status");
        const statusJson = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok || statusJson.onboarded === false) {
          // Instead of navigating immediately (which previously caused 404s for some users),
          // show the new-user page via client navigation so user can follow the onboarding flow.
          router.push("/new-user");
          return;
        }
      } catch (e) {
        router.push("/new-user");
        return;
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: result.transactions }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save transactions");
      }

      const data = await response.json().catch(() => ({}));
      // Only clear the upload UI after success
      setFiles([]);
      setResult(null);
      setShowPreview(false);
      setSaveSuccess("Transactions saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transactions");
    } finally {
      setSaving(false);
    }
  };

  const handleAddManual = async () => {
    // manual entry removed - use standalone Add Expense page at /add
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>

        {/* Manual entry removed - use /add page for standalone Add Expense feature */}
      </DashboardLayout>
    );
  }

  if (!session?.user?.email) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Upload Bank Statement
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Statement or Transaction Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer block"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="h-8 sm:h-12 w-8 sm:w-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-sm sm:text-base text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      PNG, JPG, or PDF up to 10MB each
                    </p>
                  </div>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected files ({files.length}):
                  </p>
                  <ul className="space-y-2">
                    {files.map((file, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm"
                      >
                        <span className="text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles(files.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Credit Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Card (Optional)
              </label>
              <input
                type="text"
                value={creditCard}
                onChange={(e) => setCreditCard(e.target.value)}
                placeholder="e.g., Chase Sapphire, Amex Platinum"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Cutoff Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cutoff Date (Optional - Only include transactions from this date onwards)
              </label>
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition text-base sm:py-3"
            >
              {loading ? "Parsing..." : "Parse Transactions"}
            </button>
          </form>
        </div>

        {/* Preview Results */}
        {showPreview && result && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Preview & Edit Transactions
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Click any cell to edit. You can modify values, add new rows, or remove incorrect entries before saving.
              </p>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-4 rounded-md bg-yellow-50 p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">
                  Warnings:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <EditableTransactionsTable
              transactions={result.transactions}
              onTransactionsChange={(updatedTransactions) => {
                setResult({ ...result, transactions: updatedTransactions });
              }}
            />

            <div className="mt-6 flex gap-3 sm:gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <button
                    onClick={handleSaveToSheet}
                    disabled={isSaveDisabled}
                    className={`w-full ${isSaveDisabled ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white py-2 px-4 rounded-lg font-medium transition text-sm sm:text-base`}
                  >
                    {saving ? 'Saving...' : 'Save to Google Sheet'}
                  </button>
                  {!onboardingLoading && onboarding && !onboarding.onboarded && (
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You don't have a personal sheet yet. <a href="/new-user" className="underline font-medium">Create your sheet</a> to enable saving.</p>
                    </div>
                  )}
                </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setResult(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
          {/* Processing modal overlay */}
          {saving && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-700">Saving transactions... Please wait.</p>
              </div>
            </div>
          )}
          {saveSuccess && (
            <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
              {saveSuccess}
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
