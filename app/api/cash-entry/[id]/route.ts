import CashEntry from "@/lib/models/CashEntry";
import { connectMongoose } from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectMongoose();

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID manquant" },
        { status: 400 },
      );
    }

    const deleted = await CashEntry.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Entrée non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}