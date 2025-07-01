import { Router } from "express";
import User from '../models/User';
import Referral from '../models/Referral';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import { connectDb } from '../utils/db';

// Helper function to generate unique transaction ID
function generateTransactionId() {
  return `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const router = Router();

// Calculate dynamic referral reward based on transaction amount
function calculateReferralReward(transactionAmount: number): number {
  // Base reward percentage
  const baseReward = 0.10; // 10% base reward
  
  // Additional rewards based on transaction amount
  if (transactionAmount >= 10000) return transactionAmount * 0.15; // 15% for large transactions
  if (transactionAmount >= 5000) return transactionAmount * 0.12; // 12% for medium transactions
  return transactionAmount * baseReward; // 10% for small transactions
}

// Get referral count for a user
router.get("/count/:phone", async (req, res) => {
  await connectDb();
  const count = await Referral.countDocuments({ referrer: req.params.phone });
  res.json({ count });
});

// Get all referrals (history) for a user
router.get("/history/:phone", async (req, res) => {
  await connectDb();
  const referrals = await Referral.find({ referrer: req.params.phone })
    .populate('transactionId', 'amount type status createdAt')
    .sort({ createdAt: -1 });
  res.json({ referrals });
});

// Get all users referred by a user (just phone numbers)
router.get("/list/:phone", async (req, res) => {
  await connectDb();
  const referrals = await Referral.find({ referrer: req.params.phone })
    .select('referred -_id')
    .sort({ createdAt: -1 });
  res.json({ referrals });
});

// Get total referral rewards for a user
router.get("/rewards/:phone", async (req, res) => {
  await connectDb();
  const rewards = await Referral.aggregate([
    { $match: { referrer: req.params.phone } },
    { $group: { _id: null, total: { $sum: "$reward" } } }
  ]);
  res.json({ totalReward: rewards[0]?.total || 0 });
});

// Get referral configuration (e.g., bonus amount)
router.get("/config", (req, res) => {
  // User should set REFERRAL_BONUS_AMOUNT in their .env file
  const bonusAmount = process.env.REFERRAL_BONUS_AMOUNT;
  if (bonusAmount && !isNaN(Number(bonusAmount))) {
    res.json({ referralBonusAmount: Number(bonusAmount) });
  } else {
    // Fallback or error if not set or invalid
    console.warn("REFERRAL_BONUS_AMOUNT not set or invalid in .env file. Using default of 0.");
    res.status(500).json({
        error: "Referral configuration not available.",
        message: "Administrator: Please set REFERRAL_BONUS_AMOUNT in the .env file.",
        referralBonusAmount: 0 // Default fallback
    });
  }
});

// Process referral reward when a transaction occurs
router.post("/process-reward", async (req, res) => {
  await connectDb();
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: "Transaction ID required" });

  try {
    // Get the transaction details
    const transaction = await Transaction?.findOne({ transactionId });
    if (!transaction || transaction.status !== TransactionStatus.COMPLETED) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    // Get the user who made the transaction
    const user = await User.findOne({ phone: transaction.phone });
    if (!user || !user.referrer) {
      return res.json({ success: false, message: "No referrer found" });
    }

    // Calculate referral reward
    const rewardAmount = calculateReferralReward(transaction.amount);

    // Create referral record
    const referral = new Referral({
      referrer: user.referrer,
      referred: transaction.phone,
      transactionId,
      reward: rewardAmount,
      status: TransactionStatus.COMPLETED
    });
    await referral.save();

    // Create reward transaction
    const rewardTransaction = new Transaction({
      phone: user.referrer,
      type: TransactionType.REFERRAL,
      amount: rewardAmount,
      transactionId: generateTransactionId(),
      description: `Referral reward for ${transaction.phone}'s purchase`,
      status: TransactionStatus.COMPLETED,
      relatedPhone: transaction.phone,
      metadata: { 
        referralId: referral._id,
        transactionId: transaction.transactionId
      }
    });
    await rewardTransaction.save();

    res.json({ 
      success: true, 
      referral,
      rewardTransaction
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process referral reward" });
  }
});

export default router;
