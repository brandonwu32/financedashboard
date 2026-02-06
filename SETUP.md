# FinanceTracker - Financial Dashboard & Expense Tracker

A comprehensive personal finance management application with Google OAuth authentication, Google Sheets integration, and AI-powered transaction parsing.

## Features

### 🔐 Security
- Google OAuth 2.0 authentication with email allowlist
- Session-based authentication using NextAuth.js
- Secure environment variable configuration

### 📊 Dashboard Analytics
- Monthly spending overview and trends
- Budget tracking with visual progress meters
- Category-based expense analysis
- 30-day spending visualization
- Recent transactions view with filtering

### 📤 Smart Transaction Upload
- Parse bank statements using OpenAI GPT-4 Vision
- Support for screenshots and PDF documents
- Automatic transaction categorization
- Duplicate detection and filtering
- Credit card identification
- Configurable cutoff dates for filtering

### 📥 Google Sheets Integration
- Seamless read/write to your Google Sheets
- Real-time data synchronization
- Organized transaction records
- Easy backup and sharing

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/pnpm
- Google OAuth credentials from Google Cloud Console
- OpenAI API key
- Google Sheets API access
- Google Workspace or personal account

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Fill in your environment variables:

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy Client ID and Client Secret to `.env.local`

#### Google Sheets Setup
1. Enable Google Sheets API in Cloud Console
2. Create a service account and download JSON key
3. Extract the private key and email from the JSON
4. Share your Google Sheet with the service account email
5. Get your spreadsheet ID from the URL

#### OpenAI Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Add to `.env.local`

#### NextAuth Configuration
```bash
# Generate a secure secret
openssl rand -base64 32
```

#### Environment Variables Template
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Allowed Users (comma-separated emails)
ALLOWED_EMAILS=your_email@gmail.com,another_email@gmail.com
```

### Step 3: Google Sheets Setup

Create a Google Sheet with the following columns (Row 1 should have headers):
- A: Date (YYYY-MM-DD format)
- B: Description
- C: Amount
- D: Category
- E: Credit Card
- F: Status
- G: Notes
- H: (Optional - additional fields)

### Step 4: Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
app/
├── api/                          # API Routes
│   ├── auth/[...nextauth]/       # NextAuth handlers
│   ├── parse-transactions/       # AI transaction parsing
│   └── transactions/             # Google Sheets integration
├── lib/
│   ├── ai-parser.ts              # OpenAI integration
│   ├── google-sheets.ts          # Google Sheets utilities
│   └── definitions.ts            # Type definitions
├── ui/
│   ├── dashboard/                # Dashboard components
│   │   ├── layout.tsx            # Main layout with sidebar
│   │   ├── expense-overview.tsx  # Overview cards
│   │   ├── budget-meter.tsx      # Budget progress bars
│   │   ├── spending-chart.tsx    # 30-day chart
│   │   └── recent-transactions.tsx # Transaction table
│   └── global.css                # Global styles
├── dashboard/                    # Dashboard page
├── upload/                       # Upload transactions page
├── settings/                     # Settings page
├── login/                        # Login page
├── auth.ts                       # NextAuth configuration
└── layout.tsx                    # Root layout
```

## Usage Guide

### 1. Login
- Navigate to `/login`
- Click "Sign in with Google"
- Must use an email in `ALLOWED_EMAILS`

### 2. Dashboard
- View spending overview and trends
- Monitor budget status for each category
- See recent transactions
- Visualize spending patterns

### 3. Upload Transactions
- Go to "Upload Statements"
- Select bank statement image(s) or screenshot(s)
- (Optional) Specify credit card
- (Optional) Set cutoff date for filtering
- Preview parsed transactions
- Save to Google Sheet

### 4. Settings
- Customize monthly budgets per category
- View account information

## Customization

### Add Budget Categories
Edit the `DEFAULT_BUDGETS` object in `app/ui/dashboard/budget-meter.tsx`:
```typescript
const DEFAULT_BUDGETS: Record<string, number> = {
  "Your Category": 500,
  // ... more categories
};
```

### Modify AI Parsing Prompt
Edit the prompt in `app/lib/ai-parser.ts` to change how transactions are categorized and parsed.

### Change Budget Display
Adjust the chart styling in `app/ui/dashboard/spending-chart.tsx` and `app/ui/dashboard/budget-meter.tsx`.

## Deployment

### Vercel (Recommended)
```bash
vercel
```

Don't forget to:
1. Add environment variables in Vercel project settings
2. Update `NEXTAUTH_URL` to your production domain

### Other Platforms
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Set production environment variables

## Security Best Practices

⚠️ **Important Security Notes:**
- Never commit `.env.local` to version control
- Keep `ALLOWED_EMAILS` updated with only trusted users
- Regularly rotate API keys
- Use strong `NEXTAUTH_SECRET`
- Review Google OAuth scopes
- Monitor Google Sheets API usage

## Troubleshooting

### Login Issues
- Verify email is in `ALLOWED_EMAILS`
- Check Google OAuth credentials
- Clear browser cookies and try again

### Transaction Parsing Fails
- Ensure OpenAI API key is valid
- Check image quality and legibility
- Verify bank statement format is recognized
- Check OpenAI API usage limits

### Google Sheets Not Updating
- Verify service account email has sheet access
- Check Google Sheets API is enabled
- Verify spreadsheet ID is correct
- Check private key format (newlines escaped as `\n`)

## Contributing

Feel free to fork and submit pull requests!

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.

---

Built with ❤️ using Next.js, TypeScript, Tailwind CSS, Google APIs, and OpenAI
