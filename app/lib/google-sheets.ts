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

export async function readTransactionsFromSheet(
  range: string = "'Bi-weekly Spending Gusto'!A2:E"
) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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
          // Try M/D/YYYY format first (1/10/2026)
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              const month = String(parts[0]).padStart(2, "0");
              const day = String(parts[1]).padStart(2, "0");
              const year = parts[2];
              fullDate = `${year}-${month}-${day}`;
            }
          } else {
            // Try "Jan 10" format
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const parts = dateStr.trim().split(" ");
            const monthStr = parts[0];
            const monthIndex = monthNames.indexOf(monthStr);
            
            if (monthIndex !== -1) {
              const month = monthIndex + 1;
              const day = parseInt(parts[1], 10);
              const year = new Date().getFullYear();
              fullDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }
          }
        }
        
        if (!fullDate) {
          console.warn(`Could not parse date string: "${dateStr}"`);
        }


        return {
          date: fullDate,
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
  transactions: Transaction[]
) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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
      sanitizeCell(t.date), // Keep as date string, let Sheets parse it
      sanitizeCell(t.amount), // Send as number or sanitized value
      sanitizeCell(t.category),
      sanitizeCell(t.description),
      sanitizeCell(t.creditCard),
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'Bi-weekly Spending Gusto'!A:E",
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

export async function getSpreadsheetHeaders() {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Bi-weekly Spending Gusto'!A1:E1",
    });

    return response.data.values?.[0] || [];
  } catch (error) {
    console.error("Error getting headers:", error);
    throw error;
  }
}

export async function getBudgets(): Promise<Record<string, number>> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "budget!A2:B",
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

export async function updateBudgets(budgets: Record<string, number>): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Get current budgets to find which ones to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "budget!A2:B",
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
          range: `budget!B${rowNum}`,
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
        range: "budget!A:B",
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
