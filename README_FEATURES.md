# 💰 FinanceTracker - Personal Finance Dashboard & Expense Tracker

A full-featured personal finance management application built with modern web technologies. Track expenses, manage budgets, and upload bank statements with AI-powered parsing.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## ✨ Key Features

### 🔐 Security & Access Control
- **Google OAuth 2.0** authentication for secure login
- **Email allowlist** - only authorized users can access
- **Session-based** authentication with NextAuth.js
- Environment variables for sensitive data

### 📊 Analytics Dashboard
- **Monthly spending overview** with trends
- **Budget tracking** with visual progress bars
- **Category-based analysis** of expenses
- **30-day spending chart** with daily breakdown
- **Recent transactions** table with filtering
- **Responsive design** for mobile and desktop

### 📤 Smart Transaction Upload
- **AI-powered parsing** using OpenAI GPT-4 Vision
- Support for **bank statements** (PDF, PNG, JPG)
- Support for **transaction screenshots**
- **Automatic categorization** of expenses
- **Duplicate detection** to prevent double-entries
- **Credit card identification** (optional)
- **Cutoff date filtering** to control what gets imported
- **Preview before saving** to verify accuracy

### 📥 Google Sheets Integration
- **Real-time sync** with your Google Sheet
- **Read transactions** from your sheet to dashboard
- **Write transactions** parsed from statements
- **Automatic organization** of financial data
- **Always accessible** - data lives in Google Sheets

### 💾 Budget Management
- **Customizable monthly budgets** per category
- **Visual progress indicators** showing spending vs budget
- **Over-budget warnings** when spending limits exceeded
- **Category suggestions** for common expense types
- **LocalStorage persistence** of budget settings

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+, React 19, TypeScript
- **Styling**: Tailwind CSS with responsive design
- **Authentication**: NextAuth.js v5 with Google OAuth
- **APIs**: 
  - Google Sheets API for data persistence
  - OpenAI GPT-4 Vision for document parsing
- **Database**: Google Sheets (serverless)
- **Hosting Ready**: Vercel, AWS, GCP, or any Node.js platform

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd financedashboard
pnpm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
# Fill in all required credentials (see QUICKSTART.md)
```

### 3. Run Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` and sign in with your Google account!

**Full setup guide**: See [QUICKSTART.md](./QUICKSTART.md)

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[SETUP.md](./SETUP.md)** - Detailed configuration & troubleshooting
- API documentation in code comments

## 📁 Project Structure

```
app/
├── api/                           # API Routes
│   ├── auth/[...nextauth]/       # NextAuth handlers
│   ├── parse-transactions/       # AI parsing endpoint
│   └── transactions/             # Google Sheets CRUD
│
├── lib/
│   ├── ai-parser.ts              # OpenAI GPT-4 Vision integration
│   ├── google-sheets.ts          # Google Sheets API wrapper
│   ├── definitions.ts            # TypeScript types
│   └── utils.ts                  # Helper functions
│
├── ui/
│   ├── dashboard/                # Dashboard components
│   │   ├── layout.tsx            # Main sidebar layout
│   │   ├── expense-overview.tsx  # KPI cards
│   │   ├── budget-meter.tsx      # Budget progress bars
│   │   ├── spending-chart.tsx    # 30-day visualization
│   │   └── recent-transactions.tsx # Transaction list
│   ├── global.css                # Global & responsive styles
│   └── ...other UI components
│
├── dashboard/                    # Dashboard page
├── upload/                       # Upload page with AI parsing
├── settings/                     # Settings & budget config
├── login/                        # Google OAuth login
├── auth.ts                       # NextAuth configuration
└── layout.tsx                    # Root layout with SessionProvider
```

## 🎨 Responsive Design

The app is fully optimized for:
- **Mobile** (320px and up) - Touch-friendly, optimized interfaces
- **Tablet** (768px and up) - Adaptive layouts
- **Desktop** (1024px and up) - Full feature experience

All interactive elements meet WCAG accessibility standards.

## 🔧 Configuration

### Environment Variables

**Authentication:**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret
```

**Google Sheets:**
```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**AI Parsing:**
```env
OPENAI_API_KEY=sk-...
```

**Access Control:**
```env
ALLOWED_EMAILS=your_email@gmail.com,other_email@gmail.com
```

See `.env.local.example` for all available options.

## 🎯 Usage

### Dashboard
1. Log in with your Google account
2. View spending overview, budgets, and trends
3. See recent transactions from your sheet

### Upload Transactions
1. Navigate to "Upload Statements"
2. Select bank statement images or transaction screenshots
3. (Optional) Specify credit card and cutoff date
4. AI analyzes the document and extracts transactions
5. Review parsed data
6. Click "Save to Google Sheet"

### Manage Budgets
1. Go to "Settings"
2. Adjust monthly budget for each category
3. Click "Save Budgets"
4. Budgets appear on dashboard progress bars

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```

Don't forget to:
1. Add all environment variables in project settings
2. Update `NEXTAUTH_URL` to production domain

### Other Platforms
```bash
pnpm build
pnpm start
```

Set environment variables on your hosting platform.

## 🔒 Security Best Practices

✅ **Do:**
- Use strong `NEXTAUTH_SECRET`
- Keep `.env.local` out of version control
- Review Google OAuth scopes
- Monitor API usage limits
- Use HTTPS in production
- Rotate API keys regularly

❌ **Don't:**
- Commit credentials to git
- Share `.env.local` files
- Use weak secrets
- Grant unnecessary API permissions

## 📈 Features Roadmap

- [ ] Multi-user support with role-based access
- [ ] Recurring transaction templates
- [ ] Advanced filtering and search
- [ ] Export reports (PDF, CSV)
- [ ] Budget alerts via email
- [ ] Investment tracking
- [ ] Receipt image OCR storage
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support & Troubleshooting

### Common Issues

**Login not working?**
- Verify email is in `ALLOWED_EMAILS`
- Check Google OAuth credentials
- Clear browser cookies and try again

**Parsing fails?**
- Ensure image is clear and legible
- Check OpenAI API balance
- Verify API key is valid

**Google Sheets not updating?**
- Verify service account has sheet access
- Check spreadsheet ID
- Verify Google Sheets API is enabled

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

### Get Help
- Check documentation files
- Review browser console errors (F12)
- Check API service status pages
- Open an issue on GitHub

## 📊 Example Dashboard Metrics

- **Monthly Spending**: $X,XXX total
- **Average Transaction**: $XX.XX
- **Spending Trend**: ±X% vs last month
- **Budget Status**: X/Y categories over budget
- **Active Days**: X days with transactions
- **Top Category**: $X,XXX spent

## 💡 Tips & Tricks

1. **Batch uploads**: Upload multiple statements at once
2. **Cutoff dates**: Use cutoff dates to import specific periods
3. **Categories**: AI learns better with clearer statements
4. **Mobile access**: Use responsive design on-the-go
5. **Budget planning**: Review monthly to adjust budgets
6. **Export data**: All data is in Google Sheets for easy export

## 📞 Contact

Built with ❤️ for personal finance tracking.

---

**Ready to get started?** → [QUICKSTART.md](./QUICKSTART.md)

**Want detailed setup?** → [SETUP.md](./SETUP.md)
