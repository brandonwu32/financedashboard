# API Documentation - FinanceTracker

## Overview

FinanceTracker exposes several API endpoints for managing authentication, transactions, and parsing bank statements.

## Authentication

All protected endpoints require a valid NextAuth.js session. Authentication is handled via Google OAuth 2.0.

### Session Check
```
GET /api/auth/session
```

Returns the current user session or null if not authenticated.

---

## Endpoints

### Authentication Endpoints

#### Sign In
```
GET /api/auth/signin
```

Initiates Google OAuth sign-in flow. User is redirected to Google login.

#### Sign Out
```
POST /api/auth/signout
```

Invalidates the current session and clears cookies.

#### Auth Callback
```
GET /api/auth/callback/google?code=...&state=...
```

Google OAuth callback endpoint. Automatically handled by NextAuth.

---

### Transaction Endpoints

#### Get Transactions
```
GET /api/transactions
```

**Authentication:** Required (Session)

**Description:** Retrieves all transactions from Google Sheets

**Response:**
```json
{
  "transactions": [
    {
      "date": "2024-02-01",
      "description": "Starbucks",
      "amount": 5.25,
      "category": "Food & Dining",
      "creditCard": "Chase Sapphire",
      "status": "completed",
      "notes": ""
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - No valid session
- `500 Internal Server Error` - Failed to fetch from Google Sheets

---

#### Save Transactions
```
POST /api/transactions
```

**Authentication:** Required (Session)

**Description:** Saves parsed transactions to Google Sheets

**Request Body:**
```json
{
  "transactions": [
    {
      "date": "2024-02-01",
      "description": "Restaurant",
      "amount": 45.50,
      "category": "Food & Dining",
      "creditCard": "Amex",
      "status": "completed",
      "notes": "Lunch meeting"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "saved": 1
}
```

**Error Responses:**
- `400 Bad Request` - Invalid transaction data
- `401 Unauthorized` - No valid session
- `500 Internal Server Error` - Failed to save to Google Sheets

---

### Parsing Endpoints

#### Parse Transactions from Images
```
POST /api/parse-transactions
```

**Authentication:** Required (Session)

**Description:** Uses OpenAI GPT-4 Vision to extract transactions from bank statement images or screenshots

**Request Format:** multipart/form-data

**Parameters:**
- `files` (required, multiple) - Image files (PNG, JPG, PDF up to 10MB each)
- `creditCard` (optional) - Credit card name/identifier
- `cutoffDate` (optional) - ISO date string (YYYY-MM-DD) to filter transactions from this date onwards
- `saveToSheet` (optional) - "true" to automatically save parsed transactions

**Response:**
```json
{
  "transactions": [
    {
      "date": "2024-02-01",
      "description": "Amazon Purchase",
      "amount": 32.99,
      "category": "Shopping",
      "creditCard": "Chase Sapphire",
      "status": "completed",
      "notes": ""
    }
  ],
  "confidence": 0.95,
  "warnings": [
    "Could not determine merchant for transaction on 2024-02-05",
    "Amount unclear for transaction ending in ...1234"
  ]
}
```

**Fields:**
- `transactions` (array) - Parsed transaction objects
- `confidence` (number) - Average confidence score (0-1)
- `warnings` (array) - Any issues during parsing

**Error Responses:**
- `400 Bad Request` - No files provided
- `401 Unauthorized` - No valid session
- `500 Internal Server Error` - Parsing failed

**Example Request (cURL):**
```bash
curl -X POST http://localhost:3000/api/parse-transactions \
  -F "files=@statement.jpg" \
  -F "creditCard=Chase Sapphire" \
  -F "cutoffDate=2024-02-01"
```

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('creditCard', 'Amex Platinum');
formData.append('cutoffDate', '2024-02-01');

const response = await fetch('/api/parse-transactions', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

---

## Data Models

### Transaction Object
```typescript
interface Transaction {
  date: string;              // ISO date format (YYYY-MM-DD)
  description: string;       // Merchant or transaction name
  amount: number;            // Transaction amount (positive)
  category: string;          // Expense category
  creditCard: string;        // Credit card used
  status?: string;           // Optional status (e.g., "completed", "pending")
  notes?: string;            // Optional additional notes
}
```

### Category Types
- `Food & Dining`
- `Transportation`
- `Entertainment`
- `Shopping`
- `Utilities`
- `Healthcare`
- `Subscriptions`
- `Other`

### Parse Result Object
```typescript
interface ParsedTransactionData {
  transactions: Transaction[];     // Extracted transactions
  confidence: number;              // Confidence score (0-1)
  warnings: string[];              // Issues/warnings during parsing
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No session or email not in allowlist |
| 500 | Server Error - Internal failure |

### Error Response Format
```json
{
  "error": "Unauthorized",
  "message": "Email not in allowed users list"
}
```

---

## Rate Limiting

Currently no built-in rate limiting. Consider implementing:

- 100 requests per minute per session (authentication endpoints)
- 10 file uploads per minute per session (parse endpoints)

---

## Google Sheets Integration

### Connected Sheet Schema

The app expects a Google Sheet with the following columns:

| Column | Header | Type | Description |
|--------|--------|------|-------------|
| A | Date | String | YYYY-MM-DD format |
| B | Description | String | Merchant/transaction name |
| C | Amount | Number | Transaction amount |
| D | Category | String | Expense category |
| E | Credit Card | String | Card name/identifier |
| F | Status | String | Status (optional) |
| G | Notes | String | Additional notes (optional) |

### Sheet Access

- Service account email must have **Editor** access
- Sheet ID must be in `GOOGLE_SHEETS_SPREADSHEET_ID` env variable
- API must have Google Sheets API enabled

---

## OpenAI Integration

### GPT-4 Vision Usage

The parse endpoint uses OpenAI's GPT-4 Vision model:

- Model: `gpt-4-vision-preview`
- Input: Base64-encoded images
- Output: JSON with extracted transactions

### Rate Limits

OpenAI API rate limits apply (check your API key limits):
- Default: 100,000 tokens per minute

### Costs

Pricing varies by model. Check OpenAI pricing:
- GPT-4 Vision: ~$0.01 per 1K tokens
- Typical parse: 1-5 requests per upload

---

## Security Notes

### Authentication
- All API routes check for valid session
- Email must be in `ALLOWED_EMAILS` allowlist
- Unauthorized attempts are logged (see server logs)

### Data Protection
- Transactions sent over HTTPS only
- No transaction data logged
- Images are processed by OpenAI (review their privacy policy)
- Private keys never exposed to client

### API Keys
- Never embed API keys in frontend code
- All API calls made from server
- API keys only in environment variables

---

## Development

### Testing Endpoints Locally

#### Test Authentication
```bash
curl http://localhost:3000/api/auth/session
```

#### Test Transaction Fetch
```bash
curl -H "Cookie: [your-session-cookie]" \
  http://localhost:3000/api/transactions
```

#### Test Parsing (with file)
```bash
curl -X POST \
  -F "files=@test-statement.jpg" \
  -H "Cookie: [your-session-cookie]" \
  http://localhost:3000/api/parse-transactions
```

### Debugging

1. Check browser Network tab (F12)
2. Check server console for logs
3. Verify environment variables are set
4. Check Google Cloud Console API quotas
5. Verify service account permissions

---

## Future Endpoints (Planned)

- `GET /api/analytics` - Advanced spending analytics
- `GET /api/budgets` - Retrieve budget settings
- `POST /api/budgets` - Update budget settings
- `DELETE /api/transactions/:id` - Delete transaction
- `PATCH /api/transactions/:id` - Update transaction
- `GET /api/export` - Export transactions as CSV/PDF
- `POST /api/receipt-upload` - Upload receipt images for OCR

---

## Webhooks (Future)

Planned webhook support for:
- Transaction added
- Budget exceeded
- Spending threshold crossed
- Monthly report generated

---

## Support & Issues

For API issues:
1. Check server error logs
2. Verify environment variables
3. Check API service status
4. Review this documentation
5. Open an issue on GitHub

---

## Changelog

### v1.0.0 (Current)
- Initial API endpoints
- Google Sheets integration
- OpenAI GPT-4 Vision parsing
- NextAuth.js authentication
