import Turnover from "@/lib/models/Turnover";
import { connectMongoose } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoose();

    // Version simplifiée pour le déploiement - éviter l'agrégation complexe lors du build
    const turnovers = await Turnover.find().sort({ _id: 1 }).lean();

    // Traitement côté serveur au lieu d'agrégation MongoDB
    const processedData = turnovers.map(item => {
      const processItem = (doc: any) => {
        const vat20 = doc['vat-20'] || {};
        const vat10 = doc['vat-10'] || {};
        const vat55 = doc['vat-55'] || {};
        const vat0 = doc['vat-0'] || {};

        const TTC = Math.round(
          ((vat20['total-ttc'] || 0) + 
           (vat10['total-ttc'] || 0) + 
           (vat55['total-ttc'] || 0) + 
           (vat0['total-ttc'] || 0)) * 100
        ) / 100;

        const HT = Math.round(
          ((vat20['total-ht'] || 0) + 
           (vat10['total-ht'] || 0) + 
           (vat55['total-ht'] || 0) + 
           (vat0['total-ht'] || 0)) * 100
        ) / 100;

        const TVA = Math.round(
          ((vat20['total-taxes'] || 0) + 
           (vat10['total-taxes'] || 0) + 
           (vat55['total-taxes'] || 0) + 
           (vat0['total-taxes'] || 0)) * 100
        ) / 100;

        return {
          _id: doc._id,
          date: doc._id,
          TTC,
          HT,
          TVA,
          'ca-ttc': {
            20: vat20['total-ttc'] ? Math.round(vat20['total-ttc'] * 100) / 100 : null,
            10: vat10['total-ttc'] ? Math.round(vat10['total-ttc'] * 100) / 100 : null,
            '5,5': vat55['total-ttc'] ? Math.round(vat55['total-ttc'] * 100) / 100 : null,
            0: vat0['total-ttc'] ? Math.round(vat0['total-ttc'] * 100) / 100 : null,
          },
          'ca-ht': {
            20: vat20['total-ht'] ? Math.round(vat20['total-ht'] * 100) / 100 : null,
            10: vat10['total-ht'] ? Math.round(vat10['total-ht'] * 100) / 100 : null,
            '5,5': vat55['total-ht'] ? Math.round(vat55['total-ht'] * 100) / 100 : null,
            0: vat0['total-ht'] ? Math.round(vat0['total-ht'] * 100) / 100 : null,
          },
          'ca-tva': {
            20: vat20['total-taxes'] ? Math.round(vat20['total-taxes'] * 100) / 100 : null,
            10: vat10['total-taxes'] ? Math.round(vat10['total-taxes'] * 100) / 100 : null,
            '5,5': vat55['total-taxes'] ? Math.round(vat55['total-taxes'] * 100) / 100 : null,
            0: vat0['total-taxes'] ? Math.round(vat0['total-taxes'] * 100) / 100 : null,
          },
        };
      };

      return processItem(item);
    });

    return NextResponse.json(
      { success: true, data: processedData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Turnover API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}