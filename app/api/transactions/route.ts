import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { readTransactionsFromSheet, appendTransactionsToSheet } from "@/app/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await readTransactionsFromSheet();

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

    await appendTransactionsToSheet(transactions);

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error("Error saving transactions:", error);
    return NextResponse.json(
      { error: "Failed to save transactions" },
      { status: 500 }
    );
  }
}
