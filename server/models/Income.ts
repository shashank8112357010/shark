import mongoose, { Document, Schema } from 'mongoose';

export interface IIncome extends Document {
  phone: string;
  date: Date;
  sharkTitle: string;
  sharkLevel: number;
  dailyIncomeAmount: number;
  sharkPurchaseId: string; // Reference to SharkInvestment
  transactionId: string; // Reference to income transaction
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>({
  phone: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  sharkTitle: { type: String, required: true },
  sharkLevel: { type: Number, required: true },
  dailyIncomeAmount: { type: Number, required: true },
  sharkPurchaseId: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index to prevent duplicate income for same user, shark, and date
IncomeSchema.index({ phone: 1, sharkPurchaseId: 1, date: 1 }, { unique: true });

// Index for efficient queries
IncomeSchema.index({ phone: 1, date: -1 });

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);
