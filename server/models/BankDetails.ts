import mongoose from 'mongoose';

interface IBankDetails {
  phone: string;
  type: 'upi' | 'bank' | 'qr';
  name: string;
  details: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    qrCodeUrl?: string;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new mongoose.Schema<IBankDetails>({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['upi', 'bank', 'qr'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  details: {
    upiId: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    qrCodeUrl: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Ensure only one default per user
bankDetailsSchema.index({ phone: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

export const BankDetails = mongoose.models.BankDetails || mongoose.model<IBankDetails>('BankDetails', bankDetailsSchema);
export type { IBankDetails };
