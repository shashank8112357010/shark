import { Router } from "express";
import { connectDb } from '../utils/db';
import Withdrawal from '../models/Withdrawal';
import User, { IUser } from '../models/User';
import Transaction from '../models/Transaction';
import { TransactionType, TransactionStatus } from '../models/Transaction';
import bcrypt from "bcryptjs";

const router = Router();

// Helper function to check if withdrawal time is valid (8 AM - 10 PM IST, Monday-Friday)
function isWithdrawalTimeValid(): boolean {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  const hour = istTime.getHours();
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Closed on Saturday and Sunday
  if (day === 0 || day === 6) return false;
  
  // Open from 8 AM to 10 PM (22:00) IST
  return hour >= 8 && hour < 22;
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
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
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

    const dailyLimit = 5000; // 5,000 daily limit
    const dailyWithdrawn = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const remainingLimit = dailyLimit - dailyWithdrawn;

    res.json({
      dailyLimit,
      dailyWithdrawn,
      remainingLimit,
      minimumAmount: 100, // Minimum withdrawal amount set to 100
      maximumAmount: dailyLimit,
      taxRate: 0.15, // 15% tax
      isTimeValid: isWithdrawalTimeValid(),
      timeWindow: {
        start: "8:00 AM",
        end: "10:00 PM"
      },
      savedUpiId: user.upiId || null // Include saved UPI ID
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawal limits" });
  }
});

// Process withdrawal request
router.post("/request", async (req, res) => {
  await connectDb();
  try {
    const { phone, amount, password, upiId } = req.body;

    // Validate time
    if (!isWithdrawalTimeValid()) {
      return res.status(400).json({
        error: "Withdrawals are only allowed Monday to Friday from 8:00 AM to 10:00 PM IST",
        timeWindow: {
          start: "8:00 AM",
          end: "10:00 PM"
        }
      });
    }

    // Validate user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password (async bcrypt)
    const isValid = await bcrypt.compare(password, user.withdrawalPassword);
    if (!user.withdrawalPassword || !isValid) {
      return res.status(401).json({ error: "Invalid withdrawal password" });
    }

    // Validate UPI ID
    if (!upiId || typeof upiId !== 'string' || upiId.length < 5) {
      return res.status(400).json({ error: 'Valid UPI ID is required' });
    }

    // Check wallet balance using Transaction aggregation
    const balanceResult = await Transaction.aggregate([
       { $match: { phone, status: TransactionStatus.COMPLETED } }, // Only count completed transactions
       { $group: {
         _id: null,
         balance: { 
           $sum: { 
             $switch: {
               branches: [
                 { case: { $eq: ["$type", TransactionType.DEPOSIT] }, then: "$amount" },
                 { case: { $eq: ["$type", TransactionType.REFERRAL] }, then: "$amount" },
                 { case: { $eq: ["$type", TransactionType.WITHDRAWAL] }, then: { $multiply: ["$amount", -1] } },
                 { case: { $eq: ["$type", TransactionType.PURCHASE] }, then: { $multiply: ["$amount", -1] } }
               ],
               default: 0
             }
           }
         }
       }}
     ]);

    const balance = balanceResult[0]?.balance || 0;
    console.log('Balance calculation result:', balanceResult);
    console.log('Current balance:', balance);
    console.log('Withdrawal amount requested:', amount);

    // Calculate tax and net amount
    const tax = amount * 0.15;
    const netAmount = amount - tax;

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create withdrawal transaction with unique transactionId
    const transactionId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transaction = new Transaction({
      phone,
      type: TransactionType.WITHDRAWAL,
      amount,
      transactionId,
      description: `Withdrawal request to UPI: ${upiId}`
    });
    await transaction.save();

    // Save UPI ID to user profile for future use
    if (upiId && upiId !== user.upiId) {
      user.upiId = upiId;
      await user.save();
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      phone,
      amount,
      tax,
      netAmount,
      transactionId: transaction._id,

      upiId
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
