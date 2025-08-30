import mongoose, { Document, Schema } from "mongoose";

interface VATData {
  "total-ht": number;
  "total-ttc": number;
  "total-taxes": number;
}

export interface ITurnover extends Document {
  _id: string;
  "vat-20": VATData;
  "vat-10": VATData;
  "vat-55": VATData;
  "vat-0": VATData;
}

const TurnoverSchema = new Schema<ITurnover>({
  _id: { type: String, required: true },
  "vat-20": {
    "total-ht": { type: Number, required: true },
    "total-ttc": { type: Number, required: true },
    "total-taxes": { type: Number, required: true },
  },
  "vat-10": {
    "total-ht": { type: Number, required: true },
    "total-ttc": { type: Number, required: true },
    "total-taxes": { type: Number, required: true },
  },
  "vat-55": {
    "total-ht": { type: Number, required: true },
    "total-ttc": { type: Number, required: true },
    "total-taxes": { type: Number, required: true },
  },
  "vat-0": {
    "total-ht": { type: Number, required: true },
    "total-ttc": { type: Number, required: true },
    "total-taxes": { type: Number, required: true },
  },
});

if (mongoose.models.Turnover) {
  delete mongoose.models.Turnover;
}

export default mongoose.model<ITurnover>("Turnover", TurnoverSchema);