import { Router } from "express";
import ReferralAmount from '../models/ReferralAmount';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import { connectDb } from '../utils/db';

const router = Router();

// Get referral amount stats for a user
router.get("/stats/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Get total referral earnings from new system (only non-withdrawn amounts)
    const totalStats = await ReferralAmount.aggregate([
      { $match: { referrer: phone, status: 'completed' } },
      { 
        $group: { 
          _id: null, 
          totalEarned: { $sum: "$rewardAmount" },
          totalReferrals: { $sum: 1 }
        } 
      }
    ]);
    
    // Get all-time stats (including withdrawn)
    const allTimeStats = await ReferralAmount.aggregate([
      { $match: { referrer: phone, status: { $in: ['completed', 'withdrawn'] } } },
      { 
        $group: { 
          _id: null, 
          allTimeEarned: { $sum: "$rewardAmount" },
          allTimeReferrals: { $sum: 1 }
        } 
      }
    ]);
    
    const stats = totalStats[0] || { totalEarned: 0, totalReferrals: 0 };
    const allTime = allTimeStats[0] || { allTimeEarned: 0, allTimeReferrals: 0 };
    
    res.json({
      success: true,
      totalEarned: stats.totalEarned, // Available for withdrawal
      totalReferrals: stats.totalReferrals, // Current available
      allTimeEarned: allTime.allTimeEarned, // Total ever earned
      allTimeReferrals: allTime.allTimeReferrals, // Total ever made
      perReferralAmount: 300 // Fixed amount per referral
    });
  } catch (error: any) {
    console.error('Error fetching referral amount stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch referral amount stats',
      details: error.message 
    });
  }
});

// Get referral amount history for a user
router.get("/history/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Get detailed referral history
    const referralHistory = await ReferralAmount.find({ 
      referrer: phone 
    })
    .sort({ dateEarned: -1 })
    .limit(50); // Limit to last 50 records
    
    res.json({
      success: true,
      referralHistory,
      totalCount: referralHistory.length
    });
  } catch (error: any) {
    console.error('Error fetching referral amount history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch referral amount history',
      details: error.message 
    });
  }
});

// Get referral amount details for a specific referral
router.get("/details/:referrer/:referred", async (req, res) => {
  try {
    await connectDb();
    const { referrer, referred } = req.params;
    
    const referralDetails = await ReferralAmount.findOne({
      referrer,
      referred
    });
    
    if (!referralDetails) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }
    
    res.json({
      success: true,
      referralDetails
    });
  } catch (error: any) {
    console.error('Error fetching referral amount details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch referral amount details',
      details: error.message 
    });
  }
});

// Get users referred by a user who have made purchases
router.get("/successful-referrals/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Get all users referred by this user who have made purchases
    const successfulReferrals = await ReferralAmount.find({
      referrer: phone,
      status: 'completed'
    })
    .sort({ dateEarned: -1 })
    .select('referred referredPurchaseAmount rewardAmount dateEarned');
    
    res.json({
      success: true,
      successfulReferrals,
      totalCount: successfulReferrals.length
    });
  } catch (error: any) {
    console.error('Error fetching successful referrals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch successful referrals',
      details: error.message 
    });
  }
});

// Helper function to generate unique transaction ID
function generateTransactionId() {
  return `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Move referral amount to main balance with tax deduction
router.post("/withdraw-to-balance", async (req, res) => {
  try {
    await connectDb();
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    // Get total referral earnings
    const totalStats = await ReferralAmount.aggregate([
      { $match: { referrer: phone, status: 'completed' } },
      { 
        $group: { 
          _id: null, 
          totalEarned: { $sum: "$rewardAmount" }
        } 
      }
    ]);
    
    const totalReferralAmount = totalStats[0]?.totalEarned || 0;
    
    // Check minimum withdrawal amount
    if (totalReferralAmount < 1000) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal amount is ₹1000. Your current referral balance is ₹${totalReferralAmount}`,
        currentAmount: totalReferralAmount,
        minimumRequired: 1000
      });
    }
    
    // Calculate tax and final amount
    let finalAmount = totalReferralAmount;
    let taxAmount = 0;
    let taxRate = 0;
    
    if (totalReferralAmount < 5000) {
      // Apply 30% tax if amount is less than ₹5000
      taxRate = 0.30;
      taxAmount = totalReferralAmount * taxRate;
      finalAmount = totalReferralAmount - taxAmount;
    }
    // If amount >= 5000, no tax is applied
    
    // Create deposit transaction for the final amount
    const depositTransactionId = generateTransactionId();
    const depositTransaction = new Transaction({
      phone,
      type: TransactionType.DEPOSIT,
      amount: finalAmount,
      transactionId: depositTransactionId,
      description: `Referral earnings transferred to balance${taxAmount > 0 ? ` (Tax: ₹${taxAmount.toFixed(2)})` : ''}`,
      status: TransactionStatus.COMPLETED,
      metadata: {
        source: 'referral_withdrawal',
        originalAmount: totalReferralAmount,
        taxAmount: taxAmount,
        taxRate: taxRate * 100,
        finalAmount: finalAmount
      }
    });
    await depositTransaction.save();
    
    // Create withdrawal record transaction for tracking
    const withdrawalTransactionId = generateTransactionId();
    const withdrawalTransaction = new Transaction({
      phone,
      type: TransactionType.WITHDRAWAL,
      amount: totalReferralAmount,
      transactionId: withdrawalTransactionId,
      description: `Referral earnings withdrawal (Transferred to balance)`,
      status: TransactionStatus.COMPLETED,
      metadata: {
        withdrawalType: 'referral_to_balance',
        depositTransactionId: depositTransactionId,
        taxApplied: taxAmount > 0
      }
    });
    await withdrawalTransaction.save();
    
    // Mark all referral amounts as withdrawn
    await ReferralAmount.updateMany(
      { referrer: phone, status: 'completed' },
      { 
        $set: { 
          status: 'withdrawn',
          withdrawalTransactionId: withdrawalTransactionId,
          withdrawalDate: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Referral earnings successfully transferred to balance',
      details: {
        originalAmount: totalReferralAmount,
        taxAmount: taxAmount,
        taxRate: taxRate * 100,
        finalAmount: finalAmount,
        depositTransactionId: depositTransactionId,
        withdrawalTransactionId: withdrawalTransactionId
      }
    });
    
  } catch (error: any) {
    console.error('Error processing referral withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process referral withdrawal',
      details: error.message 
    });
  }
});

export default router;
