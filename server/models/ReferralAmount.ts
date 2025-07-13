import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralAmount extends Document {
  referrer: string; // phone number of the referrer
  referred: string; // phone number of the referred user
  referralTransactionId: string; // the transaction ID when referred user made purchase
  rewardAmount: number; // reward amount (₹1000)
  status: 'pending' | 'completed' | 'failed' | 'withdrawn';
  dateEarned: Date; // when the reward was earned (when referred user bought shark)
  referredPurchaseAmount: number; // amount of the purchase that triggered this reward
  rewardTransactionId?: string; // transaction ID for the reward payment
  withdrawalTransactionId?: string; // transaction ID when withdrawn to balance
  withdrawalDate?: Date; // when the amount was withdrawn to balance
}

const ReferralAmountSchema = new Schema<IReferralAmount>({
  referrer: { type: String, required: true },
  referred: { type: String, required: true },
  referralTransactionId: { type: String, required: true },
  rewardAmount: { type: Number, required: true, default: 300 },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'withdrawn'], 
    default: 'completed' 
  },
  dateEarned: { type: Date, default: Date.now },
  referredPurchaseAmount: { type: Number, required: true },
  rewardTransactionId: { type: String },
  withdrawalTransactionId: { type: String },
  withdrawalDate: { type: Date }
}, {
  timestamps: true
});

// Index for faster queries
ReferralAmountSchema.index({ referrer: 1 });
ReferralAmountSchema.index({ referred: 1 });
ReferralAmountSchema.index({ status: 1 });

export default mongoose.models.ReferralAmount || mongoose.model<IReferralAmount>('ReferralAmount', ReferralAmountSchema);
