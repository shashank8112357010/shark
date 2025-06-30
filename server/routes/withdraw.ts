import { Router } from "express";
import { connectDb } from '../utils/db';
import Withdrawal from '../models/Withdrawal';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { TransactionType, TransactionStatus } from '../models/Transaction';

const router = Router();

// Helper function to check if withdrawal time is valid
function isWithdrawalTimeValid(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 0 && hour < 17; // 00:30 - 17:00
}

// Get withdrawal history
router.get("/:phone/history", async (req, res) => {
  await connectDb();
  try {
    const history = await Withdrawal.find({ phone: req.params.phone })
      .populate('transactionId', 'amount type status createdAt')
      .sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawal history" });
  }
});

// Get withdrawal limits and rules
router.get("/:phone/limits", async (req, res) => {
  await connectDb();
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayWithdrawals = await Withdrawal.find({
      phone: req.params.phone,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const dailyLimit = 50000; // 50,000 daily limit
    const dailyWithdrawn = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const remainingLimit = dailyLimit - dailyWithdrawn;

    res.json({
      dailyLimit,
      dailyWithdrawn,
      remainingLimit,
      minimumAmount: 1000, // Minimum withdrawal amount
      maximumAmount: dailyLimit,
      taxRate: 0.15, // 15% tax
      isTimeValid: isWithdrawalTimeValid(),
      timeWindow: {
        start: "00:30",
        end: "17:00"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawal limits" });
  }
});

// Process withdrawal request
router.post("/request", async (req, res) => {
  await connectDb();
  try {
    const { phone, amount, password } = req.body;

    // Validate time
    if (!isWithdrawalTimeValid()) {
      return res.status(400).json({
        error: "Withdrawal time window is 00:30 - 17:00",
        timeWindow: {
          start: "00:30",
          end: "17:00"
        }
      });
    }

    // Validate user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    if (!user.withdrawalPassword || !user.verifyPassword(password)) {
      return res.status(401).json({ error: "Invalid withdrawal password" });
    }

    // Check wallet balance
    const wallet = await Transaction.aggregate([
      { $match: { phone } },
      { $group: {
        _id: null,
        balance: { $sum: { $cond: [{ $eq: ["$type", TransactionType.DEPOSIT] }, "$amount", { $multiply: ["$amount", -1] }] } }
      }}
    ]);
    const balance = wallet[0]?.balance || 0;

    // Calculate tax and net amount
    const tax = amount * 0.15;
    const netAmount = amount - tax;

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      phone,
      type: TransactionType.WITHDRAWAL,
      amount,
      tax,
      netAmount,
      status: TransactionStatus.PENDING
    });
    await transaction.save();

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      phone,
      amount,
      tax,
      netAmount,
      transactionId: transaction._id,
      status: TransactionStatus.PENDING
    });
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      transactionId: transaction._id
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
