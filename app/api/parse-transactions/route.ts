import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import {
  parseMultipleImages,
  parseImageToBase64,
} from "@/app/lib/ai-parser";
import { appendTransactionsToSheet } from "@/app/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const creditCard = (formData.get("creditCard") as string) || undefined;
    const cutoffDate = (formData.get("cutoffDate") as string) || undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Parse transactions from images
    const parsedData = await parseMultipleImages(files, creditCard, cutoffDate);

    // Append to Google Sheets if requested
    if (formData.get("saveToSheet") === "true") {
      try {
        await appendTransactionsToSheet(parsedData.transactions);
      } catch (error) {
        console.error("Error saving to sheet:", error);
      }
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error in parse API:", error);
    return NextResponse.json(
      { error: "Failed to parse transactions" },
      { status: 500 }
    );
  }
}
