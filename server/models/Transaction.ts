import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  PURCHASE = 'purchase',
  REFERRAL = 'referral',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ITransaction extends Document {
  phone: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  transactionId: string;
  description: string;
  qrCode?: string;
  relatedPhone?: string; // For referrals
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  phone: { type: String, required: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: Object.values(TransactionStatus), 
    default: TransactionStatus.PENDING 
  },
  transactionId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  qrCode: { type: String },
  relatedPhone: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
