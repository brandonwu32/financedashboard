import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { addRegistryEntry, checkUserAccess } from '@/app/lib/google-sheets';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Helper to get sheets client
function getGoogleSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is not set");
  }
  
  privateKey = privateKey.replace(/^["']|["']$/g, "");
  const formattedKey = privateKey.includes("\\n") 
    ? privateKey.replace(/\\n/g, "\n") 
    : privateKey;

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth: auth as unknown as any });
}

// POST /api/admin/approve-access - Approve or reject an access request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    const access = await checkUserAccess(email);
    if (!access.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const requestEmail = body.email;
    const approve = body.approve !== false; // default to approve
    const accessLevel = body.access || 'User'; // 'User' or 'Admin', default to 'User'

    if (!requestEmail) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (!['User', 'Admin'].includes(accessLevel)) {
      return NextResponse.json({ error: 'access must be either "User" or "Admin"' }, { status: 400 });
    }

    const registryId = process.env.USER_REGISTRY_SPREADSHEET_ID;
    if (!registryId) {
      return NextResponse.json({ error: 'USER_REGISTRY_SPREADSHEET_ID not configured' }, { status: 500 });
    }

    const sheets = getGoogleSheetsClient();
    const adminEmail = email; // The admin who is approving

    if (approve) {
      // Add user to registry with 'Inactive' status (approved but not onboarded)
      await addRegistryEntry(requestEmail, '', 'Inactive', accessLevel, `approved by ${adminEmail}`);

      // Update request status to 'Approved' with admin notes
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: registryId,
        range: "requests!A2:D",
      } as any);

      const rows = response.data.values || [];
      for (let i = 0; i < rows.length; i++) {
        const rowEmail = (rows[i][0] || '').toString().trim();
        if (rowEmail.toLowerCase() === requestEmail.toLowerCase()) {
          const rowNumber = i + 2;
          
          // Update status and notes
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: registryId,
            requestBody: {
              valueInputOption: 'RAW',
              data: [
                {
                  range: `requests!B${rowNumber}`,
                  values: [['Approved']],
                },
                {
                  range: `requests!D${rowNumber}`,
                  values: [[`Approved by ${adminEmail} on ${new Date().toISOString()}`]],
                }
              ],
            },
          } as any);
          break;
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Access approved for ${requestEmail}. They can now onboard.` 
      });
    } else {
      // Reject the request
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: registryId,
        range: "requests!A2:D",
      } as any);

      const rows = response.data.values || [];
      for (let i = 0; i < rows.length; i++) {
        const rowEmail = (rows[i][0] || '').toString().trim();
        if (rowEmail.toLowerCase() === requestEmail.toLowerCase()) {
          const rowNumber = i + 2;
          
          // Update status and notes
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: registryId,
            requestBody: {
              valueInputOption: 'RAW',
              data: [
                {
                  range: `requests!B${rowNumber}`,
                  values: [['Rejected']],
                },
                {
                  range: `requests!D${rowNumber}`,
                  values: [[`Rejected by ${adminEmail} on ${new Date().toISOString()}`]],
                }
              ],
            },
          } as any);
          break;
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Access rejected for ${requestEmail}` 
      });
    }
  } catch (error) {
    console.error('Error approving access request:', error);
    return NextResponse.json({ 
      error: 'Failed to process access request',
      details: String(error)
    }, { status: 500 });
  }
}
