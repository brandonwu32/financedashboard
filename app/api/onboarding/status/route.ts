import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ allowed: false, onboarded: false, reason: 'unauthenticated' }, { status: 200 });
    }

    const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

    // If ALLOWED_EMAILS is empty, default to allowing anyone (dev convenience).
    const allowed = allowedEmails.length === 0 ? true : allowedEmails.includes(email);

    // Check registry for existing sheet mapping. Treat the presence of a registry
    // entry with a sheetId as the primary signal that the user is onboarded so we
    // don't redirect already-registered users to the onboarding flow if a
    // transient verification (Sheets API) check fails due to service-account
    // permissions. Still include verification details for debugging.
    let onboarded = false;
    let verifyInfo: any = null;
    try {
      const { getRegistryEntry, verifySpreadsheetStructure } = await import('@/app/lib/google-sheets');
      const entry = await getRegistryEntry(email);
      if (entry && entry.sheetId) {
        // Consider the user onboarded if a registry entry exists. Attempt to
        // verify the spreadsheet structure and include the result, but do not
        // use a failed verification to force the UI into onboarding.
        onboarded = true;
        try {
          const v = await verifySpreadsheetStructure(entry.sheetId);
          verifyInfo = v;
        } catch (err) {
          verifyInfo = { ok: false, error: String(err) };
        }
      }
    } catch (err) {
      console.warn('Registry check failed:', err);
    }

    return NextResponse.json({ allowed, onboarded, verify: verifyInfo });
  } catch (err) {
    return NextResponse.json({ allowed: false, onboarded: false, error: String(err) }, { status: 500 });
  }
}
