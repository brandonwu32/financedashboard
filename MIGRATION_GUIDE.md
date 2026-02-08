# Migration Script: Setting Up Registry Spreadsheet

This guide will help you set up your registry spreadsheet with the correct structure.

## Prerequisites

- You have a Google Spreadsheet designated as your USER_REGISTRY_SPREADSHEET_ID
- The service account has editor access to this spreadsheet

## Step 1: Create the `registry` Tab

1. Open your registry spreadsheet
2. Create or rename a tab to exactly: `registry` (lowercase)
3. In row 1, add these column headers:

```
Email | SheetId | Status | CreatedAt | Access | Notes
```

**Important**: The `Access` column should contain either `Admin` or `User`. Users with `Admin` access can approve access requests through the UI.

## Step 2: Create the `requests` Tab

1. In the same spreadsheet, create a new tab named exactly: `requests` (lowercase)
2. In row 1, add these column headers:

```
Email | Status | RequestedAt | Notes
```

## Step 3: Migrate Existing Users (Optional)

If you have existing users from the old ALLOWED_EMAILS system:

### Automatic Migration Script

Create a file called `migrate-users.js` in your project root:

\`\`\`javascript
const { google } = require('googleapis');

// Load your existing ALLOWED_EMAILS
const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || [];

async function migrateUsers() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });
  const registryId = process.env.USER_REGISTRY_SPREADSHEET_ID;

  const now = new Date().toISOString();
  const rows = allowedEmails.map(email => [
    email,
    '', // SheetId - empty for now
    'Inactive', // Status - they need to onboard
    now,
    'User', // Access - default to User, change to Admin for admins
    'migrated from ALLOWED_EMAILS'
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: registryId,
    range: 'registry!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: rows,
    },
  });

  console.log(\`Migrated \${rows.length} users to registry\`);
}

migrateUsers().catch(console.error);
\`\`\`

Run it with:
\`\`\`bash
node migrate-users.js
\`\`\`

### Manual Migration

Or manually add each user to the `registry` tab:

| Email | SheetId | Status | CreatedAt | Access | Notes |
|-------|---------|--------|-----------|--------|-------|
| user@example.com | | Inactive | 2026-02-07T00:00:00Z | User | migrated from allowlist |

Leave SheetId empty - it will be filled when they onboard.

**Set up at least one admin:**
For your own account or a trusted user, set Access to "Admin" so they can approve future access requests through the UI.

## Step 4: Update Environment Variables

In your `.env.local` file:

1. Remove the line:
   \`\`\`
   ALLOWED_EMAILS=...
   \`\`\`

2. Ensure you have:
   \`\`\`
   USER_REGISTRY_SPREADSHEET_ID=your_spreadsheet_id_here
   \`\`\`

## Step 5: Set Up Notifications (Recommended)

To get notified when users request access:

### Option 1: Google Sheets Notification Rules

1. In your registry spreadsheet, click **Tools** > **Notification rules**
2. Select **Any changes are made** to the `requests` tab
3. Choose to notify you immediately via email

### Option 2: Google Apps Script (Advanced)

Add this script to your spreadsheet (Tools > Script editor):

\`\`\`javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  
  // Only trigger on the requests tab
  if (sheet.getName() !== 'requests') return;
  
  const range = e.range;
  const row = range.getRow();
  
  // Only trigger for new rows (not header)
  if (row <= 1) return;
  
  const values = sheet.getRange(row, 1, 1, 4).getValues()[0];
  const [email, status, requestedAt, notes] = values;
  
  // Only send notification for new Pending requests
  if (status === 'Pending') {
    const subject = 'New Access Request - Finance Dashboard';
    const body = \`
      New access request received:
      
      Email: \${email}
      Requested: \${requestedAt}
      Reason: \${notes || 'No reason provided'}
      
      Approve this request by:
      1. Adding the user to the registry tab with Status "Inactive"
      2. Updating the request status to "Approved"
      
      Or use the API:
      POST /api/admin/approve-access
      { "email": "\${email}", "approve": true }
    \`;
    
    MailApp.sendEmail({
      to: 'your-admin-email@example.com',
      subject: subject,
      body: body
    });
  }
}
\`\`\`

Don't forget to replace 'your-admin-email@example.com' with your actual email.

## Step 6: Test the System

1. **Test unauthorized access:**
   - Sign in with an email NOT in the registry
   - You should see the "Access Required" page
   - Submit an access request
   - Check that it appears in the `requests` tab

2. **Test approval:**
   - Manually add a user to the `registry` tab with Status "Inactive"
   - Have them sign in again
   - They should be able to access the onboarding flow

3. **Test onboarding:**
   - Complete the onboarding process
   - Check that the user's Status updates to "Active"
   - Check that their SheetId is filled in

## Step 7: Deploy

After testing locally:

1. Push changes to your repository
2. Deploy to your hosting platform (Vercel, etc.)
3. Update environment variables on the hosting platform
4. Remove ALLOWED_EMAILS from production environment
5. Test again in production

## Troubleshooting

### "Access Required" for users in registry
- Wait 5 minutes for cache to expire, or restart the server
- Check that Status is "Inactive" or "Active" (case-sensitive)
- Verify email matches exactly (case-insensitive comparison)

### Requests not appearing
- Check service account has write access to the spreadsheet
- Verify USER_REGISTRY_SPREADSHEET_ID is correct
- Check tab name is exactly "requests" (lowercase)
- Verify column headers match exactly

### Permission errors
- Make sure the service account email has Editor access to the registry spreadsheet
- Check GOOGLE_PRIVATE_KEY is formatted correctly (newlines preserved)

## Security Best Practices

1. **Protect the admin endpoint:** Add authentication to `/api/admin/approve-access`
2. **Audit regularly:** Review the registry and requests tabs periodically
3. **Backup:** Keep backups of your registry spreadsheet
4. **Rate limiting:** Consider adding rate limits to prevent spam requests
5. **Logging:** Monitor application logs for suspicious activity
