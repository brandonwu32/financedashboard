import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { getBudgets, updateBudgets, getRegistryEntry } from "@/app/lib/google-sheets";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await getRegistryEntry(session.user.email!);
    if (!entry || !entry.sheetId) {
      return NextResponse.json({ error: 'Not onboarded', onboarded: false }, { status: 403 });
    }

    const budgets = await getBudgets(entry.sheetId);

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
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

    const { budgets } = await request.json();

    if (!budgets || typeof budgets !== "object") {
      return NextResponse.json(
        { error: "Invalid budgets format" },
        { status: 400 }
      );
    }

    const entry = await getRegistryEntry(session.user.email!);
    if (!entry || !entry.sheetId) {
      return NextResponse.json({ error: 'Not onboarded', onboarded: false }, { status: 403 });
    }

    await updateBudgets(budgets, entry.sheetId);

    return NextResponse.json({ success: true, budgets });
  } catch (error) {
    console.error("Error updating budgets:", error);
    return NextResponse.json(
      { error: "Failed to update budgets" },
      { status: 500 }
    );
  }
}
