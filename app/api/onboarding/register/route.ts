import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getRegistryEntry, verifySpreadsheetStructure, addRegistryEntry } from '@/app/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = allowedEmails.length === 0 ? true : allowedEmails.includes(email);
    if (!allowed) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    const body = await request.json();
    const sheetId = (body?.sheetId || '').toString().trim();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    // Verify the sheet structure using the service account. The user must
    // have shared the copied sheet with the service account email for this
    // verification to succeed.
    const v = await verifySpreadsheetStructure(sheetId);
    if (!v.ok) {
      return NextResponse.json({ error: 'Spreadsheet verification failed', details: v }, { status: 400 });
    }

    // Persist the registry entry so the app can find this sheet for the user.
    await addRegistryEntry(email, sheetId, 'registered', 'manual registration');

    return NextResponse.json({ ok: true, sheetId });
  } catch (err) {
    console.error('Onboarding register error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
