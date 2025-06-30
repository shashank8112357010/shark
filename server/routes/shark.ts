import { Router } from "express";
import SharkInvestment from "../models/SharkInvestment";
import Wallet from "../models/Wallet";
import Transaction, { TransactionType, TransactionStatus } from "../models/Transaction";
import Referral from "../models/Referral";
import User from "../models/User";
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
      const rewardAmount = 150;

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
  // In a real app, this data would come from a database or configuration file
  // For now, using the hardcoded structure similar to the initial frontend
  const mockLevelData = [
    {
      level: 1,
      sharks: [
        {
          id: "shark-a-server", // Ensure IDs are unique if needed
          title: "Shark A (from API)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 500,
          total: 5400,
          daily: 60,
          endDay: 90,
        },
        {
          id: "shark-b-server",
          title: "Shark B (from API)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 1100,
          total: 10800,
          daily: 120,
          endDay: 90,
        },
      ],
    },
    {
      level: 2,
      sharks: [
        {
          id: "shark-c-server",
          title: "Shark C (from API)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2100,
          total: 21600,
          daily: 240,
          endDay: 90,
        },
      ],
    },
    {
      level: 3,
      sharks: [
        {
          id: "shark-e-server",
          title: "Shark E (Demo)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2000,
          total: 4440,
          daily: 888,
          endDay: 5,
        },
      ],
    },
  ];
  try {
    // await connectDb(); // If fetching from DB
    // const levels = await SomeLevelModel.find().populate('sharks'); // Example DB query
    res.json({ levels: mockLevelData });
  } catch (error: any) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Failed to fetch investment levels" });
  }
});

export default router;
