import mongoose from "mongoose";
import Transaction from "./Transaction";

const withdrawalSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
    default: "PENDING",
  },
  adminNotes: {
    type: String,
  },
  reviewedBy: {
    type: String, // Admin email who reviewed
  },
  reviewedAt: {
    type: Date,
  },
  paymentProof: {
    type: String, // URL or base64 of payment screenshot
  },
  paymentUtr: {
    type: String, // UTR number for payment
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

withdrawalSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
