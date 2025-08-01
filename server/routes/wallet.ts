import { Router } from "express";
import Transaction, { TransactionType } from '../models/Transaction'; // Import Transaction model and type
import RechargeRequest from '../models/RechargeRequest';
import { connectDb } from '../utils/db';
import { calculateUserBalance, checkSufficientBalance, calculateAvailableRecharge } from '../utils/balanceCalculator';

const router = Router();

// Get wallet balance using Transaction aggregation
router.get("/balance/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Main balance (for shark purchase)
    const nonRechargeBalance = await calculateUserBalance(phone);
    // Recharge balance (for info only)
    const rechargeBalance = await calculateAvailableRecharge(phone);
    res.json({ 
      balance: nonRechargeBalance,
      rechargeBalance,
      nonRechargeBalance
    });
  } catch (error: any) {
    console.error('Error calculating balance:', error);
    res.status(500).json({ error: 'Failed to calculate balance', details: error.message });
  }
});

// NOTE: Balance excludes recharge transactions as per business logic

// Submit recharge request
router.post("/recharge-request", async (req, res) => {
  try {
    await connectDb();
    const { phone, amount, utrNumber, qrCode, paymentScreenshot } = req.body;
    
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
      qrCode,
      paymentScreenshot: paymentScreenshot || null
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

// Recharge wallet (direct - for admin use) - creates transaction instead of modifying wallet
router.post("/recharge", async (req, res) => {
  try {
    await connectDb();
    const { phone, amount } = req.body;
    if (!phone || !amount) return res.status(400).json({ error: "Missing fields" });
    
    // Create deposit transaction
    const transactionId = `ADM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transaction = new Transaction({
      phone,
      type: TransactionType.DEPOSIT,
      amount: Number(amount),
      description: 'Direct admin recharge',
      status: 'completed',
      transactionId,
      metadata: { source: 'recharge' } // <-- Add this line
    });
    await transaction.save();
    
    res.json({ success: true, transactionId });
  } catch (error) {
    console.error('Direct recharge error:', error);
    res.status(500).json({ error: 'Failed to process recharge' });
  }
});

// Withdraw from wallet (creates withdrawal transaction)
router.post("/withdraw", async (req, res) => {
  try {
    await connectDb();
    const { phone, amount } = req.body;
    if (!phone || !amount) return res.status(400).json({ error: "Missing fields" });
    
    // Check current balance using consistent utility function
    const balanceCheck = await checkSufficientBalance(phone, Number(amount));
    if (!balanceCheck.hasBalance) {
      return res.status(400).json({ 
        error: "Insufficient balance",
        currentBalance: balanceCheck.currentBalance,
        requiredAmount: Number(amount)
      });
    }
    
    // Create withdrawal transaction
    const transactionId = `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transaction = new Transaction({
      phone,
      type: TransactionType.WITHDRAWAL,
      amount: Number(amount),
      description: 'Direct admin withdrawal',
      status: 'completed',
      transactionId
    });
    await transaction.save();
    
    res.json({ success: true, transactionId });
  } catch (error) {
    console.error('Direct withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get wallet statistics for a user
// FIXED: Now properly separates actual recharge from daily income to prevent incorrect calculations
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
              $cond: [
                { 
                  $and: [
                    { $eq: ["$type", TransactionType.DEPOSIT] },
                    { $or: [
                      { $eq: ["$metadata.source", "recharge"] },
                      { $eq: ["$metadata.incomeType", "recharge"] }
                    ]}
                  ]
                }, 
                "$amount", 
                0
              ],
            },
          },
          totalDailyIncome: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$type", TransactionType.DEPOSIT] },
                    { $eq: ["$metadata.incomeType", "daily_shark_income"] }
                  ]
                }, 
                "$amount", 
                0
              ],
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
      
      // Calculate available recharge (total recharge minus what was used in purchases)
      const availableRecharge = await calculateAvailableRecharge(userPhone);
      
      res.json({
        ...resultStats,
        availableRecharge: availableRecharge // Add available recharge balance
      });
    } else {
      // No transactions found, return zero stats
      res.json({
        totalRecharge: 0,
        totalDailyIncome: 0,
        totalWithdrawals: 0,
        totalSpentOnPlans: 0,
        totalReferralEarnings: 0,
        availableRecharge: 0,
      });
    }
  } catch (error: any) {
    console.error("Error fetching wallet stats:", error);
    res.status(500).json({ error: "Failed to fetch wallet statistics", details: error.message });
  }
});

// Get transactions for a user, filtered by type and source (for referral withdrawals, etc.)
router.get('/transactions', async (req, res) => {
  try {
    await connectDb();
    const { phone, type, source } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone is required' });
    }
    const query = { phone };
    if (type) query['type'] = type;
    if (source) query['metadata.source'] = source;
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

export default router;
