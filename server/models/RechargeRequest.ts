import mongoose, { Document, Schema } from 'mongoose';

export interface IRechargeRequest extends Document {
  phone: string;
  amount: number;
  utrNumber: string;
  qrCode: string;
  paymentScreenshot?: string; // Base64 encoded image or file path
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RechargeRequestSchema = new Schema<IRechargeRequest>({
  phone: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  utrNumber: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true },
  paymentScreenshot: { type: String }, // Base64 encoded image or file path
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvedAmount: { type: Number, min: 1 }, // Amount approved by admin (may differ from requested amount)
  adminNotes: { type: String },
  reviewedBy: { type: String }, // Admin email who reviewed
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for better query performance
RechargeRequestSchema.index({ phone: 1, status: 1 });
RechargeRequestSchema.index({ utrNumber: 1 });
RechargeRequestSchema.index({ createdAt: -1 });

export default mongoose.models.RechargeRequest || mongoose.model<IRechargeRequest>('RechargeRequest', RechargeRequestSchema);
