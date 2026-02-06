"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-2 sm:px-2 lg:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-gray-900 ml-0 md:mt-1">
              FinanceTracker
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-600 max-w-xs truncate">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ redirect: true, redirectTo: "/login" })}
              className="bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-red-700 transition text-xs sm:text-sm whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-0 md:gap-4">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } md:block w-full md:w-64 bg-white shadow md:sticky md:top-16 md:h-[calc(100vh-4rem)] z-30 transition-all`}
        >
          <nav className="space-y-1 p-3 sm:p-4">
            <Link
              href="/dashboard"
              className="block px-3 sm:px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition text-sm sm:text-base"
              onClick={() => setSidebarOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="block px-3 sm:px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition text-sm sm:text-base"
              onClick={() => setSidebarOpen(false)}
            >
              Upload Statements
            </Link>
            <Link
              href="/add"
              className="block px-3 sm:px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition text-sm sm:text-base"
              onClick={() => setSidebarOpen(false)}
            >
              Add Expense
            </Link>
            <Link
              href="/settings"
              className="block px-3 sm:px-4 py-2 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition text-sm sm:text-base"
              onClick={() => setSidebarOpen(false)}
            >
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-4 sm:py-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
