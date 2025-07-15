import { Router } from "express";
import SharkInvestment from "../models/SharkInvestment";
import Transaction, { TransactionType, TransactionStatus } from "../models/Transaction";
import Referral from "../models/Referral";
import ReferralAmount from "../models/ReferralAmount";
import User from "../models/User";
import SharkModel, { IShark } from "../models/Shark"; // Import the new Shark model
import { connectDb } from "../utils/db";
import { checkSufficientBalance, calculateAvailableRecharge, calculateAvailableNonRechargeBalance } from "../utils/balanceCalculator";
import QRCode from "qrcode";

const router = Router();

// Generate unique transaction ID
function generateTransactionId() {
  return `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Buy shark investment
router.post("/buy", async (req, res) => {
  try {
    await connectDb();
    console.log(req.body, "req.body");
    
    const { phone, shark, price, level, sharkId } = req.body;

    if (!phone || !shark || !price || !level) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Check if user has already purchased this specific shark
    const existingPurchase = await SharkInvestment.findOne({ 
      phone, 
      shark: shark, // Check for specific shark name
      level: Number(level)
    });
    
    if (existingPurchase) {
      return res.status(400).json({ 
        error: `You have already purchased ${shark}. Each shark can only be purchased once.` 
      });
    }

    // Calculate available recharge balance first
    const availableRecharge = await calculateAvailableRecharge(phone);
    
    // Only allow purchase if recharge balance is sufficient
    if (availableRecharge < Number(price)) {
      return res.status(400).json({
        error: "Insufficient recharge balance. Please recharge to buy this shark.",
        availableRecharge,
        requiredAmount: Number(price)
      });
    }

    // Deduct from recharge only
    let fromRecharge = Number(price);
    let fromBalance = 0;

    let transactionId: string;
    transactionId = generateTransactionId();
    
    // Create transaction with proper metadata from the start
    const transaction = new Transaction({
      phone,
      type: TransactionType.PURCHASE,
      amount: Number(price),
      transactionId,
      status: TransactionStatus.COMPLETED,
      description: `Shark purchase completed - ${shark}`,
      metadata: {
        shark,
        price: Number(price),
        fromBalance: Number(price), // Deduct from main balance
        fromRecharge: 0
      }
    });
    
    const qrData = `shark:${transactionId}:${phone}`;
    const qrCode = await QRCode.toDataURL(qrData);
    transaction.qrCode = qrCode;
    await transaction.save();

    const investment = new SharkInvestment({
      phone,
      shark,
      price: Number(price),
      date: new Date(),
      transactionId,
      level: Number(level)
    });
    await investment.save();

    // Update referral record if this user was referred and hasn't been marked as purchased yet
    await ReferralAmount.findOneAndUpdate(
      { referred: phone, referredPurchaseAmount: 0 },
      {
        referredPurchaseAmount: Number(price),
        status: 'completed',
        dateEarned: new Date(),
      }
    );
    console.log(`ReferralAmount updated for referred user if applicable.`);
    // Referral rewards are now handled at registration time
    // No additional reward for shark purchases
    console.log(`ℹ️ Shark purchase completed. Referral rewards are handled at registration time.`);

    res.json({
      success: true,
      transactionId,
      qrCode: transaction.qrCode,
      investment: {
        id: investment._id,
        phone: investment.phone,
        shark: investment.shark,
        level: investment.level,
        price: investment.price
      }
    });
    
  } catch (error: any) {
    console.error("=== PURCHASE ERROR ===", error);
    
    // Try to mark transaction as failed if it exists
    try {
      if (typeof transactionId !== 'undefined') {
        await Transaction.findOneAndUpdate(
          { transactionId },
          {
            status: TransactionStatus.FAILED,
            description: error.message
          }
        );
      }
    } catch (updateError) {
      console.error('Error updating transaction status:', updateError);
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Transaction failed",
      details: error.stack
    });
  }
});

// Validate QR code
router.post("/validate-qr", async (req, res) => {
  await connectDb();
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ error: "QR data required" });

  try {
    const [prefix, transactionId] = qrData.split(":");
    if (prefix !== "shark") return res.status(400).json({ error: "Invalid QR format" });

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    if (transaction.status !== TransactionStatus.PENDING) {
      return res.json({
        success: false,
        message: "Transaction already processed",
        status: transaction.status
      });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ error: "Invalid QR code" });
  }
});

// Get user's shark investments
router.get("/user/:phone", async (req, res) => {
  await connectDb();
  const investments = await SharkInvestment.find({ phone: req.params.phone })
    .populate<{ status: string; transactionId: string; createdAt: Date }>(
      "transactionId",
      "status transactionId createdAt"
    );
  res.json({ investments });
});

// Get user's purchased sharks with full details
router.get("/purchased/:phone", async (req, res) => {
  try {
    await connectDb();
    const phone = req.params.phone;
    
    // Get all successful purchases for this user (only records with level and transactionId)
    const purchases = await SharkInvestment.find({ 
      phone,
      level: { $exists: true, $ne: null },
      transactionId: { $exists: true, $ne: null }
    }).sort({ date: -1 }); // Most recent first
    
    // Get the associated transaction details
    const purchaseDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const transaction = await Transaction.findOne({ 
          transactionId: purchase.transactionId,
          status: TransactionStatus.COMPLETED
        });
        
        return {
          id: purchase._id,
          shark: purchase.shark,
          level: purchase.level,
          price: purchase.price,
          date: purchase.date,
          transactionId: purchase.transactionId,
          status: transaction ? transaction.status : 'unknown'
        };
      })
    );
    
    // Filter only completed purchases
    const completedPurchases = purchaseDetails.filter(p => p.status === TransactionStatus.COMPLETED);
    
    res.json({ 
      success: true,
      purchases: completedPurchases,
      totalPurchases: completedPurchases.length
    });
  } catch (error: any) {
    console.error('Error fetching purchased sharks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch purchased sharks',
      details: error.message 
    });
  }
});

// Get user's transaction history
router.get("/history/:phone", async (req, res) => {
  await connectDb();
  const transactions = await Transaction.find({ phone: req.params.phone }).sort({
    createdAt: -1
  });
  res.json({ transactions });
});

// Get all investment levels and sharks
router.get("/levels", async (req, res) => {
  try {
    await connectDb();
    // USER ACTION REQUIRED: Ensure you have data in the 'sharks' collection in MongoDB.
    // Each document should follow the IShark interface (title, image, price, totalReturn, dailyIncome, durationDays, levelNumber).
    const allSharksFromDB = await SharkModel.find().sort({ levelNumber: 1, price: 1 }).lean();

    if (!allSharksFromDB || allSharksFromDB.length === 0) {
      // No sharks found in the database, return empty levels array
      // This allows frontend to display "No plans available"
      return res.json({ levels: [] });
    }

    // Group sharks by levelNumber
    const levelsMap = new Map<number, any[]>();
    allSharksFromDB.forEach(shark => {
      const level = shark.levelNumber;
      if (!levelsMap.has(level)) {
        levelsMap.set(level, []);
      }
      // Map to the structure expected by the frontend (Dashboard.tsx and Plans.tsx)
      // Note: IShark model uses totalReturn, dailyIncome, durationDays. Frontend expects total, daily, endDay.
      levelsMap.get(level)?.push({
        id: shark._id.toString(), // Use MongoDB _id as id
        title: shark.title,
        image: shark.image,
        
        price: shark.price,
        total: shark.totalReturn, // Map from totalReturn
        daily: shark.dailyIncome, // Map from dailyIncome
        endDay: shark.durationDays, // Map from durationDays
      });
    });

    // Convert map to the array structure expected by frontend
    const structuredLevels = Array.from(levelsMap.entries()).map(([levelNumber, sharks]) => ({
      level: levelNumber,
      sharks: sharks,
    })).sort((a, b) => a.level - b.level); // Ensure levels are sorted

    res.json({ levels: structuredLevels });

  } catch (error: any) {
    console.error("Error fetching levels from DB:", error);
    // It's important to also inform the user that data needs to be added to the DB if that's a likely cause.
    // However, a generic error is also needed for other cases.
    let errorMessage = "Failed to fetch investment levels.";
    if (error.message && error.message.includes("ECONNREFUSED")) {
        errorMessage = "Database connection refused. Please ensure MongoDB is running and accessible.";
    } else if (!allSharksFromDB || allSharksFromDB.length === 0) {
        // This case is now handled above by returning empty levels.
        // Kept for context, but the specific error message here might not be reached if the above check is effective.
        errorMessage = "No investment plans found in the database. Please add data to the 'sharks' collection.";
    }

    res.status(500).json({ error: errorMessage, details: error.message });
  }
});

// Get all investment levels and sharks with user's purchase status
router.get("/levels/:phone", async (req, res) => {
  try {
    await connectDb();
    const userPhone = req.params.phone;
    
    // Get user's purchased sharks (individual sharks, not levels)
    const userPurchases = await SharkInvestment.find({ 
      phone: userPhone
    }).select('shark level');
    
    // Create a set of purchased shark names for quick lookup
    const purchasedSharks = new Set(userPurchases.map(p => p.shark));
    
    // Also track purchased levels for level-level checking
    const purchasedLevels = new Set(userPurchases.map(p => p.level).filter(level => level !== undefined && level !== null));
    
    const allSharksFromDB = await SharkModel.find().sort({ levelNumber: 1, price: 1 }).lean();

    if (!allSharksFromDB || allSharksFromDB.length === 0) {
      return res.json({ levels: [] });
    }

    // Group sharks by levelNumber and mark individual sharks as purchased
    const levelsMap = new Map<number, any[]>();
    allSharksFromDB.forEach(shark => {
      const level = shark.levelNumber;
      if (!levelsMap.has(level)) {
        levelsMap.set(level, []);
      }
      
      levelsMap.get(level)?.push({
        id: shark._id.toString(),
        title: shark.title,
        image: shark.image,
        price: shark.price,
        total: shark.totalReturn,
        isLocked: shark.isLocked,
        daily: shark.dailyIncome,
        endDay: shark.durationDays,
        isPurchased: purchasedSharks.has(shark.title) // Mark if this specific shark is purchased
      });
    });

    const structuredLevels = Array.from(levelsMap.entries()).map(([levelNumber, sharks]) => {
      // A level is considered purchased if ALL sharks in that level are purchased
      const allSharksPurchased = sharks.every(shark => shark.isPurchased);
      
      return {
        level: levelNumber,
        sharks: sharks,
        isPurchased: allSharksPurchased // Only mark level as purchased if ALL sharks are purchased
      };
    }).sort((a, b) => a.level - b.level);

    res.json({ levels: structuredLevels });

  } catch (error: any) {
    console.error("Error fetching levels with purchase status:", error);
    res.status(500).json({ 
      error: "Failed to fetch investment levels with purchase status", 
      details: error.message 
    });
  }
});

export default router;
