# Finance Dashboard

This repository is a personal finance dashboard and expense tracker built with Next.js (App Router), TypeScript, and Tailwind CSS. It integrates with Google Sheets for data storage and the OpenAI API for parsing transaction images. The app is currently designed for a single user (owner) but includes foundations to expand for multi-user deployments.

**What this app does**
- **Authenticate:** Google OAuth via NextAuth to allow the owner to sign in.
- **Upload & Parse Statements:** Upload screenshots of bank statements or transaction receipts; the backend sends the images to an AI parser that extracts transactions.
- **Manual Entry:** A dedicated `Add Expense` page lets you add transactions manually without uploading images.
- **Google Sheets Backend:** Transactions and budgets are stored in a Google Sheet via a service-account integration.
- **Dashboard:** Bi-weekly budgeting utilities, spending charts, recent transactions, and cards summarizing balances and budgets.
- **Optimistic UI & Caching:** SWR is used for client caching and optimistic updates when adding transactions.

**Key Technologies**
- Next.js (App Router) + React + TypeScript
- Tailwind CSS for styling
- NextAuth (Google) for authentication
- Google Sheets API (service-account JWT) for persistent storage
- OpenAI for image parsing (LLM-driven extraction)
- SWR for client caching and optimistic updates

**Security & Operational Notes (Important)**
- Sensitive keys live in environment variables (`GOOGLE_PRIVATE_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`, etc.). Do not commit these; use your platform's secret manager in production.
- Sheets formula injection: text fields are sanitized server-side to prevent leading `=`, `+`, `-`, or `@` from being executed as formulas in Google Sheets.
- OpenAI / PII: Uploaded images may contain personally identifiable information. Consider masking or explicit user consent and use an OpenAI plan that supports data non-retention if required.
- Rate limiting & file-size limits: The parsing API should be protected with rate limiting and file-size controls to prevent abuse and runaway costs.
- Authentication: `ALLOWED_EMAILS` middleware provides an allowlist; keep it configured carefully for multi-user deployments.

**Project Structure (high-level)**
- `/app` — Next.js App Router pages and API routes (including `/api/transactions`, `/api/parse-transactions`, and UI components)
- `/app/lib` — helpers: `google-sheets.ts` (Sheets client and helpers), `ai-parser.ts` (OpenAI integration), and utilities
- `/app/ui` — shared UI components and dashboard parts
- `/archive` — backups of previously unused or deprecated UI files (kept for recovery)

**How to run locally**
1. Copy `.env.example` to `.env.local` and set required environment variables (Google credentials, OpenAI key, NextAuth secret, spreadsheet ID).
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm dev`
4. Build for production: `pnpm exec tsc --noEmit && pnpm run build`

**Future plans to support multiple users**
- Multi-tenant data storage: Move from a single Google Sheet to a per-user sheet or a proper database (Postgres) with per-user isolation.
- Per-user authentication and billing: Support multiple OAuth accounts, account linking, and billing/usage tracking to cover API costs.
- Admin & user settings: Allow users to manage their budgets, categories, and integrations via a settings UI.
- Privacy & compliance: Add PII redaction, user data export/deletion, and stronger audit logging.
- Scalable parsing: Offload heavy image parsing to background workers or serverless functions with a queue (e.g., Redis + BullMQ) and add retries and monitoring.
- Rate limiting & quotas: Implement per-user rate limits for AI calls and file uploads, with clear UI feedback.

**If you want me to do more**
- I can add server-side validation schemas (Zod) to harden inputs and dedupe transactions on append.
- I can implement file-size checks and basic per-user rate limiting on the parse endpoint.
- I can prepare CI steps for secret scanning and dependency audits.

If you want this repo simplified further (for example remove `archive/` or rework the Google Sheets integration into a database), tell me which direction to take.

---
Last update: February 6, 2026
