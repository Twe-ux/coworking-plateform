import CashEntry from "@/lib/models/CashEntry";
import { connectMongoose } from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  await connectMongoose();

  try {
    const {
      id,
      date,
      prestaB2B,
      depenses,
      virement,
      especes,
      cbClassique,
      cbSansContact,
    } = await request.json();

    console.log('PUT CashEntry Update - ID:', id);
    console.log('PUT CashEntry Update - Full payload:', { 
      id, date, virement, especes, cbClassique, cbSansContact,
      prestaB2BLength: prestaB2B?.length,
      depensesLength: depenses?.length
    });

    // Vérifier si l'entrée existe avant de tenter la mise à jour
    const existingEntry = await CashEntry.findById(id);
    console.log('Existing entry found:', !!existingEntry);
    if (existingEntry) {
      console.log('Existing entry data:', existingEntry);
    }

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

    // Utiliser upsert: créer si n'existe pas, mettre à jour sinon
    const updatedEntry = await CashEntry.findByIdAndUpdate(
      id, 
      updateData, 
      {
        new: true,
        runValidators: true,
        upsert: true, // Créer si n'existe pas
        setDefaultsOnInsert: true
      }
    );

    console.log('CashEntry upserted successfully:', updatedEntry._id);

    return NextResponse.json({ success: true, data: updatedEntry });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}