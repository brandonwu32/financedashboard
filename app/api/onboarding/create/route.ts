import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getRegistryEntry, copyTemplateSpreadsheet, shareFileWithUser, addRegistryEntry, verifySpreadsheetStructure, updateRegistrySheetId, checkUserAccess } from '@/app/lib/google-sheets';

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

    // If registry exists with Active status and verified, return existing
    const existing = await getRegistryEntry(email);
    if (existing && existing.sheetId && existing.status === 'Active') {
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

    // If user already has an entry, update it with the new sheetId; otherwise add new entry
    if (existing) {
      await updateRegistrySheetId(email, newId, 'Active', undefined, 'onboarded and sheet created');
    } else {
      await addRegistryEntry(email, newId, 'Active', 'User', 'onboarded and sheet created');
    }

    // Verify
    const v = await verifySpreadsheetStructure(newId);
    if (!v.ok) {
      return NextResponse.json({ error: 'Sheet created but verification failed', details: v }, { status: 500 });
    }

    return NextResponse.json({ sheetId: newId });
  } catch (err) {
    console.error('Onboarding create error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
