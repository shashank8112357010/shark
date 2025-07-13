import { Router } from "express";
import Income from "../models/Income";
import Transaction, { TransactionType } from "../models/Transaction";
import { connectDb } from "../utils/db";

const router = Router();

// Get user's total income (for profile section)
router.get("/total/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Calculate total income from Income records
    const totalIncomeResult = await Income.aggregate([
      { $match: { phone: phone } },
      { $group: {
        _id: null,
        totalIncome: { $sum: "$dailyIncomeAmount" },
        totalRecords: { $sum: 1 }
      }}
    ]);
    
    const totalIncome = totalIncomeResult[0]?.totalIncome || 0;
    const totalRecords = totalIncomeResult[0]?.totalRecords || 0;
    
    res.json({ 
      success: true,
      totalIncome,
      totalRecords,
      message: `Total income from ${totalRecords} daily income records`
    });
  } catch (error: any) {
    console.error('Error calculating total income:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate total income', 
      details: error.message 
    });
  }
});

// Get user's daily income history
router.get("/history/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Get income history with pagination
    const incomeHistory = await Income.find({ phone })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Income.countDocuments({ phone });
    
    res.json({
      success: true,
      incomeHistory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error fetching income history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch income history', 
      details: error.message 
    });
  }
});

// Get user's income by date range
router.get("/range/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Start date and end date are required' 
      });
    }
    
    const dateFilter = {
      phone,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };
    
    const incomeData = await Income.find(dateFilter).sort({ date: -1 });
    
    const totalIncome = incomeData.reduce((sum, record) => sum + record.dailyIncomeAmount, 0);
    
    res.json({
      success: true,
      incomeData,
      totalIncome,
      dateRange: { startDate, endDate },
      recordCount: incomeData.length
    });
  } catch (error: any) {
    console.error('Error fetching income by date range:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch income by date range', 
      details: error.message 
    });
  }
});

// Get user's income statistics by shark
router.get("/stats/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Get income statistics grouped by shark
    const incomeStats = await Income.aggregate([
      { $match: { phone: phone } },
      { $group: {
        _id: {
          sharkTitle: "$sharkTitle",
          sharkLevel: "$sharkLevel"
        },
        totalIncome: { $sum: "$dailyIncomeAmount" },
        incomeCount: { $sum: 1 },
        lastIncomeDate: { $max: "$date" },
        firstIncomeDate: { $min: "$date" }
      }},
      { $sort: { totalIncome: -1 } }
    ]);
    
    const overallStats = await Income.aggregate([
      { $match: { phone: phone } },
      { $group: {
        _id: null,
        totalIncome: { $sum: "$dailyIncomeAmount" },
        totalIncomeRecords: { $sum: 1 },
        avgDailyIncome: { $avg: "$dailyIncomeAmount" },
        maxDailyIncome: { $max: "$dailyIncomeAmount" },
        minDailyIncome: { $min: "$dailyIncomeAmount" }
      }}
    ]);
    
    res.json({
      success: true,
      incomeStats,
      overallStats: overallStats[0] || {
        totalIncome: 0,
        totalIncomeRecords: 0,
        avgDailyIncome: 0,
        maxDailyIncome: 0,
        minDailyIncome: 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching income statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch income statistics', 
      details: error.message 
    });
  }
});

// Manual trigger for income calculation (for testing/admin purposes)
router.post("/calculate-all", async (req, res) => {
  try {
    await connectDb();
    
    // Import the manual trigger function
    const { triggerIncomeCalculation } = await import('../utils/incomeScheduler');
    
    // Trigger income calculation for all users
    console.log('🔧 Manual income calculation triggered via API');
    await triggerIncomeCalculation();
    
    res.json({
      success: true,
      message: "Income calculation completed for all eligible users",
      note: "Check server logs for detailed results"
    });
  } catch (error: any) {
    console.error('Error triggering income calculation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to trigger income calculation', 
      details: error.message 
    });
  }
});

// Create test income transaction (for testing purposes only)
router.post("/test-income", async (req, res) => {
  try {
    await connectDb();
    const { phone, amount, dayNumber, sharkTitle = 'Shark A', sharkLevel = 1 } = req.body;
    
    if (!phone || !amount || !dayNumber) {
      return res.status(400).json({ 
        success: false,
        error: "Phone, amount, and dayNumber are required" 
      });
    }
    
    // Create income transaction
    const transactionId = `TEST-INCOME-${dayNumber}-${Date.now()}`;
    const transaction = new Transaction({
      phone,
      type: TransactionType.DEPOSIT,
      amount: Number(amount),
      status: 'completed',
      transactionId,
      description: `Daily income from ${sharkTitle} - Day ${dayNumber}`,
      metadata: {
        incomeType: 'daily_shark_income',
        sharkTitle,
        sharkLevel,
        dayNumber,
        isTestIncome: true
      }
    });
    
    await transaction.save();
    
    // Create income record
    const incomeRecord = new Income({
      phone,
      date: new Date(),
      sharkTitle,
      sharkLevel,
      dailyIncomeAmount: Number(amount),
      sharkPurchaseId: 'test-investment',
      transactionId: transaction._id.toString()
    });
    
    await incomeRecord.save();
    
    res.json({
      success: true,
      message: `Test income of ₹${amount} created for day ${dayNumber}`,
      transactionId: transaction._id,
      incomeId: incomeRecord._id
    });
  } catch (error: any) {
    console.error('Error creating test income:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create test income', 
      details: error.message 
    });
  }
});

export default router;
