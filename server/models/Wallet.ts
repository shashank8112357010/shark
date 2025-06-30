import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  phone: string;
  balance: number;
}

const WalletSchema = new Schema<IWallet>({
  phone: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
});

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
