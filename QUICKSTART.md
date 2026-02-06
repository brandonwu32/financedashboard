# Quick Start Guide - FinanceTracker

## 5-Minute Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Create `.env.local` File
```bash
cp .env.local.example .env.local
```

### 3. Get Your Credentials

#### Google OAuth (5 min)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Search for "Google+ API" and enable it
4. Go to "Credentials" → Create → OAuth 2.0 Client ID (Web Application)
5. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
6. Copy Client ID and Secret to `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

#### NextAuth Secret (1 min)
Run this command and add the output to `.env.local`:
```bash
openssl rand -base64 32
```
```env
NEXTAUTH_SECRET=your_generated_secret
```

#### Google Sheets (10 min)
1. In Cloud Console, enable **Google Sheets API**
2. Create Service Account: Credentials → Create → Service Account
3. Click the service account email you created
4. Go to "Keys" → "Add Key" → "Create new key" (JSON)
5. A JSON file will download. Open it and find:
   - `private_key` (copy everything including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - `client_email`
6. Add to `.env.local`:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```
   (Note: You do NOT need `GOOGLE_SHEETS_API_KEY` - the service account handles authentication)

7. **Create a Google Sheet** with these columns (Row 1 = headers):
   - A: Date
   - B: Description  
   - C: Amount
   - D: Category
   - E: Credit Card
   - F: Status
   - G: Notes

8. Share the Google Sheet with your service account email
9. Copy the spreadsheet ID from the URL: `docs.google.com/spreadsheets/d/[THIS_ID]/edit`

#### OpenAI (2 min)
1. Visit [platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Add to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key
```

#### Allowed Users (1 min)
Add your email(s) to `.env.local`:
```env
ALLOWED_EMAILS=your_email@gmail.com
```

### 4. Start Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser!

---

## Testing the App

### Test Login
1. Click "Sign in with Google"
2. Use the email from `ALLOWED_EMAILS`
3. You should be redirected to `/dashboard`

### Test Dashboard
- View your spending overview (will be empty initially)
- Check budget status
- See spending chart
- View recent transactions

### Test Upload Feature
1. Go to "Upload Statements"
2. Take a screenshot of a bank statement or recent transactions
3. (Optional) Select a credit card and cutoff date
4. Click "Parse Transactions"
5. Preview the results
6. Click "Save to Google Sheet" to add to your spreadsheet

### Verify Google Sheets
- Check your Google Sheet to confirm transactions were added!

---

## Environment Variables Complete Reference

```env
# Authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google Sheets API
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# OpenAI (for transaction parsing)
OPENAI_API_KEY=

# Access Control
ALLOWED_EMAILS=your_email@gmail.com,other_email@gmail.com

---

## Troubleshooting

### Login page shows "Unauthorized" or won't let me in
- ✓ Check email is in `ALLOWED_EMAILS` (exact match)
- ✓ Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- ✓ Verify redirect URI includes `/api/auth/callback/google`

### "Error parsing transactions" on upload
- ✓ Check OpenAI API key is valid and has credits
- ✓ Try a clearer/higher quality image
- ✓ Check if image shows transaction details clearly

### Transactions not saving to Google Sheet
- ✓ Verify service account email has edit access to the sheet
- ✓ Check private key has correct formatting (with `\n` for newlines)
- ✓ Verify spreadsheet ID is correct
- ✓ Ensure Google Sheets API is enabled

### "Module not found" error
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Next Steps

1. **Customize Budgets**: Go to Settings and adjust budget limits
2. **Add Transactions**: Upload bank statements using the Upload page
3. **Monitor Spending**: Check the Dashboard for insights
4. **Export Data**: Your data is stored in Google Sheets, so you can always access it there

---

## Security Notes

🔒 **Important:**
- Never commit `.env.local` to version control
- Keep your private key secret
- Review Google OAuth scopes before sharing
- Change `ALLOWED_EMAILS` when you want to restrict access
- Regularly check OpenAI API usage to monitor costs

---

## Deployment to Production

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add all environment variables in Project Settings
4. Set `NEXTAUTH_URL` to your production domain:
```env
NEXTAUTH_URL=https://yourdomain.com
```
5. Deploy!

### Other Platforms
```bash
# Build
pnpm build

# Start production server
pnpm start
```

Remember to set all environment variables on your hosting platform!

---

## Getting Help

- Check `SETUP.md` for detailed documentation
- Review error messages in browser console (F12)
- Check OpenAI API status at [status.openai.com](https://status.openai.com)
- Check Google Cloud status at [status.cloud.google.com](https://status.cloud.google.com)

---

Enjoy tracking your finances! 💰📊
