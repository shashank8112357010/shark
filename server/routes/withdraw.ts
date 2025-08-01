import { Router } from "express";
import { connectDb } from '../utils/db';
import Withdrawal from '../models/Withdrawal';
import User, { IUser } from '../models/User';
import Transaction from '../models/Transaction';
import { TransactionType, TransactionStatus } from '../models/Transaction';
import { BankDetails } from '../models/BankDetails';
import bcrypt from "bcryptjs";

const router = Router();

// Helper function to check if withdrawal time is valid (8 AM - 10 PM IST, Monday-Friday)
function isWithdrawalTimeValid(): boolean {
  const now = new Date();
  // Calculate IST time from UTC
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  const istMinute = (now.getUTCMinutes() + 30) % 60;
  // Calculate IST day (IST is ahead of UTC, so day may change)
  let istDay = now.getUTCDay();
  if (now.getUTCHours() + ((now.getUTCMinutes() + 30) / 60) >= 24) {
    istDay = (istDay + 1) % 7;
  }

  // Closed on Saturday (6) and Sunday (0)
  if (istDay === 0 || istDay === 6) return false;

  // Open from 8 AM to 10 PM (22:00) IST
  return istHour >= 8 && istHour < 22;
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
    const { phone, amount, password, accountDetails } = req.body;

    // TEMPORARY: Allow withdrawals at any time for testing
    // if (!isWithdrawalTimeValid()) {
    //   return res.status(400).json({
    //     error: "Withdrawals are only allowed Monday to Friday from 8:00 AM to 10:00 PM IST",
    //     timeWindow: {
    //       start: "8:00 AM",
    //       end: "10:00 PM"
    //     }
    //   });
    // }
    // REMEMBER TO RESTORE TIME CHECK AFTER TESTING

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

    // Validate account details
    if (!accountDetails || !accountDetails.id) {
      return res.status(400).json({ error: 'Please select a withdrawal account' });
    }
    
    // Verify the account belongs to the user
    const bankDetail = await BankDetails.findOne({ _id: accountDetails.id, phone });
    if (!bankDetail) {
      return res.status(400).json({ error: 'Invalid account selection' });
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

    // Build payout description for transaction
    let payoutDesc = bankDetail.name;
    if (bankDetail.type === 'upi') {
      payoutDesc += ` (UPI: ${bankDetail.details.upiId})`;
    } else if (bankDetail.type === 'bank') {
      payoutDesc += ` (Bank: ****${bankDetail.details.accountNumber?.slice(-4)})`;
    } else if (bankDetail.type === 'qr') {
      payoutDesc += ` (QR Code Payment)`;
    }

    // Create withdrawal transaction with unique transactionId
    const transactionId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transaction = new Transaction({
      phone,
      type: TransactionType.WITHDRAWAL,
      amount,
      status: TransactionStatus.COMPLETED, // Set status to completed for immediate balance deduction
      transactionId,
      description: `Withdrawal request to ${payoutDesc}`
    });
    await transaction.save();

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      phone,
      amount,
      tax,
      netAmount,
      transactionId: transaction._id,
      // Store the bank detail info for reference
      upiId: bankDetail.type === 'upi' ? bankDetail.details.upiId : undefined,
      bankAccount: bankDetail.type === 'bank' ? bankDetail.details.accountNumber : undefined,
      ifsc: bankDetail.type === 'bank' ? bankDetail.details.ifscCode : undefined,
      accountHolder: bankDetail.type === 'bank' ? bankDetail.details.accountHolderName : undefined,
      qrImage: bankDetail.type === 'qr' ? bankDetail.details.qrCodeUrl : undefined,
      // Store bank details metadata for admin visibility
      bankDetailsName: bankDetail.name,
      bankDetailsType: bankDetail.type
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
