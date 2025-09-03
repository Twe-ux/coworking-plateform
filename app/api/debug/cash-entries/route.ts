import CashEntry from "@/lib/models/CashEntry";
import { connectMongoose } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();

    // Get all cash entries
    const entries = await CashEntry.find().sort({ _id: 1 }).lean();
    
    // Filter August and September 2025
    const august2025 = entries.filter(e => e._id.startsWith('2025/08'));
    const september2025 = entries.filter(e => e._id.startsWith('2025/09'));
    
    return NextResponse.json({
      success: true,
      debug: {
        total: entries.length,
        allDates: entries.map(e => e._id),
        august2025: {
          count: august2025.length,
          dates: august2025.map(e => e._id),
          samples: august2025.slice(0, 2) // Premier couple d'entrées
        },
        september2025: {
          count: september2025.length,
          dates: september2025.map(e => e._id),
          samples: september2025.slice(0, 2)
        },
        lastEntry: entries.length > 0 ? entries[entries.length - 1] : null
      }
    });
  } catch (error: any) {
    console.error('Debug CashEntries API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}