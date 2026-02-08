"use client";

import { useEffect, useState } from "react";

interface AccessRequest {
  email: string;
  status: string;
  requestedAt: string;
  notes: string;
}

export default function PendingRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<{ [email: string]: 'User' | 'Admin' }>({});

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/pending-requests');
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
        setError("");
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (email: string, approve: boolean) => {
    setProcessing(email);
    try {
      const response = await fetch('/api/admin/approve-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          approve,
          access: accessLevel[email] || 'User'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the list
        await fetchRequests();
        // Clear the access level for this email
        setAccessLevel(prev => {
          const updated = { ...prev };
          delete updated[email];
          return updated;
        });
        // Show success message (could use toast here)
        alert(data.message);
      } else {
        alert(data.error || 'Failed to process request');
      }
    } catch (err) {
      alert('An error occurred while processing the request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading pending requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Access Requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve or reject access requests from users.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              All access requests have been processed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.email}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {request.email}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </p>
                  {request.notes && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Reason:</span> {request.notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <select
                    value={accessLevel[request.email] || 'User'}
                    onChange={(e) => setAccessLevel(prev => ({
                      ...prev,
                      [request.email]: e.target.value as 'User' | 'Admin'
                    }))}
                    disabled={processing === request.email}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="User">Grant User Access</option>
                    <option value="Admin">Grant Admin Access</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.email, true)}
                      disabled={processing === request.email}
                      className="flex-1 inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.email ? (
                        <>
                          <svg
                            className="animate-spin -ml-0.5 mr-1.5 h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="-ml-0.5 mr-1.5 h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(request.email, false)}
                      disabled={processing === request.email}
                      className="flex-1 inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="-ml-0.5 mr-1.5 h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={fetchRequests}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="-ml-0.5 mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}
