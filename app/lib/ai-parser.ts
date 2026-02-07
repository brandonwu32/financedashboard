import OpenAI from "openai";
import { Transaction } from "./google-sheets";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedTransactionData {
  transactions: Transaction[];
  confidence: number;
  warnings: string[];
}

export async function parseImageToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function parseTransactionsFromImage(
  imageBase64: string,
  creditCard?: string,
  cutoffDate?: string
): Promise<ParsedTransactionData> {
  try {
    const currentYear = new Date().getFullYear();
    const prompt = `You are an expert at parsing financial documents and bank statements. 
    
  Analyze this bank statement or transaction screenshot and extract all transactions. For each transaction, extract:
    - Date (in MM/DD/YYYY format)
- Description/Merchant name
- Amount (as a positive number)
- Category (choose from: Discretionary, Restaurant, Grocery, and default to discretionary if unclear)
- Credit Card (if provided or visible: ${creditCard || "not specified"})

${cutoffDate ? `Only include transactions from ${cutoffDate} onwards. If a year is not explicitly written assume it is for ${currentYear}` : ""}

Return the data as a JSON object with this structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "merchant name",
      "amount": 0.00,
      "category": "category",
      "creditCard": "card name",
      "status": "completed"
    }
  ],
  "confidence": 0.95,
  "warnings": ["any warnings or unclear entries"]
}

Be thorough and extract ALL transactions visible in the image. If amounts are unclear, note them in warnings.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("Invalid response from OpenAI");
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const parsedData = JSON.parse(jsonMatch[0]) as ParsedTransactionData;

    // Normalize dates to MM/DD/YYYY for consistent preview and downstream
    // behavior. Accept common incoming formats like YYYY-MM-DD or MM/DD/YYYY.
    const normalizeToMMDDYYYY = (d: string) => {
      if (!d) return '';
      const s = d.toString().trim();
      // If already MM/DD/YYYY or M/D/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return s;
      // YYYY-MM-DD
      const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymd) {
        const [, y, m, day] = ymd;
        return `${String(m).padStart(2,'0')}/${String(day).padStart(2,'0')}/${y}`;
      }
      // Try Date parse
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        const yyyy = String(parsed.getFullYear());
        return `${mm}/${dd}/${yyyy}`;
      }
      return s;
    };

    // Apply normalization
    parsedData.transactions = parsedData.transactions.map((t) => ({
      ...t,
      date: normalizeToMMDDYYYY(t.date),
    }));

    // Filter by cutoff date if provided (attempt to parse cutoffDate)
    if (cutoffDate) {
      const cutoff = new Date(cutoffDate);
      parsedData.transactions = parsedData.transactions.filter((t) => {
        const parts = t.date.split(/\D+/).filter(Boolean);
        let dt: Date;
        if (parts.length >= 3) {
          // MM DD YYYY
          const mm = Number(parts[0]);
          const dd = Number(parts[1]);
          const yy = Number(parts[2]);
          dt = new Date(yy, mm - 1, dd);
        } else {
          dt = new Date(t.date);
        }
        return dt >= cutoff;
      });
    }

    return parsedData;
  } catch (error) {
    console.error("Error parsing transactions with OpenAI:", error);
    throw error;
  }
}

export async function parseMultipleImages(
  files: File[],
  creditCard?: string,
  cutoffDate?: string
): Promise<ParsedTransactionData> {
  const allTransactions: Transaction[] = [];
  const allWarnings: string[] = [];
  let totalConfidence = 0;

  for (const file of files) {
    try {
      const base64 = await parseImageToBase64(file);
      const result = await parseTransactionsFromImage(
        base64,
        creditCard,
        cutoffDate
      );

      allTransactions.push(...result.transactions);
      allWarnings.push(...result.warnings);
      totalConfidence += result.confidence;
    } catch (error) {
      allWarnings.push(`Error processing ${file.name}: ${String(error)}`);
    }
  }

  // Remove duplicate transactions based on date, description, and amount
  const uniqueTransactions = Array.from(
    new Map(
      allTransactions.map((t) => [
        `${t.date}-${t.description}-${t.amount}`,
        t,
      ])
    ).values()
  );

  return {
    transactions: uniqueTransactions,
    confidence: files.length > 0 ? totalConfidence / files.length : 0,
    warnings: allWarnings,
  };
}
