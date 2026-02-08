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

    // Check registry for user access and onboarding status
    let allowed = false;
    let onboarded = false;
    let verifyInfo: any = null;
    
    try {
      const { checkUserAccess, getRegistryEntry, verifySpreadsheetStructure } = await import('@/app/lib/google-sheets');
      
      const access = await checkUserAccess(email);
      allowed = access.hasAccess;
      
      if (allowed) {
        const entry = await getRegistryEntry(email);
        if (entry && entry.sheetId) {
          // Consider the user onboarded if a registry entry exists with a sheetId and status is Active
          onboarded = entry.status === 'Active';
          
          try {
            const v = await verifySpreadsheetStructure(entry.sheetId);
            verifyInfo = v;
          } catch (err) {
            verifyInfo = { ok: false, error: String(err) };
          }
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
