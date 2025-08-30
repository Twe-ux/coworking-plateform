import mongoose, { Document, Schema } from "mongoose";

interface CashEntryItem {
  label: string;
  value: number;
}

export interface ICashEntry extends Document {
  _id: string;
  prestaB2B?: CashEntryItem[];
  depenses?: CashEntryItem[];
  virement?: number;
  especes?: number;
  cbClassique?: number;
  cbSansContact?: number;
}

const CashEntrySchema = new Schema<ICashEntry>({
  _id: {
    type: String,
    match: /^\d{4}\/\d{2}\/\d{2}$/,
    required: true,
  },
  prestaB2B: {
    type: [
      {
        label: { type: String },
        value: { type: Number },
      },
    ],
    default: undefined,
    required: false,
  },
  depenses: {
    type: [
      {
        label: { type: String },
        value: { type: Number },
      },
    ],
    default: undefined,
    required: false,
  },
  virement: { type: Number, required: false, default: 0 },
  especes: { type: Number, required: false, default: 0 },
  cbClassique: { type: Number, required: false, default: 0 },
  cbSansContact: { type: Number, required: false, default: 0 },
});

if (mongoose.models.CashEntry) {
  delete mongoose.models.CashEntry;
}

export default mongoose.model<ICashEntry>("CashEntry", CashEntrySchema);