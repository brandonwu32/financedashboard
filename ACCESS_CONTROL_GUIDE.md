# Access Control System

## Overview

The application now uses a **registry-based access control system** instead of a hardcoded allowlist. This allows for dynamic user management and self-service access requests.

## How It Works

### User Statuses

Users in the registry can have the following statuses:

- **Inactive**: User is approved to access the app but hasn't completed onboarding yet
- **Active**: User has completed onboarding and has a sheet created
- **Not Found**: User is not in the registry

### Request Statuses

Access requests can have the following statuses:

- **Pending**: Request is waiting for admin approval
- **Approved**: Request has been approved (user is added to registry as Inactive)
- **Rejected**: Request has been denied

## Registry Spreadsheet Structure

Your registry spreadsheet (`USER_REGISTRY_SPREADSHEET_ID`) should have two tabs:

### 1. `registry` Tab (Main Registry)
Columns: `Email | SheetId | Status | CreatedAt | Access | Notes`

- **Email**: User's email address
- **SheetId**: The Google Sheet ID for their finance dashboard (empty until onboarded)
- **Status**: `Inactive` or `Active`
- **CreatedAt**: Timestamp when entry was created
- **Access**: `Admin` or `User` (determines if user can approve access requests)
- **Notes**: Additional information

### 2. `requests` Tab (Access Requests)
Columns: `Email | Status | RequestedAt | Notes`

- **Email**: User's email address
- **Status**: `Pending`, `Approved`, or `Rejected`
- **RequestedAt**: Timestamp when request was made
- **Notes**: User's reason for requesting access (auto-updated with approval info)

## User Flow

### 1. New User Requests Access
1. User signs in with Google OAuth
2. If not in registry, they see the "Access Required" page
3. User can submit an access request with optional notes
4. Request is logged in the `requests` tab with status `Pending`

### 2. Admin Approves Request
You have three options:

#### Option A: Admin Dashboard (Recommended)
1. Sign in as an admin user (user with Access="Admin" in registry)
2. Navigate to "Pending Requests" in the sidebar
3. Review the request details including user's reason
4. Click "Approve" to grant access or "Reject" to deny
5. System automatically:
   - Adds user to registry with Status="Inactive" and Access="User"
   - Updates request status to "Approved" or "Rejected"
   - Logs who approved/rejected and when in Notes

#### Option B: Manual Approval (via Spreadsheet)
1. Check the `requests` tab in your registry spreadsheet
2. Find pending requests
3. Manually add the user's email to the `registry` tab with:
   - Email: user@example.com
   - SheetId: (leave empty)
   - Status: `Inactive`
   - CreatedAt: (current timestamp)
   - Access: `User`
   - Notes: "manually approved"
4. Update the request status in `requests` tab to `Approved`

#### Option C: API Approval (Programmatic)
Use the admin API endpoint (requires admin authentication):

```bash
POST /api/admin/approve-access
Content-Type: application/json

{
  "email": "user@example.com",
  "approve": true
}
```

This automatically:
- Adds user to registry with `Inactive` status and `User` access
- Updates request status to `Approved`
- Logs admin email and timestamp in Notes

### 3. User Onboards
1. User returns to the app and is now allowed in
2. User goes through the onboarding flow
3. System creates their finance dashboard sheet
4. User's status is updated to `Active` in the registry

## Performance Optimization

The system uses an **in-memory cache** with a 5-minute TTL to avoid excessive Google Sheets API calls:

- Registry lookups are cached for 5 minutes
- Cache is automatically cleared when registry is updated
- This makes authorization checks fast without hitting API limits

## Environment Variables

You no longer need `ALLOWED_EMAILS`. Remove it from your `.env` file.

Required variables:
- `USER_REGISTRY_SPREADSHEET_ID`: Your registry spreadsheet ID
- Other existing variables (Google OAuth, service account, etc.)

## API Endpoints

### User Endpoints

#### Submit Access Request
```
POST /api/access-request
Body: { "notes": "optional reason" }
```

#### Check Access Status
```
GET /api/access-request
```

### Admin Endpoints (Require Admin Access)

#### Get Pending Requests
```
GET /api/admin/pending-requests
```
Returns list of all pending access requests. Only accessible to users with Access="Admin".

#### Approve/Reject Request
```
POST /api/admin/approve-access
Body: { 
  "email": "user@example.com",
  "approve": true  // or false to reject
}
```
Automatically handles the full approval workflow. Only accessible to users with Access="Admin".

## Admin Users

To grant admin access to a user:
1. Open the registry spreadsheet
2. Find the user's row in the `registry` tab
3. Set their `Access` column to `Admin`
4. Admin users will see a "Pending Requests" option in the sidebar
5. They can approve/reject requests directly from the UI

## Notifications

When a user submits an access request, you'll want to be notified. Consider:

1. **Google Sheets Notifications**: Set up notification rules in Google Sheets to email you when the `requests` tab is updated
2. **Future Enhancement**: Add email notifications via SendGrid, AWS SES, or similar
3. **Webhook**: Could add a webhook to notify external systems

## Migration from ALLOWED_EMAILS

If you're migrating from the old allowlist system:

1. Export your `ALLOWED_EMAILS` list
2. For each email, add a row to the `registry` tab:
   - Email: user@example.com
   - SheetId: (check if they have one from previous onboarding)
   - Status: `Inactive` (or `Active` if they have a sheet)
   - CreatedAt: current timestamp
   - Notes: "migrated from allowlist"
3. Remove `ALLOWED_EMAILS` from your `.env` file
4. Redeploy the application

## Troubleshooting

### User sees "Access Required" but is in registry
- Check cache: Cache might be stale (wait 5 minutes or restart server)
- Check status: User must have status `Active` or `Inactive`
- Check spelling: Email comparison is case-insensitive but must match exactly

### Request not appearing in spreadsheet
- Verify `USER_REGISTRY_SPREADSHEET_ID` is set correctly
- Check that `requests` tab exists with correct column headers
- Check service account has write access to the spreadsheet

### Slow performance
- Cache is working: Should only hit Sheets API once per 5 minutes per user
- Check API quotas: Google Sheets API has rate limits
- Consider increasing cache TTL if needed (edit `registryCache.ttl` in google-sheets.ts)

## Security Considerations

1. **Admin Protection**: Add proper admin role checking to the approve-access endpoint
2. **Rate Limiting**: Consider adding rate limits to prevent spam requests
3. **Audit Trail**: All changes are logged in the spreadsheet with timestamps
4. **Access Control**: Only authenticated users can request access (OAuth required)
