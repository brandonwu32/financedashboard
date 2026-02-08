# Access Control Quick Reference

## 🚀 Quick Actions

### Approve a New User (Admin UI - Recommended)
1. Sign in as an admin user
2. Click "Pending Requests" in the sidebar
3. Review the request and click "Approve"
4. Done! User is automatically added to registry and notified

### Approve a New User (Manual)
1. Open registry spreadsheet
2. Add to **registry** tab:
   ```
   Email: user@example.com
   SheetId: (empty)
   Status: Inactive
   CreatedAt: 2026-02-07T12:00:00Z
   Access: User
   Notes: approved
   ```
3. Update **requests** tab status to "Approved"

### Approve a New User (API)
```bash
curl -X POST http://localhost:3000/api/admin/approve-access \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","approve":true}'
```

### Remove User Access
In **registry** tab, change Status from "Active"/"Inactive" to anything else (e.g., "Revoked")

### Make User an Admin
In **registry** tab, change Access from "User" to "Admin"

### Remove Admin Access
In **registry** tab, change Access from "Admin" to "User"

---

## 📊 Status Reference

### User Status (registry tab)
| StAccess Level (registry tab)
| Access | Meaning |
|--------|---------|
| **Admin** | Can approve/reject access requests |
| **User** | Standard user access |

### atus | Meaning |
|--------|---------|
| **Inactive** | Approved, needs to onboard |
| **Active** | Onboarded, has sheet access |
| Other | No access granted |

### Request Status (requests tab)
| Status | Meaning |
|--------|---------|
| **Pending** | Awaiting your approval |
| **Approved** | You approved this request |
| **Rejected** | You denied this request |

---

## 🔍 Common Tasks

### Check Who Has Access
Look at **registry** tab - all users with Status "Active" or "Inactive"

### Check Pending Requests
Look at **requests** tab - filter by Status = "Pending"

### Find User's Sheet
Look up email in **registry** tab → SheetId column

### Revoke Access
Change Status to "Revoked" or delete row from **registry**

---

## ⚡ Cache Info

- **Cache Duration:** 5 minutes
- **What it caches:** User access status
- **Clear cache:** Restart server or wait 5 minutes
- **Auto-cleared:** When registry is updated via API

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| User says "Access Required" but is in registry | Wait 5 min or restart server |
| Request not showing in spreadsheet | Check service account has Editor access |
| User can't access after approval | Verify Status is exactly "Inactive" or "Active" |
| Slow performance | Check cache is working (logs should show minimal API calls) |

---

## 📧 Notification Setup

### Option 1: Google Sheets
Tools → Notification rules → "Any changes are made" to requests tab

### Option 2: Apps Script
See MIGRATION_GUIDE.md for email notification script

---

## 🔐 Security Notes

⚠️ **Admin endpoint** (`/api/admin/approve-access`) currently has NO admin check  
⚠️ Any authenticated user can call it  
⚠️ Consider adding admin role checking  

---
Access | Notes
└── requests (access requests log)
    └── Email | Status | RequestedAt | Notes
```

## 🔐 Admin Access

### Who Can Approve Requests?
Only users with `Access = "Admin"` in the registry tab can:
- View the "Pending Requests" sidebar option
- Approve/reject requests through     # User: Submit access request
GET  /api/access-request              # User: Check request status
GET  /api/admin/pending-requests      # Admin: List pending requests
POST /api/admin/approve-access        # Admin: Approve/reject request
GET  /api/onboarding/status           # Check user's onboarding status
```

All admin endpoints require the user to have `Access = "Admin"` in the registry. └── Email | SheetId | Status | CreatedAt | Notes
└── requests (access requests log)
    └── Email | Status | RequestedAt | Notes
```

---

## 🔗 API Endpoints

```
POST /api/access-request          # User: Submit access request
GET  /api/access-request          # User: Check request status
POST /api/admin/approve-access    # Admin: Approve/reject request
GET  /api/onboarding/status       # Check user's onboarding status
```

---

## 📚 Documentation

- **ACCESS_CONTROL_GUIDE.md** - Complete system documentation
- **MIGRATION_GUIDE.md** - Setup and migration instructions
- **TESTING_CHECKLIST.md** - Testing procedures
- **ACCESS_CONTROL_CHANGES.md** - Implementation details

---

## 🎯 User Journey

```
New User Signs In
       ↓
   Not in Registry
       ↓
   See "Access Required" Page
       ↓
   Submit Request → Logged in "requests" tab
       ↓
   You Get Notified
       ↓
   You Approve → Add to "registry" with Status="Inactive"
       ↓
   User Signs In Again → Allowed Access
       ↓
   User Onboards → Status="Active", SheetId populated
       ↓
   User Has Full Access
```

---

## ⚙️ Environment Variables

Required in `.env.local`:
```bash
USER_REGISTRY_SPREADSHEET_ID=...  # Your registry spreadsheet
TEMPLATE_SPREADSHEET_ID=...       # Template for new sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=...  # Service account
GOOGLE_PRIVATE_KEY=...            # Service account key
```

NOT needed anymore:
```bash
ALLOWED_EMAILS=...  # ❌ Remove this
```

---

## 💡 Tips

✅ Check requests tab daily for new requests  
✅ Use "Inactive" status to pre-approve users before they onboard  
✅ Add notes to track why users were approved  
✅ Keep a backup of the registry spreadsheet  
✅ Monitor server logs for authorization errors  

---

**Need Help?** See ACCESS_CONTROL_GUIDE.md for detailed information.
