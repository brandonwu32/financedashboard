import { google } from "googleapis";
import { JWT } from "google-auth-library";

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  creditCard: string;
  status?: string;
  notes?: string;
}

// Initialize Google Sheets API with service account
export function getGoogleSheetsClient() {
  // Handle the private key - convert escaped newlines to actual newlines
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is not set");
  }
  
  // Remove surrounding quotes if present (from .env file parsing)
  privateKey = privateKey.replace(/^["']|["']$/g, "");
  
  // Replace escaped newlines with actual newlines
  const formattedKey = privateKey.includes("\\n") 
    ? privateKey.replace(/\\n/g, "\n") 
    : privateKey;

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // Minimal type-cast to satisfy TypeScript definitions for the googleapis client.
  // The runtime value is a valid auth client (JWT), but the types sometimes
  // differ between google-auth-library and googleapis declarations.
  return google.sheets({ version: "v4", auth: auth as unknown as any });
}

// Return a Drive client using the same auth
export function getDriveClient() {
  // reuse the same auth creation as getGoogleSheetsClient
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is not set");
  }
  privateKey = privateKey.replace(/^["']|["']$/g, "");
  const formattedKey = privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey;

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.drive({ version: "v3", auth: auth as unknown as any });
}

// Copy a template spreadsheet (by fileId) and return the new file id
export async function copyTemplateSpreadsheet(templateId: string, title: string) {
  try {
    const drive = getDriveClient();
    const res = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: title,
      },
      fields: 'id',
    } as any);

    return res.data.id as string;
  } catch (error) {
    console.error('Error copying template spreadsheet:', error);
    throw error;
  }
}

// Share a file with a user email (give writer permission)
export async function shareFileWithUser(fileId: string, userEmail: string) {
  try {
    const drive = getDriveClient();
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: userEmail,
      },
      // Do not send notification emails — service accounts often cannot
      // send emails on behalf of users and this can produce errors. The
      // sheet will still be shared with the provided email address.
      sendNotificationEmail: false,
    } as any);
    return true;
  } catch (error) {
    console.error('Error sharing file with user:', error);
    throw error;
  }
}

// Registry helpers: store mapping in a central registry sheet
export async function getRegistryEntry(email: string) {
  try {
    const sheets = getGoogleSheetsClient();
    const registryId = process.env.USER_REGISTRY_SPREADSHEET_ID;
    if (!registryId) return null;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: registryId,
      range: "registry!A2:E",
    } as any);

    const rows = response.data.values || [];
    for (const row of rows) {
      const rowEmail = (row[0] || '').toString().trim();
      if (rowEmail.toLowerCase() === email.toLowerCase()) {
        return {
          email: rowEmail,
          sheetId: row[1] || '',
          status: row[2] || '',
          createdAt: row[3] || '',
          notes: row[4] || '',
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading registry entry:', error);
    return null;
  }
}

export async function addRegistryEntry(email: string, sheetId: string, status = 'created', notes = '') {
  try {
    const sheets = getGoogleSheetsClient();
    const registryId = process.env.USER_REGISTRY_SPREADSHEET_ID;
    if (!registryId) throw new Error('USER_REGISTRY_SPREADSHEET_ID not configured');

    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: registryId,
      range: 'registry!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[email, sheetId, status, now, notes]],
      },
    } as any);
    return true;
  } catch (error) {
    console.error('Error adding registry entry:', error);
    throw error;
  }
}

// Verify spreadsheet structure: checks for required sheets and headers
export async function verifySpreadsheetStructure(spreadsheetId: string) {
  try {
    const sheets = getGoogleSheetsClient();

    // Check sheet titles exist
    const meta = await sheets.spreadsheets.get({ spreadsheetId } as any);
    const titles = (meta.data.sheets || []).map((s: any) => s.properties?.title);
    // Require exact sheet titles: 'Spending' and 'Weekly Budget'. Do not accept
    // legacy or lowercased 'budget' tab names to avoid ambiguity — the app now
    // expects a sheet named exactly 'Weekly Budget'.
    const hasSpending = titles.includes("Spending");
    const hasWeeklyBudget = titles.includes("Weekly Budget");
    if (!hasSpending || !hasWeeklyBudget) {
      const missing = !hasSpending ? 'Spending' : (!hasWeeklyBudget ? 'Weekly Budget' : '');
      return { ok: false, missing: `missing sheet ${missing}` };
    }

    // Check header rows
    const transHeader = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Spending'!A1:E1" } as any);

    // Use the exact 'Weekly Budget' sheet for headers
    const budgetHeader = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Weekly Budget'!A1:B1" } as any);

    const th = (transHeader.data.values || [])[0] || [];
    const bh = (budgetHeader.data.values || [])[0] || [];

    const transExpected = ['Range', 'Amount', 'Type', 'Desc', 'Card'];
    const budgetExpected = ['Budget Categories', 'Values'];

    // Case-insensitive header matching and forgiving whitespace
    const matchHeader = (actual: string | undefined, expected: string) => {
      if (!actual) return false;
      return actual.toString().trim().toLowerCase() === expected.toLowerCase();
    };

    for (let i = 0; i < transExpected.length; i++) {
      if (!matchHeader(th[i], transExpected[i])) return { ok: false, missing: `transaction header mismatch at ${i}` };
    }
    for (let i = 0; i < budgetExpected.length; i++) {
      if (!matchHeader(bh[i], budgetExpected[i])) return { ok: false, missing: `budget header mismatch at ${i}` };
    }

    return { ok: true };
  } catch (error) {
    console.error('Error verifying spreadsheet structure:', error);
    return { ok: false, error: String(error) };
  }
}

export async function readTransactionsFromSheet(
  range: string = "'Spending'!A2:E",
  spreadsheetIdOverride?: string
) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    return rows
      .filter((row) => {
        // Skip header rows - check if first column looks like a date (Mon day format)
        const firstCell = (row[0] || "").toString().trim();
        const headerPatterns = ["Range", "Date", "range", "date"];
        return !headerPatterns.includes(firstCell);
      })
      .map((row) => {
        // Convert date to "YYYY-MM-DD" format
        // Handles both "Jan 10" and "1/10/2026" formats
        const dateStr = row[0] || "";
        let fullDate = "";
        
        if (dateStr) {
          const s = dateStr.toString().trim();

          // 1) Slash-separated dates: handle MM/DD/YYYY, M/D/YY, YYYY/MM/DD
          if (s.includes("/")) {
            const parts = s.split("/").map((p: any) => p.trim());
            if (parts.length === 3) {
              let [p1, p2, p3] = parts;

              // If first part is 4 digits, assume YYYY/MM/DD
              if (/^\d{4}$/.test(p1)) {
                const year = p1;
                const month = String(Number(p2)).padStart(2, "0");
                const day = String(Number(p3)).padStart(2, "0");
                fullDate = `${year}-${month}-${day}`;
              } else {
                // Assume MM/DD/YYYY or MM/DD/YY (US style)
                let year = p3;
                if (/^\d{2}$/.test(year)) {
                  // two-digit year -> 2000+
                  year = String(2000 + Number(year));
                }
                const month = String(Number(p1)).padStart(2, "0");
                const day = String(Number(p2)).padStart(2, "0");
                fullDate = `${year}-${month}-${day}`;
              }
            }
          } else {
            // 2) Month name formats: accept 'Jan 10', 'January 10', '10 Jan 2026', '10 January'
            const monthNamesLong = ["january","february","march","april","may","june","july","august","september","october","november","december"];
            const monthNamesShort = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

            const parts = s.replace(/,/g, " ").split(/\s+/).filter(Boolean);
            let day: number | null = null;
            let month: number | null = null;
            let year: number | null = null;

            // Try patterns: [MonName, Day, Year?]
            if (parts.length >= 2 && isNaN(Number(parts[0])) ) {
              const mon = parts[0].toLowerCase();
              const mi = monthNamesShort.indexOf(mon.slice(0,3));
              const ml = monthNamesLong.indexOf(mon);
              if (mi !== -1) month = mi + 1;
              else if (ml !== -1) month = ml + 1;

              const maybeDay = Number(parts[1]);
              if (!isNaN(maybeDay)) day = maybeDay;
              if (parts.length >= 3 && /^\d{2,4}$/.test(parts[2])) year = Number(parts[2]);
            }

            // Try patterns: [Day, MonName, Year?]
            if (month === null && parts.length >= 2 && !isNaN(Number(parts[0]))) {
              const maybeDay = Number(parts[0]);
              const mon = parts[1].toLowerCase();
              const mi = monthNamesShort.indexOf(mon.slice(0,3));
              const ml = monthNamesLong.indexOf(mon);
              if (mi !== -1) month = mi + 1;
              else if (ml !== -1) month = ml + 1;
              if (month !== null) day = maybeDay;
              if (parts.length >= 3 && /^\d{2,4}$/.test(parts[2])) year = Number(parts[2]);
            }

            // If we found month and day but no year, infer year (use current year, adjust past/future by small heuristic)
            if (month !== null && day !== null && !year) {
              const now = new Date();
              year = now.getFullYear();
              // If inferred date is more than 60 days in the future, assume it was last year
              const candidate = new Date(year, month - 1, day);
              const diffDays = (candidate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              if (diffDays > 60) {
                year = year - 1;
              }
            }

            if (month !== null && day !== null && year !== null) {
              fullDate = `${String(year)}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            }

            // 3) Try generic Date parse as a last resort
            if (!fullDate) {
              const parsed = new Date(s);
              if (!isNaN(parsed.getTime())) {
                const yyyy = parsed.getFullYear();
                const mm = String(parsed.getMonth() + 1).padStart(2, '0');
                const dd = String(parsed.getDate()).padStart(2, '0');
                fullDate = `${yyyy}-${mm}-${dd}`;
              }
            }
          }
        }
        
        if (!fullDate) {
          console.warn(`Could not parse date string: "${dateStr}"`);
        }

        // Normalize date for display to MM/DD/YYYY when possible so previews
        // and UI are consistent. fullDate is currently YYYY-MM-DD when set.
        const formatISOToMMDDYYYY = (iso: string) => {
          if (!iso) return '';
          const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) {
            const [, y, mm, dd] = m;
            return `${mm}/${dd}/${y}`;
          }
          return iso;
        };

        const outDate = fullDate ? formatISOToMMDDYYYY(fullDate) : (dateStr || '');

        return {
          date: outDate,
          amount: parseFloat(row[1]?.replace("$", "").replace(",", "")) || 0,
          category: row[2] || "",
          description: row[3] || "",
          creditCard: row[4] || "",
          status: "",
          notes: "",
        };
      });
  } catch (error) {
    console.error("Error reading from Google Sheets:", error);
    throw error;
  }
}

export async function appendTransactionsToSheet(
  transactions: Transaction[],
  spreadsheetIdOverride?: string
) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Helper to format date strings to MM/DD/YYYY for user-facing uploads.
    const formatDateForSheet = (value: any) => {
      if (!value) return '';
      const sRaw = String(value).trim();
      // If already in MM/DD/YYYY or D/M/YYYY variants, return as-is
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(sRaw)) return sRaw;

      // Try to parse YYYY-MM-DD
      const ymd = sRaw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymd) {
        const [, y, m, d] = ymd;
        return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
      }

      // Try Date parse for other formats
      const parsed = new Date(sRaw);
      if (!isNaN(parsed.getTime())) {
        const d = String(parsed.getDate()).padStart(2, '0');
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const y = String(parsed.getFullYear());
        return `${m}/${d}/${y}`;
      }

      // Fallback: return original string
      return sRaw;
    };

    // Helper to sanitize text inputs to prevent formula injection in Sheets.
    const sanitizeCell = (value: any) => {
      if (value === undefined || value === null) return '';
      // Leave numbers untouched
      if (typeof value === 'number') return value;
      const str = String(value);
      // If the cell starts with characters that can trigger formulas in Sheets,
      // prefix with a single quote to force text. Common dangerous starters: = + - @
      if (/^[=+\-@]/.test(str)) {
        return `'${str}`;
      }
      return str;
    };

    const values = transactions.map((t) => [
      sanitizeCell(formatDateForSheet(t.date)), // Format as MM/DD/YYYY
      sanitizeCell(t.amount), // Send as number or sanitized value
      sanitizeCell(t.category),
      sanitizeCell(t.description),
      sanitizeCell(t.creditCard),
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'Spending'!A:E",
      valueInputOption: "USER_ENTERED",  // Let Google Sheets parse values
      requestBody: {
        values,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error appending to Google Sheets:", error);
    throw error;
  }
}

export async function getSpreadsheetHeaders(spreadsheetIdOverride?: string) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Spending'!A1:E1",
    });

    return response.data.values?.[0] || [];
  } catch (error) {
    console.error("Error getting headers:", error);
    throw error;
  }
}

export async function getBudgets(spreadsheetIdOverride?: string): Promise<Record<string, number>> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Weekly Budget'!A2:B",
    });

    const rows = response.data.values || [];
    const budgets: Record<string, number> = {};

    rows.forEach((row) => {
      const category = (row[0] || "").toString().trim();
      const amount = row[1] || "";
      
      // Skip empty rows
      if (!category) return;

      // Parse the budget amount - remove $ and commas, convert to number
      const parsedAmount = parseFloat(amount.toString().replace("$", "").replace(",", "")) || 0;
      budgets[category] = parsedAmount;
    });

    return budgets;
  } catch (error) {
    console.error("Error reading budgets from Google Sheets:", error);
    throw error;
  }
}

export async function updateBudgets(budgets: Record<string, number>, spreadsheetIdOverride?: string): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Get current budgets to find which ones to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Weekly Budget'!A2:B",
    });

    const currentRows = response.data.values || [];
    const currentCategories = currentRows.map((row) => (row[0] || "").toString().trim());

    // Update existing rows
    const updates = currentRows.map((row, index) => {
      const category = (row[0] || "").toString().trim();
      const newAmount = budgets[category];
      
      if (newAmount !== undefined) {
        return [`${String(index + 2)}`, category, `$${newAmount.toFixed(2)}`];
      }
      return null;
    }).filter(Boolean) as string[][];

    if (updates.length > 0) {
      // Update existing budget rows
      for (let i = 0; i < updates.length; i++) {
        const [rowNum, category, amount] = updates[i];
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'Weekly Budget'!B${rowNum}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[amount]],
          },
        });
      }
    }

    // Add new categories that don't exist yet
    const newBudgetRows: string[][] = [];
    for (const [category, amount] of Object.entries(budgets)) {
      if (!currentCategories.includes(category)) {
        newBudgetRows.push([category, `$${amount.toFixed(2)}`]);
      }
    }

    if (newBudgetRows.length > 0) {
      // Sanitize category names when appending new budget rows.
      const sanitizedNewBudgetRows = newBudgetRows.map((r) => [
        // r[0] is category, r[1] is amount string like "$xx.xx"
        /^[=+\-@]/.test(String(r[0])) ? `'${String(r[0])}` : r[0],
        r[1],
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Weekly Budget'!A:B",
        valueInputOption: "RAW",
        requestBody: {
          values: sanitizedNewBudgetRows,
        },
      });
    }
  } catch (error) {
    console.error("Error updating budgets in Google Sheets:", error);
    throw error;
  }
}
