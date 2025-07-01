import { Router } from "express";
import SharkInvestment from "../models/SharkInvestment";
import Wallet from "../models/Wallet";
import Transaction, { TransactionType, TransactionStatus } from "../models/Transaction";
import Referral from "../models/Referral";
import User from "../models/User";
import SharkModel, { IShark } from "../models/Shark"; // Import the new Shark model
import { connectDb } from "../utils/db";
import QRCode from "qrcode";

const router = Router();

// Generate unique transaction ID
function generateTransactionId() {
  return `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Buy shark investment
router.post("/buy", async (req, res) => {
  await connectDb();
  const { phone, shark, price } = req.body;

  if (!phone || !shark || !price) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const transactionId = generateTransactionId();
  const transaction = new Transaction({
    phone,
    type: TransactionType.PURCHASE,
    amount: Number(price),
    transactionId,
    description: `Shark purchase - ${shark}`,
    metadata: { shark, price: Number(price) }
  });

  try {
    const qrData = `shark:${transactionId}:${phone}`;
    const qrCode = await QRCode.toDataURL(qrData);
    transaction.qrCode = qrCode;
    await transaction.save();

    const wallet = await Wallet.findOne({ phone });
    if (!wallet || wallet.balance < price) {
      await Transaction.findOneAndUpdate(
        { transactionId },
        {
          status: TransactionStatus.FAILED,
          description: "Insufficient balance"
        }
      );
      return res.status(400).json({ error: "Insufficient balance" });
    }

    wallet.balance -= Number(price);
    await wallet.save();

    const investment = new SharkInvestment({
      phone,
      shark,
      price: Number(price),
      date: new Date(),
      transactionId
    });
    await investment.save();

    await Transaction.findOneAndUpdate(
      { transactionId },
      {
        status: TransactionStatus.COMPLETED,
        description: `Shark purchase completed - ${shark}`
      }
    );

    const user = await User.findOne({ phone });
    if (user?.referrer) {
      // Use the configured referral bonus amount, with a default fallback if not set
      const configuredBonusAmount = process.env.REFERRAL_BONUS_AMOUNT;
      let rewardAmount = 150; // Default fallback, ideally manage this default centrally if possible
      if (configuredBonusAmount && !isNaN(Number(configuredBonusAmount)) && Number(configuredBonusAmount) > 0) {
        rewardAmount = Number(configuredBonusAmount);
      } else {
        console.warn(
          `REFERRAL_BONUS_AMOUNT not set, invalid, or zero in .env for shark/buy route. Using default: ${rewardAmount}. Check .env file.`
        );
      }

      const rewardTransaction = new Transaction({
        phone: user.referrer,
        type: TransactionType.REFERRAL,
        amount: rewardAmount,
        transactionId: generateTransactionId(),
        description: `Referral reward for ${phone}'s purchase`,
        status: TransactionStatus.COMPLETED,
        relatedPhone: phone,
        metadata: {
          referralId: user.referrer,
          transactionId
        }
      });
      await rewardTransaction.save();

      const referral = new Referral({
        referrer: user.referrer,
        referred: phone,
        transactionId,
        reward: rewardAmount,
        status: TransactionStatus.COMPLETED
      });
      await referral.save();
    }

    res.json({
      success: true,
      transactionId,
      qrCode: transaction.qrCode,
      investment
    });
  } catch (error: any) {
    console.error("Purchase error:", error);
    await Transaction.findOneAndUpdate(
      { transactionId },
      {
        status: TransactionStatus.FAILED,
        description: error.message
      }
    );
    res.status(500).json({ error: "Transaction failed" });
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

export default router;
