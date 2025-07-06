import express from 'express';
import Admin from '../models/Admin';
import User from '../models/User';
import RechargeRequest from '../models/RechargeRequest';
import Withdrawal from '../models/Withdrawal';
import Wallet from '../models/Wallet';
import { connectDb } from '../utils/db';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid token or admin not active.' });
    }

    req.admin = admin;
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

    const admin = await Admin.findOne({ email: email.toLowerCase() });
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

    const totalUsers = await User.countDocuments();
    const totalRechargeRequests = await RechargeRequest.countDocuments();
    const pendingRecharges = await RechargeRequest.countDocuments({ status: 'pending' });
    const approvedRecharges = await RechargeRequest.countDocuments({ status: 'approved' });
    const rejectedRecharges = await RechargeRequest.countDocuments({ status: 'rejected' });
    
    const totalWithdrawals = await Withdrawal.countDocuments();
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'PENDING' });
    const approvedWithdrawals = await Withdrawal.countDocuments({ status: 'APPROVED' });
    const completedWithdrawals = await Withdrawal.countDocuments({ status: 'COMPLETED' });

    // Calculate total wallet balances
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          avgBalance: { $avg: '$balance' },
          minBalance: { $min: '$balance' },
          maxBalance: { $max: '$balance' }
        }
      }
    ]);

    // Get recent activity
    const recentRecharges = await RechargeRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('phone amount utrNumber status createdAt');

    const recentWithdrawals = await Withdrawal.find()
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
        wallets: walletStats[0] || {
          totalBalance: 0,
          avgBalance: 0,
          minBalance: 0,
          maxBalance: 0
        },
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

    const rechargeRequests = await RechargeRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await RechargeRequest.countDocuments(filter);

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
    const admin = req.admin;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status === 'approved' && (!approvedAmount || approvedAmount <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid approved amount is required for approval' });
    }

    const rechargeRequest = await RechargeRequest.findById(id);
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

    // If approved, update user wallet with approved amount
    if (status === 'approved') {
      const amountToAdd = approvedAmount || rechargeRequest.amount;
      let wallet = await Wallet.findOne({ phone: rechargeRequest.phone });
      if (!wallet) {
        wallet = new Wallet({
          phone: rechargeRequest.phone,
          balance: amountToAdd
        });
      } else {
        wallet.balance += amountToAdd;
      }
      await wallet.save();

      // Create transaction record
      const Transaction = require('../models/Transaction').default;
      const transaction = new Transaction({
        phone: rechargeRequest.phone,
        type: 'DEPOSIT',
        amount: amountToAdd,
        description: `Recharge approved by ${admin.email}`,
        status: 'COMPLETED',
        reference: rechargeRequest._id
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

    const withdrawals = await Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Withdrawal.countDocuments(filter);

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
    const { paymentProof, paymentUtr, adminNotes } = req.body;
    const admin = req.admin;

    if (!paymentProof || !paymentUtr) {
      return res.status(400).json({ success: false, error: 'Payment proof and UTR are required' });
    }

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Withdrawal already processed' });
    }

    withdrawal.status = 'COMPLETED';
    withdrawal.paymentProof = paymentProof;
    withdrawal.paymentUtr = paymentUtr;
    withdrawal.adminNotes = adminNotes;
    withdrawal.reviewedBy = admin.email;
    withdrawal.reviewedAt = new Date();

    await withdrawal.save();

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
    const admin = req.admin;

    const withdrawal = await Withdrawal.findById(id);
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

    // Refund the amount back to user's wallet
    const wallet = await Wallet.findOne({ phone: withdrawal.phone });
    if (wallet) {
      wallet.balance += withdrawal.amount;
      await wallet.save();
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

    const users = await User.find()
      .select('-password -withdrawalPassword')
      .sort({ created: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    // Get wallet balances for each user
    const usersWithWallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ phone: user.phone });
        return {
          ...user.toObject(),
          walletBalance: wallet ? wallet.balance : 0
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

export default router;
