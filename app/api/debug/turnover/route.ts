import Turnover from "@/lib/models/Turnover";
import { connectMongoose } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();

    // Get all turnover documents
    const turnovers = await Turnover.find().sort({ _id: 1 }).lean();
    
    // Get September 2025 data specifically
    const september2025 = turnovers.filter(t => t._id.startsWith('2025-09'));
    
    // Get recent data (last 30 entries)
    const recentData = turnovers.slice(-30);
    
    return NextResponse.json({
      success: true,
      debug: {
        total: turnovers.length,
        allDates: turnovers.map(t => t._id),
        september2025: {
          count: september2025.length,
          dates: september2025.map(t => t._id),
          data: september2025
        },
        recentEntries: {
          count: recentData.length,
          dates: recentData.map(t => t._id)
        },
        lastEntry: turnovers.length > 0 ? turnovers[turnovers.length - 1] : null
      }
    });
  } catch (error: any) {
    console.error('Debug Turnover API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}