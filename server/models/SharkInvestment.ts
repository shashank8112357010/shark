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

// Ensure each user can buy each shark only once, but all users can buy the same shark
SharkInvestmentSchema.index({ phone: 1, shark: 1, level: 1 }, { unique: true });

export default mongoose.models.SharkInvestment || mongoose.model<ISharkInvestment>('SharkInvestment', SharkInvestmentSchema);
