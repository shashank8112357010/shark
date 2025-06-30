import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrer: string; // phone number of the referrer
  referred: string; // phone number of the referred user
  reward: number;   // reward given for this referral (if any)
  date: Date;
}

const ReferralSchema = new Schema<IReferral>({
  referrer: { type: String, required: true },
  referred: { type: String, required: true },
  reward: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
