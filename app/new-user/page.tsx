"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/ui/dashboard/layout";

export default function NewUserPage() {
  const [status, setStatus] = useState<null | { allowed: boolean; onboarded: boolean; }>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [info, setInfo] = useState<null | { templateUrl: string; serviceAccountEmail: string | null }>(null);
  const [sheetIdInput, setSheetIdInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/status');
        if (!mounted) return;
        const json = await res.json();
        setStatus({ allowed: json.allowed, onboarded: json.onboarded });
      } catch (e) {
        setStatus({ allowed: false, onboarded: false });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/info');
        if (!mounted) return;
        const json = await res.json();
        if (!mounted) return;
        setInfo({ templateUrl: json.templateUrl, serviceAccountEmail: json.serviceAccountEmail });
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h1 className="text-lg sm:text-xl font-bold mb-4">New User Setup</h1>
            <p>Checking onboarding availability...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!status?.allowed) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h1 className="text-lg sm:text-xl font-bold mb-4">Onboarding Not Available</h1>
            <p className="text-sm text-gray-600">Your account is not currently allowed to create a sheet. If you believe this is an error, contact the administrator.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (status.onboarded) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h1 className="text-lg sm:text-xl font-bold mb-4">You're already onboarded</h1>
            <p className="text-sm text-gray-600">Your sheet has already been created and validated. You can access your dashboard now.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h1 className="text-lg sm:text-xl font-bold mb-4">New User Setup</h1>
          <p className="text-sm text-gray-600">
            Follow the manual flow below to create a copy of the template in your own Google Drive, 
            share it with the service account, 
            then paste the copied sheet ID here to register it with this app.
            The Sheet ID is the gibberish in the URL between /d/ and /edit, 
          </p>
          <br></br>
          <p className="text-sm text-gray-600">
            For example: the Sheet ID is bold in<br></br>https://docs.google.com/spreadsheets/d/<b>1aBcD_EfgHiJkLmNoPqRsTuVwXyZ1234567890</b>/edit.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <a
                className="text-sm text-blue-600 underline"
                href={info?.templateUrl || '#'}
                target="_blank"
                rel="noreferrer"
              >
                Open the template (opens in a new tab)
              </a>
            </div>

            <div className="text-xs text-gray-600">
              1) In the template, choose <strong>File → Make a copy</strong> and save it to your Drive.
            </div>
            <div className="text-xs text-gray-600">
              2) Share the copied sheet with the service account email so this app can verify it:
              <div className="mt-1 font-mono text-sm">{info?.serviceAccountEmail || 'SERVICE_ACCOUNT_EMAIL_NOT_CONFIGURED'}</div>
            </div>
            <div className="text-xs text-gray-600">
              3) Back here, paste the copied sheet's ID (the long id from the URL) and click <strong>Register Sheet</strong>.
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Sheet ID</label>
              <input
                value={sheetIdInput}
                onChange={(e) => setSheetIdInput(e.target.value)}
                className="mt-1 block w-full rounded border-gray-200 shadow-sm sm:text-sm"
                placeholder="1aBcD... (sheet id from the URL)"
              />
            </div>

            <div>
              <button
                onClick={async () => {
                  setCreateError(null);
                  try {
                    setCreating(true);
                    const res = await fetch('/api/onboarding/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sheetId: sheetIdInput.trim() }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      // Prefer structured verification details when available
                      const details = json?.details;
                      if (details?.message) {
                        setCreateError(details.message);
                      } else if (details?.raw) {
                        setCreateError(details.raw);
                      } else {
                        setCreateError(json?.error || 'Failed to register sheet');
                      }
                      setCreating(false);
                      return;
                    }
                    // success - redirect to dashboard
                    router.push('/dashboard');
                  } catch (err) {
                    setCreateError(String(err));
                    setCreating(false);
                  }
                }}
                disabled={creating || !sheetIdInput}
                className={`inline-flex items-center rounded px-3 py-2 text-sm font-medium text-white ${creating || !sheetIdInput ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'}`}
              >
                {creating ? 'Registering…' : 'Register Sheet'}
              </button>
              {createError && <p className="mt-2 text-xs text-red-600">{createError}</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
