import mongoose, { Document, Schema } from 'mongoose';

export interface IShark extends Document {
  title: string;
  image: string;
  price: number;
  totalReturn: number; // Renamed from 'total' for clarity
  dailyIncome: number; // Renamed from 'daily' for clarity
  durationDays: number; // Renamed from 'endDay' for clarity
  levelNumber: number; // To associate with a level
  // Any other specific fields for a shark plan
}

const SharkSchema = new Schema<IShark>({
  title: { type: String, required: true },
  image: { type: String, required: true }, // URL to the image
  price: { type: Number, required: true },
  totalReturn: { type: Number, required: true },
  dailyIncome: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  levelNumber: { type: Number, required: true, index: true },
}, { timestamps: true });

// Ensure unique title per level to avoid confusion, if necessary
// SharkSchema.index({ title: 1, levelNumber: 1 }, { unique: true });


export default mongoose.models.Shark || mongoose.model<IShark>('Shark', SharkSchema);
