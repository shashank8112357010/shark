import mongoose, { Document, Schema } from 'mongoose';

export interface ISharkInvestment extends Document {
  phone: string;
  shark: string;
  price: number;
  date: Date;
  transactionId: string;
  level: number;
}

const SharkInvestmentSchema = new Schema<ISharkInvestment>({
  phone: { type: String, required: true },
  shark: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  transactionId: { type: String, required: true },
  level: { type: Number, required: true },
});

export default mongoose.models.SharkInvestment || mongoose.model<ISharkInvestment>('SharkInvestment', SharkInvestmentSchema);
