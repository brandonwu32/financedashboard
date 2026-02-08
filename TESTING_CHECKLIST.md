# Testing Checklist - Access Control System

## Pre-Testing Setup

### 1. Registry Spreadsheet Setup
- [ ] Created "registry" tab with headers: `Email | SheetId | Status | CreatedAt | Notes`
- [ ] Created "requests" tab with headers: `Email | Status | RequestedAt | Notes`
- [ ] Service account has Editor access to the spreadsheet
- [ ] Confirmed `USER_REGISTRY_SPREADSHEET_ID` is set in .env.local

### 2. Environment Variables
- [ ] Removed `ALLOWED_EMAILS` from .env.local
- [ ] `USER_REGISTRY_SPREADSHEET_ID` is configured
- [ ] `TEMPLATE_SPREADSHEET_ID` is configured
- [ ] All other Google OAuth and API credentials are configured

### 3. Application Start
- [ ] Run `npm install` (if new dependencies were added)
- [ ] Run `npm run dev` to start development server
- [ ] No TypeScript compilation errors
- [ ] Server starts successfully on http://localhost:3000

---

## Test Suite 1: Access Request Flow

### Test 1.1: Unauthorized User - View Access Request Page
**Steps:**
1. Clear any existing session/cookies
2. Navigate to http://localhost:3000
3. Sign in with a Google account NOT in the registry

**Expected Results:**
- [ ] User is authenticated successfully
- [ ] User is redirected to /unauthorized
- [ ] Page shows "Access Required" heading
- [ ] Access request form is displayed
- [ ] No error messages in console

### Test 1.2: Submit Access Request
**Steps:**
1. From the unauthorized page (as unapproved user)
2. Enter optional notes: "Testing access request"
3. Click "Request Access" button

**Expected Results:**
- [ ] Button shows "Submitting..." during request
- [ ] Success message appears: "Access request submitted successfully..."
- [ ] Request status changes to "Request Pending" with yellow badge
- [ ] Form is replaced with pending message
- [ ] New row appears in the "requests" tab with:
  - Email matching the logged-in user
  - Status: "Pending"
  - RequestedAt: current timestamp
  - Notes: "Testing access request"

### Test 1.3: Duplicate Request Prevention
**Steps:**
1. As the same user from Test 1.2
2. Refresh the page or try to request access again

**Expected Results:**
- [ ] Page shows "Request Pending" status immediately
- [ ] Request form is not displayed
- [ ] No duplicate entries in "requests" tab
- [ ] Message indicates request is being reviewed

---

## Test Suite 2: Admin Approval Process

### Test 2.1: Manual Approval (Spreadsheet Method)
**Steps:**
1. Open the registry spreadsheet
2. Go to the "registry" tab
3. Add a new row:
   - Email: (the test user's email)
   - SheetId: (leave empty)
   - Status: "Inactive"
   - CreatedAt: current timestamp
   - Notes: "manually approved for testing"
4. Go to "requests" tab
5. Update the user's request status from "Pending" to "Approved"

**Expected Results:**
- [ ] Row added successfully to registry
- [ ] Request status updated successfully

### Test 2.2: User Gains Access After Approval
**Steps:**
1. As the approved user, wait 5-10 seconds (cache refresh)
2. Refresh the browser or navigate to http://localhost:3000

**Expected Results:**
- [ ] User is no longer redirected to /unauthorized
- [ ] User sees either dashboard or onboarding page (depending on onboarding status)
- [ ] No "Access Required" message

### Test 2.3: API Approval Method (Optional)
**Prerequisites:** Have another user request access

**Steps:**
1. Use curl or the script:
   ```bash
   curl -X POST http://localhost:3000/api/admin/approve-access \
     -H "Content-Type: application/json" \
     -d '{"email":"another-user@example.com","approve":true}'
   ```
   Or:
   ```bash
   node scripts/approve-request.js another-user@example.com
   ```

**Expected Results:**
- [ ] API returns success message
- [ ] User is added to registry with Status "Inactive"
- [ ] Request status in "requests" tab updates to "Approved"

---

## Test Suite 3: Onboarding Flow

### Test 3.1: Inactive User Can Access Onboarding
**Steps:**
1. Sign in as a user with Status "Inactive" in registry (no SheetId)
2. Navigate to the dashboard or onboarding page

**Expected Results:**
- [ ] User is not blocked by middleware
- [ ] User sees onboarding flow (if they haven't onboarded)
- [ ] No errors in console

### Test 3.2: Complete Onboarding
**Steps:**
1. As an Inactive user, complete the onboarding process
2. Click "Create My Sheet" or similar button

**Expected Results:**
- [ ] New spreadsheet is created from template
- [ ] Spreadsheet is shared with user's email
- [ ] User's entry in "registry" tab is updated:
  - SheetId: (populated with new sheet ID)
  - Status: "Active"
  - Notes: includes "onboarded and sheet created"
- [ ] User can access the dashboard
- [ ] Dashboard loads their transactions/budgets

### Test 3.3: Active User Can Access Dashboard
**Steps:**
1. Sign in as a user with Status "Active" and a valid SheetId
2. Navigate to http://localhost:3000

**Expected Results:**
- [ ] User goes directly to dashboard
- [ ] No onboarding prompts
- [ ] Data loads from their sheet
- [ ] All dashboard features work

---

## Test Suite 4: Caching Behavior

### Test 4.1: Cache Works (No Excessive API Calls)
**Setup:** Enable network logging or check server logs

**Steps:**
1. Sign in as an approved user
2. Navigate between pages multiple times within 5 minutes
3. Check logs for Google Sheets API calls

**Expected Results:**
- [ ] First request makes API call to registry
- [ ] Subsequent requests (within 5 min) do NOT make API calls
- [ ] Authorization is near-instant on cached requests

### Test 4.2: Cache Invalidation on Update
**Steps:**
1. Have a user cached (visited within last 5 minutes)
2. Manually change their Status in the registry spreadsheet
3. User refreshes immediately (within cache TTL)

**Expected Results:**
- [ ] User still sees old status (cached)
- [ ] After 5 minutes OR server restart, new status takes effect

### Test 4.3: Cache Clears on Registry Writes
**Steps:**
1. User is cached
2. Use API to approve their access (modifies registry)
3. User immediately tries to access again

**Expected Results:**
- [ ] Cache for that user is cleared
- [ ] Fresh data is fetched from registry
- [ ] New status takes effect immediately

---

## Test Suite 5: Edge Cases & Error Handling

### Test 5.1: Non-Existent User
**Steps:**
1. Sign in with email not in registry and no pending request
2. Navigate around the app

**Expected Results:**
- [ ] User sees "Access Required" page
- [ ] Can submit access request
- [ ] No crashes or 500 errors

### Test 5.2: Invalid Status in Registry
**Steps:**
1. Manually set a user's Status to something invalid (e.g., "Test")
2. That user tries to access the app

**Expected Results:**
- [ ] User is treated as not having access
- [ ] Redirected to /unauthorized
- [ ] No application crashes

### Test 5.3: Missing SheetId for Active User
**Steps:**
1. Set user Status to "Active" but leave SheetId empty
2. User tries to access dashboard

**Expected Results:**
- [ ] User can access onboarding/creation flow
- [ ] System handles missing SheetId gracefully
- [ ] No crashes

### Test 5.4: Registry Spreadsheet Unavailable
**Steps:**
1. Temporarily change `USER_REGISTRY_SPREADSHEET_ID` to invalid value
2. Try to access the app

**Expected Results:**
- [ ] User sees error page or "Access Required"
- [ ] Error is logged in server console
- [ ] Application doesn't crash
- [ ] Fixing env var and restarting recovers

### Test 5.5: Multiple Rapid Requests
**Steps:**
1. Submit access request
2. Immediately refresh and try to submit again (spam the button)

**Expected Results:**
- [ ] Only one request is logged in spreadsheet
- [ ] Duplicate detection works
- [ ] No errors or crashes

---

## Test Suite 6: Access Control Endpoints

### Test 6.1: GET /api/access-request (Unauthenticated)
**Steps:**
```bash
curl http://localhost:3000/api/access-request
```

**Expected Results:**
- [ ] Returns 401 Unauthorized
- [ ] Error message indicates no authentication

### Test 6.2: GET /api/access-request (Authenticated, No Request)
**Steps:**
1. Sign in as user with no pending request
2. Call endpoint via browser or authenticated curl

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Response: `{ hasAccess: false, requestStatus: null }`

### Test 6.3: GET /api/access-request (Authenticated, Pending Request)
**Steps:**
1. Sign in as user with pending request
2. Call endpoint

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Response includes: `{ hasAccess: false, requestStatus: "Pending", requestedAt: "..." }`

### Test 6.4: GET /api/access-request (Authenticated, Has Access)
**Steps:**
1. Sign in as approved user (Status Inactive or Active)
2. Call endpoint

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Response: `{ hasAccess: true, status: "...", isOnboarded: true/false }`

---

## Test Suite 7: Backward Compatibility

### Test 7.1: Existing Onboarded Users
**Setup:** Have users who were previously onboarded under ALLOWED_EMAILS system

**Steps:**
1. Manually migrate them to registry with Status "Active" and their SheetId
2. They sign in to the new system

**Expected Results:**
- [ ] They can access dashboard immediately
- [ ] Their existing data loads correctly
- [ ] No re-onboarding required
- [ ] All features work as before

### Test 7.2: No ALLOWED_EMAILS Fallback
**Steps:**
1. Confirm `ALLOWED_EMAILS` is NOT in .env.local
2. Restart server
3. Access the app

**Expected Results:**
- [ ] App works without ALLOWED_EMAILS
- [ ] No errors about missing ALLOWED_EMAILS
- [ ] Registry system is used exclusively

---

## Test Suite 8: UI/UX Testing

### Test 8.1: Unauthorized Page UI
**Steps:**
1. View /unauthorized as unauthenticated user

**Expected Results:**
- [ ] Page is styled correctly
- [ ] All elements are readable
- [ ] Form is accessible
- [ ] Mobile responsive

### Test 8.2: Loading States
**Steps:**
1. Submit access request
2. Observe UI during submission

**Expected Results:**
- [ ] Button shows loading state
- [ ] Form is disabled during submission
- [ ] Success/error message appears after completion
- [ ] No UI flicker or layout shift

### Test 8.3: Error Messages
**Steps:**
1. Simulate API error (e.g., invalid spreadsheet ID)
2. Try to request access

**Expected Results:**
- [ ] User-friendly error message displayed
- [ ] Technical details not exposed to user
- [ ] User can retry
- [ ] Error is logged in console for debugging

---

## Performance Testing

### Test P.1: Cold Start Authorization
**Steps:**
1. Restart server (clear cache)
2. Time how long first authorization check takes

**Expected Results:**
- [ ] Authorization completes in < 2 seconds
- [ ] Subsequent checks are near-instant (< 50ms)

### Test P.2: Many Users
**Setup:** Add 50+ users to registry

**Steps:**
1. Access app as different users
2. Monitor response times

**Expected Results:**
- [ ] Authorization time doesn't significantly increase
- [ ] Cache works for all users
- [ ] No memory issues

---

## Security Testing

### Test S.1: Unauthorized API Access
**Steps:**
1. Try to call admin endpoints without authentication
2. Try to access dashboard routes without being in registry

**Expected Results:**
- [ ] All protected routes require authentication
- [ ] Unauthorized users are blocked
- [ ] No sensitive data leaked in error messages

### Test S.2: SQL Injection / NoSQL Injection
**Steps:**
1. Try to submit access request with malicious email:
   - `'; DROP TABLE--@example.com`
   - `<script>alert('xss')</script>@example.com`

**Expected Results:**
- [ ] Input is sanitized
- [ ] No code execution
- [ ] Request is stored safely or rejected

---

## Final Checklist

### Pre-Production
- [ ] All tests above pass
- [ ] No console errors in any flow
- [ ] Documentation reviewed and accurate
- [ ] Environment variables configured correctly
- [ ] Notification system set up (Google Sheets alerts or script)

### Production Deployment
- [ ] Code deployed to production
- [ ] Environment variables updated on hosting platform
- [ ] ALLOWED_EMAILS removed from production env
- [ ] Production registry spreadsheet configured
- [ ] Test access request in production
- [ ] Monitor logs for errors
- [ ] Verify caching works in production

### Post-Deployment
- [ ] Existing users can still access (if migrated)
- [ ] New users can request access
- [ ] Admin can approve requests
- [ ] Performance is acceptable (< 2s page loads)
- [ ] No increase in error rates

---

## Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**All Tests Passed:** ☐ Yes ☐ No  
**Notes/Issues:** _________________  

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Access Required" for approved user | Wait 5 min for cache, or restart server |
| Request not appearing in sheet | Check service account permissions |
| Error: "USER_REGISTRY_SPREADSHEET_ID not configured" | Add to .env.local |
| Slow authorization | Check cache is working, increase TTL if needed |
| Can't approve requests | Verify admin endpoint auth (currently open) |
