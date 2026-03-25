import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { readTransactionsFromSheet, appendTransactionsToSheet, getRegistryEntry, updateTransactionReimbursableFlag } from "@/app/lib/google-sheets";
import { Transaction } from "@/app/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transaction } = body;

    if (!transaction) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const entry = await getRegistryEntry(session.user.email!);
    if (!entry || !entry.sheetId) {
      return NextResponse.json({ error: 'Not onboarded', onboarded: false }, { status: 403 });
    }

    // Update original transaction's reimbursable flag to false
    const updateResult = await updateTransactionReimbursableFlag(
      transaction,
      false,
      entry.sheetId
    );

    if (!updateResult.updated) {
      // Still append the reimbursement transaction even if update failed
      console.warn("Original transaction update failed, but proceeding with reimbursement");
    }

    // Create and append the negative reimbursement transaction
    const reimbursementTransaction: Transaction = {
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      description: `Reimbursement: ${transaction.description}`,
      amount: -transaction.amount,
      category: transaction.category,
      creditCard: transaction.creditCard,
      status: "reimbursed",
      notes: `Reimbursement for transaction on ${transaction.date}`,
      reimbursable: false,
    };

    await appendTransactionsToSheet([reimbursementTransaction], entry.sheetId);

    return NextResponse.json({ 
      success: true, 
      originalUpdated: updateResult.updated,
      reimbursementRecorded: true 
    });
  } catch (error) {
    console.error("Error recording reimbursement:", error);
    return NextResponse.json(
      { error: "Failed to record reimbursement" },
      { status: 500 }
    );
  }
}
