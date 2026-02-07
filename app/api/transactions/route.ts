import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { readTransactionsFromSheet, appendTransactionsToSheet, getRegistryEntry } from "@/app/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user's sheet from registry. If not onboarded, return guidance.
    const entry = await getRegistryEntry(session.user.email!);
    if (!entry || !entry.sheetId) {
      return NextResponse.json({ error: 'Not onboarded', onboarded: false }, { status: 403 });
    }

    const transactions = await readTransactionsFromSheet("'Spending'!A2:E", entry.sheetId);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid transactions data" },
        { status: 400 }
      );
    }

    const entry = await getRegistryEntry(session.user.email!);
    if (!entry || !entry.sheetId) {
      return NextResponse.json({ error: 'Not onboarded', onboarded: false }, { status: 403 });
    }

    await appendTransactionsToSheet(transactions, entry.sheetId);

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error("Error saving transactions:", error);
    return NextResponse.json(
      { error: "Failed to save transactions" },
      { status: 500 }
    );
  }
}
