import { Router } from "express";
import Wallet from '../models/Wallet';
import Transaction, { TransactionType } from '../models/Transaction'; // Import Transaction model and type
import RechargeRequest from '../models/RechargeRequest';
import { connectDb } from '../utils/db';

const router = Router();

// Get wallet balance
router.get("/balance/:phone", async (req, res) => {
  await connectDb();
  const wallet = await Wallet.findOne({ phone: req.params.phone });
  res.json({ balance: wallet ? wallet.balance : 0 });
});

// Submit recharge request
router.post("/recharge-request", async (req, res) => {
  try {
    await connectDb();
    const { phone, amount, utrNumber, qrCode } = req.body;
    
    if (!phone || !amount || !utrNumber || !qrCode) {
      return res.status(400).json({ 
        success: false, 
        error: "Phone, amount, UTR number and QR code are required" 
      });
    }

    // Check if UTR number already exists
    const existingRequest = await RechargeRequest.findOne({ utrNumber });
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        error: "UTR number already exists" 
      });
    }

    const rechargeRequest = new RechargeRequest({
      phone,
      amount: Number(amount),
      utrNumber,
      qrCode
    });

    await rechargeRequest.save();

    res.json({ 
      success: true, 
      message: "Recharge request submitted successfully. Please wait for admin approval.",
      requestId: rechargeRequest._id
    });
  } catch (error: any) {
    console.error('Recharge request error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to submit recharge request",
      details: error.message 
    });
  }
});

// Get recharge requests for a user
router.get("/recharge-requests/:phone", async (req, res) => {
  try {
    await connectDb();
    const { phone } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const rechargeRequests = await RechargeRequest.find({ phone })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await RechargeRequest.countDocuments({ phone });

    res.json({
      success: true,
      rechargeRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get recharge requests error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch recharge requests",
      details: error.message 
    });
  }
});

// Recharge wallet (direct - for admin use)
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
