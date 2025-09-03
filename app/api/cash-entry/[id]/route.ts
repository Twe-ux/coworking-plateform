import CashEntry from "@/lib/models/CashEntry";
import { connectMongoose } from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectMongoose();

  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    
    console.log('PUT CashEntry - Raw ID:', rawId);
    console.log('PUT CashEntry - Decoded ID:', id);
    
    const {
      date,
      prestaB2B,
      depenses,
      virement,
      especes,
      cbClassique,
      cbSansContact,
    } = await request.json();

    let processedPrestaB2B: Array<{ label: string; value: number }> = [];
    let processedDepenses: Array<{ label: string; value: number }> = [];

    if (Array.isArray(prestaB2B)) {
      processedPrestaB2B = prestaB2B.map((item) => {
        if (typeof item === "object" && item !== null) {
          return { label: item.label || "", value: item.value || 0 };
        }
        return { label: "", value: 0 };
      });
    }

    if (Array.isArray(depenses)) {
      processedDepenses = depenses.map((item) => {
        if (typeof item === "object" && item !== null) {
          return { label: item.label || "", value: item.value || 0 };
        }
        return { label: "", value: 0 };
      });
    }

    const updateData = {
      date,
      prestaB2B: processedPrestaB2B,
      depenses: processedDepenses,
      virement: Number(virement) || 0,
      especes: Number(especes) || 0,
      cbClassique: Number(cbClassique) || 0,
      cbSansContact: Number(cbSansContact) || 0,
    };

    const updatedEntry = await CashEntry.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEntry) {
      return NextResponse.json(
        { success: false, error: "Entrée non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updatedEntry });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectMongoose();

  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);

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