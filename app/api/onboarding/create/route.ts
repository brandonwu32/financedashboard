import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getRegistryEntry, copyTemplateSpreadsheet, shareFileWithUser, addRegistryEntry, verifySpreadsheetStructure } from '@/app/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = allowedEmails.length === 0 ? true : allowedEmails.includes(email);
    if (!allowed) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    // If registry exists and verified, return existing
    const existing = await getRegistryEntry(email);
    if (existing && existing.sheetId) {
      // verify structure
      const v = await verifySpreadsheetStructure(existing.sheetId);
      if (v.ok) return NextResponse.json({ sheetId: existing.sheetId });
    }

    const templateId = process.env.TEMPLATE_SPREADSHEET_ID;
    const registryId = process.env.USER_REGISTRY_SPREADSHEET_ID;
    if (!templateId) return NextResponse.json({ error: 'TEMPLATE_SPREADSHEET_ID not configured' }, { status: 500 });
    if (!registryId) return NextResponse.json({ error: 'USER_REGISTRY_SPREADSHEET_ID not configured' }, { status: 500 });

    // Copy template
    const title = `${email} - Finance Dashboard`;
    const newId = await copyTemplateSpreadsheet(templateId, title);

    // Share with user
    await shareFileWithUser(newId, email);

    // Add to registry
    await addRegistryEntry(email, newId, 'created', 'created by onboarding');

    // Verify
    const v = await verifySpreadsheetStructure(newId);
    if (!v.ok) {
      return NextResponse.json({ error: 'Sheet created but verification failed', details: v }, { status: 500 });
    }

    // Update registry to verified (append additional row for now)
    await addRegistryEntry(email, newId, 'verified', 'auto-verified');

    return NextResponse.json({ sheetId: newId });
  } catch (err) {
    console.error('Onboarding create error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
