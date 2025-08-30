import CashEntry from "@/lib/models/CashEntry";
import { connectMongoose } from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await connectMongoose();

  try {
    const entries = await CashEntry.find({});
    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  await connectMongoose();

  try {
    const {
      _id,
      date,
      prestaB2B,
      depenses,
      especes,
      virement,
      cbClassique,
      cbSansContact,
    } = await request.json();

    const entry = await CashEntry.create({
      _id,
      date,
      prestaB2B,
      depenses,
      especes,
      virement,
      cbClassique,
      cbSansContact,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}