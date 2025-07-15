import express from 'express';
import Admin from '../models/Admin';
import User from '../models/User';
import RechargeRequest from '../models/RechargeRequest';
import Withdrawal from '../models/Withdrawal';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import { connectDb } from '../utils/db';
import { calculateAvailableRecharge } from '../utils/balanceCalculator';
import jwt from 'jsonwebtoken';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

import SharkModel from '../models/Shark';
// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const admin = await (Admin as any).findById(decoded.adminId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid token or admin not active.' });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token.' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    await connectDb();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const admin = await (Admin as any).findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, error: 'Account is disabled' });
    }

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();

    const totalUsers = await (User as any).countDocuments();
    const totalRechargeRequests = await (RechargeRequest as any).countDocuments();
    const pendingRecharges = await (RechargeRequest as any).countDocuments({ status: 'pending' });
    const approvedRecharges = await (RechargeRequest as any).countDocuments({ status: 'approved' });
    const rejectedRecharges = await (RechargeRequest as any).countDocuments({ status: 'rejected' });
    
    const totalWithdrawals = await (Withdrawal as any).countDocuments();
    const pendingWithdrawals = await (Withdrawal as any).countDocuments({ status: 'PENDING' });
    const approvedWithdrawals = await (Withdrawal as any).countDocuments({ status: 'APPROVED' });
    const completedWithdrawals = await (Withdrawal as any).countDocuments({ status: 'COMPLETED' });

    // Calculate total wallet balances using Transaction aggregation
    let walletStats;
    try {
      const [rechargeStats, withdrawalStats, referralStats] = await Promise.all([
        (Transaction as any).aggregate([
          { $match: { type: TransactionType.DEPOSIT, 'metadata.source': 'recharge', status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        (Transaction as any).aggregate([
          { $match: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        (Transaction as any).aggregate([
          { $match: { type: TransactionType.REFERRAL, status: TransactionStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const totalRecharge = rechargeStats[0]?.total || 0;
      const totalWithdrawal = withdrawalStats[0]?.total || 0;
      const totalReferral = referralStats[0]?.total || 0;
      const profit = totalRecharge - totalWithdrawal - totalReferral;

      walletStats = [{
        totalRecharge,
        totalWithdrawal,
        totalReferral,
        profit
      }];
    } catch (transactionError) {
      console.warn('Transaction aggregation failed:', transactionError);
      walletStats = [];
    }

    // Get recent activity
    const recentRecharges = await (RechargeRequest as any).find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('phone amount utrNumber status createdAt');

    const recentWithdrawals = await (Withdrawal as any).find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('phone amount status createdAt');

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
        },
        recharges: {
          total: totalRechargeRequests,
          pending: pendingRecharges,
          approved: approvedRecharges,
          rejected: rejectedRecharges
        },
        withdrawals: {
          total: totalWithdrawals,
          pending: pendingWithdrawals,
          approved: approvedWithdrawals,
          completed: completedWithdrawals
        },
        wallets: walletStats[0],
        recent: {
          recharges: recentRecharges,
          withdrawals: recentWithdrawals
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all recharge requests
router.get('/recharge-requests', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const rechargeRequests = await (RechargeRequest as any).find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await (RechargeRequest as any).countDocuments(filter);

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
  } catch (error) {
    console.error('Get recharge requests error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Review recharge request
router.post('/recharge-requests/:id/review', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { id } = req.params;
    const { status, adminNotes, approvedAmount } = req.body;
    const admin = (req as any).admin;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status === 'approved' && (!approvedAmount || approvedAmount <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid approved amount is required for approval' });
    }

    const rechargeRequest = await (RechargeRequest as any).findById(id);
    if (!rechargeRequest) {
      return res.status(404).json({ success: false, error: 'Recharge request not found' });
    }

    if (rechargeRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request already reviewed' });
    }

    rechargeRequest.status = status;
    rechargeRequest.adminNotes = adminNotes;
    rechargeRequest.reviewedBy = admin.email;
    rechargeRequest.reviewedAt = new Date();

    // Store approved amount if different from requested amount
    if (status === 'approved' && approvedAmount !== rechargeRequest.amount) {
      rechargeRequest.approvedAmount = approvedAmount;
    }

    await rechargeRequest.save();

    // If approved, create transaction record (balance is calculated from transactions)
    if (status === 'approved') {
      const amountToAdd = approvedAmount || rechargeRequest.amount;
      
      // Create transaction record

      // Generate a unique transactionId (e.g., using timestamp and random string)
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const transaction = new (Transaction as any)({
        phone: rechargeRequest.phone,
        type: 'deposit', // lowercase to match enum
        amount: amountToAdd,
        description: `Recharge approved by ${admin.email}`,
        status: 'completed', // lowercase to match enum
        transactionId, // required unique field
        metadata: {
          source: 'recharge', // <-- Add this line
          rechargeRequestId: rechargeRequest._id,
          utrNumber: rechargeRequest.utrNumber
        }
      });
      await transaction.save();
    }

    res.json({
      success: true,
      message: `Recharge request ${status}${status === 'approved' ? ` with ₹${approvedAmount || rechargeRequest.amount}` : ''}`,
      rechargeRequest
    });
  } catch (error) {
    console.error('Review recharge request error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all withdrawal requests
router.get('/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      filter.status = status;
    }

    const withdrawals = await (Withdrawal as any).find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('phone amount tax netAmount status adminNotes reviewedBy reviewedAt paymentUtr upiId bankAccount ifsc accountHolder qrImage createdAt updatedAt');

    const total = await (Withdrawal as any).countDocuments(filter);

    res.json({
      success: true,
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Approve withdrawal with payment proof
router.post('/withdrawals/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { id } = req.params;
    const {  paymentUtr, adminNotes } = req.body;
    const admin = (req as any).admin;

    if (!paymentUtr) {
      return res.status(400).json({ success: false, error: 'Payment UTR is required' });
    }

    const withdrawal = await (Withdrawal as any).findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Withdrawal already processed' });
    }

    withdrawal.status = 'COMPLETED';
    withdrawal.paymentProof = "";
    withdrawal.paymentUtr = paymentUtr;
    withdrawal.adminNotes = adminNotes;
    withdrawal.reviewedBy = admin.email;
    withdrawal.reviewedAt = new Date();

    await withdrawal.save();
    
    // Update the associated transaction status to completed
    const originalTransaction = await (Transaction as any).findById(withdrawal.transactionId);
    if (originalTransaction) {
      originalTransaction.status = TransactionStatus.COMPLETED;
      await originalTransaction.save();
    }

    res.json({
      success: true,
      message: 'Withdrawal approved and completed',
      withdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { id } = req.params;
    const { adminNotes } = req.body;
    const admin = (req as any).admin;

    const withdrawal = await (Withdrawal as any).findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Withdrawal already processed' });
    }

    withdrawal.status = 'REJECTED';
    withdrawal.adminNotes = adminNotes;
    withdrawal.reviewedBy = admin.email;
    withdrawal.reviewedAt = new Date();

    await withdrawal.save();

    // Refund the amount back to user's balance using Transaction model
    
    // Create refund transaction
    // const refundTransactionId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    // const refundTransaction = new (Transaction as any)({
    //   phone: withdrawal.phone,
    //   type: TransactionType.DEPOSIT,
    //   amount: withdrawal.amount,
    //   status: TransactionStatus.COMPLETED,
    //   transactionId: refundTransactionId,
    //   description: `Withdrawal refund for rejected request by ${admin.email}`
    // });
    // await refundTransaction.save();
    
    // Also update the original withdrawal transaction status
    const originalTransaction = await (Transaction as any).findById(withdrawal.transactionId);
    if (originalTransaction) {
      originalTransaction.status = TransactionStatus.FAILED;
      await originalTransaction.save();
    }

    res.json({
      success: true,
      message: 'Withdrawal rejected and amount refunded',
      withdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const users = await (User as any).find()
      .select('-password -withdrawalPassword')
      .sort({ created: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await (User as any).countDocuments();

    // Get wallet balances for each user using transaction aggregation
    
    const usersWithWallets = await Promise.all(
      users.map(async (user) => {
        // Calculate balance using Transaction aggregation
        const balanceResult = await (Transaction as any).aggregate([
          { $match: { phone: user.phone, status: { $ne: 'failed' } } },
          { $group: {
            _id: null,
            balance: { 
              $sum: { 
                $switch: {
                  branches: [
                    // Only include DEPOSITs that are NOT recharge
                    {
                      case: {
                        $and: [
                          { $eq: ["$type", TransactionType.DEPOSIT] },
                          {
                            $not: {
                              $or: [
                                { $eq: ["$metadata.source", "recharge"] },
                                { $eq: ["$metadata.incomeType", "recharge"] }
                              ]
                            }
                          }
                        ]
                      },
                      then: "$amount"
                    },
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
        return {
          ...user.toObject(),
          walletBalance: balance
        };
      })
    );

    res.json({
      success: true,
      users: usersWithWallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all sharks for management
router.get('/sharks', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    
    
    const sharks = await (SharkModel as any).find().sort({ levelNumber: 1, price: 1 });
    
    // Group by levels
    const levelMap = new Map();
    sharks.forEach(shark => {
      const level = shark.levelNumber;
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }
      levelMap.get(level).push({
        id: shark._id.toString(),
        title: shark.title,
        image: shark.image,
        price: shark.price,
        totalReturn: shark.totalReturn,
        dailyIncome: shark.dailyIncome,
        durationDays: shark.durationDays,
        isLocked: shark.isLocked,
        levelNumber: shark.levelNumber
      });
    });
    
    const levels = Array.from(levelMap.entries()).map(([levelNumber, sharks]) => ({
      level: levelNumber,
      sharks: sharks
    })).sort((a, b) => a.level - b.level);
    
    res.json({
      success: true,
      levels
    });
  } catch (error) {
    console.error('Get sharks error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get only the QR image for a withdrawal by ID
router.get('/withdrawals/:id/qr', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { id } = req.params;
    const withdrawal = await Withdrawal.findById(id).select('qrImage');
    if (!withdrawal) {
      return res.status(404).json({ qrImage: null, error: 'Withdrawal not found' });
    }
    res.json({ qrImage: withdrawal.qrImage || null });
  } catch (error) {
    console.error('Get QR image error:', error);
    res.status(500).json({ qrImage: null, error: 'Server error' });
  }
});

// Update shark lock status
router.patch('/sharks/:id/lock-status', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { id } = req.params;
    const { isLocked } = req.body;
    const admin = (req as any).admin;
    
    if (typeof isLocked !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isLocked must be a boolean' });
    }
    
    
    const shark = await (SharkModel as any).findById(id);
    
    if (!shark) {
      return res.status(404).json({ success: false, error: 'Shark not found' });
    }
    
    shark.isLocked = isLocked;
    await shark.save();
    
    console.log(`Admin ${admin.email} ${isLocked ? 'locked' : 'unlocked'} shark: ${shark.title}`);
    
    res.json({
      success: true,
      message: `Shark ${isLocked ? 'locked' : 'unlocked'} successfully`,
      shark: {
        id: shark._id.toString(),
        title: shark.title,
        isLocked: shark.isLocked,
        levelNumber: shark.levelNumber
      }
    });
  } catch (error) {
    console.error('Update shark lock status error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Bulk update sharks in a level
router.patch('/sharks/level/:levelNumber/lock-status', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { levelNumber } = req.params;
    const { isLocked } = req.body;
    const admin = (req as any).admin;
    
    if (typeof isLocked !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isLocked must be a boolean' });
    }
    
    
    const result = await (SharkModel as any).updateMany(
      { levelNumber: parseInt(levelNumber) },
      { $set: { isLocked: isLocked } }
    );
    
    console.log(`Admin ${admin.email} ${isLocked ? 'locked' : 'unlocked'} all sharks in level ${levelNumber}`);
    
    res.json({
      success: true,
      message: `All sharks in Level ${levelNumber} ${isLocked ? 'locked' : 'unlocked'} successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update sharks error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Debug user balance - for troubleshooting balance issues
router.get('/debug/balance/:phone', authenticateAdmin, async (req, res) => {
  try {
    await connectDb();
    const { phone } = req.params;
    
    // Get all transactions for this user
    const allTransactions = await (Transaction as any).find({ phone }).sort({ createdAt: -1 });
    
    // Get recharge deposits
    const rechargeDeposits = await (Transaction as any).find({ 
      phone, 
      status: TransactionStatus.COMPLETED, 
      type: TransactionType.DEPOSIT,
      'metadata.source': 'recharge' 
    });
    
    let totalRechargeDeposits = 0;
    rechargeDeposits.forEach(tx => {
      totalRechargeDeposits += tx.amount;
    });
    
    // Get purchases with fromRecharge
    const purchases = await (Transaction as any).find({ 
      phone, 
      status: TransactionStatus.COMPLETED, 
      type: TransactionType.PURCHASE,
      'metadata.fromRecharge': { $exists: true }
    });
    
    let totalFromRecharge = 0;
    purchases.forEach(tx => {
      const fromRecharge = tx.metadata?.fromRecharge || 0;
      totalFromRecharge += fromRecharge;
    });
    
    // Calculate expected available recharge
    const expectedAvailableRecharge = totalRechargeDeposits - totalFromRecharge;
    
    // Calculate using our function
    const calculatedAvailableRecharge = await calculateAvailableRecharge(phone);
    
    res.json({
      success: true,
      debug: {
        phone,
        totalTransactions: allTransactions.length,
        rechargeDeposits: {
          count: rechargeDeposits.length,
          total: totalRechargeDeposits,
          transactions: rechargeDeposits.map(tx => ({
            id: tx._id,
            amount: tx.amount,
            description: tx.description,
            date: tx.createdAt
          }))
        },
        purchases: {
          count: purchases.length,
          totalFromRecharge,
          transactions: purchases.map(tx => ({
            id: tx._id,
            amount: tx.amount,
            fromRecharge: tx.metadata?.fromRecharge || 0,
            description: tx.description,
            date: tx.createdAt
          }))
        },
        expectedAvailableRecharge,
        calculatedAvailableRecharge,
        isCorrect: expectedAvailableRecharge === calculatedAvailableRecharge,
        difference: expectedAvailableRecharge - calculatedAvailableRecharge
      }
    });
  } catch (error) {
    console.error('Debug balance error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
