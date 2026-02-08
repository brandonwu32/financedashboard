import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getRegistryEntry, verifySpreadsheetStructure, addRegistryEntry, updateRegistrySheetId, checkUserAccess } from '@/app/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user has access via registry
    const access = await checkUserAccess(email);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Not allowed - request access first' }, { status: 403 });
    }

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

    // Check if user already has an entry
    const existing = await getRegistryEntry(email);
    if (existing) {
      // Update existing entry to Active status with the sheetId
      await updateRegistrySheetId(email, sheetId, 'Active', undefined, 'manual registration completed');
    } else {
      // Persist the registry entry so the app can find this sheet for the user.
      await addRegistryEntry(email, sheetId, 'Active', 'User', 'manual registration completed');
    }

    return NextResponse.json({ ok: true, sheetId });
  } catch (err) {
    console.error('Onboarding register error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
