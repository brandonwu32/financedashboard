"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Check if user already has a pending request
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/access-request');
        if (response.ok) {
          const data = await response.json();
          if (data.requestStatus) {
            setRequestStatus(data.requestStatus);
          }
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (session?.user?.email) {
      checkStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [session]);

  const handleRequestAccess = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestStatus('Pending');
        setMessage(data.message || 'Access request submitted successfully!');
      } else {
        setMessage(data.error || 'Failed to submit access request');
      }
    } catch (error) {
      setMessage('An error occurred while submitting your request');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Access Required</h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              You need permission to access this application
            </p>
          </div>

          {checkingStatus ? (
            <div className="mb-6 rounded-md bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-700">Checking access status...</p>
            </div>
          ) : requestStatus === 'Pending' ? (
            <div className="mb-6 rounded-md bg-yellow-50 p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Request Pending</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your access request is being reviewed. You'll be notified when it's approved.
                  </p>
                </div>
              </div>
            </div>
          ) : requestStatus === 'Rejected' ? (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Your access request was not approved. Please contact the administrator for more information.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  You can request access to this application. The administrator will be notified and can approve your request.
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you need access? (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., I'm part of the finance team..."
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleRequestAccess}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Submitting...' : 'Request Access'}
              </button>

              {message && (
                <div className={`mb-4 rounded-md p-3 text-sm ${
                  message.includes('success') || message.includes('submitted')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </>
          )}

          <button
            onClick={() => signOut({ redirectTo: "/login" })}
            className="w-full rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            Signed in with a different account?{" "}
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try another email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
