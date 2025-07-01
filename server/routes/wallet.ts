import { Router } from "express";
import Wallet from '../models/Wallet';
import Transaction, { TransactionType } from '../models/Transaction'; // Import Transaction model and type
import { connectDb } from '../utils/db';

const router = Router();

// Get wallet balance
router.get("/balance/:phone", async (req, res) => {
  await connectDb();
  const wallet = await Wallet.findOne({ phone: req.params.phone });
  res.json({ balance: wallet ? wallet.balance : 0 });
});

// Recharge wallet
router.post("/recharge", async (req, res) => {
  await connectDb();
  const { phone, amount } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: "Missing fields" });
  let wallet = await Wallet.findOne({ phone });
  if (!wallet) {
    wallet = new Wallet({ phone, balance: 0 });
    await wallet.save();
  }
  wallet.balance += Number(amount);
  await wallet.save();
  res.json({ success: true });
});

// Withdraw from wallet
router.post("/withdraw", async (req, res) => {
  await connectDb();
  const { phone, amount } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: "Missing fields" });
  let wallet = await Wallet.findOne({ phone });
  if (!wallet || wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
  wallet.balance -= Number(amount);
  await wallet.save();
  res.json({ success: true });
});

// Get wallet statistics for a user
router.get("/stats/:phone", async (req, res) => {
  try {
    await connectDb();
    const userPhone = req.params.phone;

    if (!userPhone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Using MongoDB Aggregation Framework for efficiency
    const stats = await Transaction.aggregate([
      { $match: { phone: userPhone } },
      {
        $group: {
          _id: "$phone", // Group by phone, though it's already matched
          totalRecharge: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.DEPOSIT] }, "$amount", 0],
            },
          },
          totalWithdrawals: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.WITHDRAWAL] }, "$amount", 0],
            },
          },
          totalSpentOnPlans: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.PURCHASE] }, "$amount", 0],
            },
          },
          // Add other stats if needed, e.g., total referral earnings
          totalReferralEarnings: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.REFERRAL] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    if (stats.length > 0) {
      // Remove the _id field from the response as it's just the phone number
      const { _id, ...resultStats } = stats[0];
      res.json(resultStats);
    } else {
      // No transactions found, return zero stats
      res.json({
        totalRecharge: 0,
        totalWithdrawals: 0,
        totalSpentOnPlans: 0,
        totalReferralEarnings: 0,
      });
    }
  } catch (error: any) {
    console.error("Error fetching wallet stats:", error);
    res.status(500).json({ error: "Failed to fetch wallet statistics", details: error.message });
  }
});

export default router;
