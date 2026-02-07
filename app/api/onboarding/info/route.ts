import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templateId = process.env.TEMPLATE_SPREADSHEET_ID;
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    if (!templateId) return NextResponse.json({ error: 'TEMPLATE_SPREADSHEET_ID not configured' }, { status: 500 });

    const templateUrl = `https://docs.google.com/spreadsheets/d/${templateId}`;
    return NextResponse.json({ templateUrl, serviceAccountEmail: serviceEmail || null });
  } catch (err) {
    console.error('Onboarding info error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
