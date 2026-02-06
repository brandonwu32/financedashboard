"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-6 sm:p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-14a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              This app is for authorized users only.
            </p>
          </div>

          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Your email is not on the authorized users list. Please contact the administrator if you need access.
            </p>
          </div>

          <button
            onClick={() => signOut({ redirectTo: "/login" })}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            Signed in with a different account?{" "}
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Try another email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
