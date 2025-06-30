import mongoose, { Document, Schema } from 'mongoose';

export interface ISharkInvestment extends Document {
  phone: string;
  shark: string;
  price: number;
  date: Date;
}

const SharkInvestmentSchema = new Schema<ISharkInvestment>({
  phone: { type: String, required: true },
  shark: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.SharkInvestment || mongoose.model<ISharkInvestment>('SharkInvestment', SharkInvestmentSchema);
