import { Router } from "express";
import Wallet from '../models/Wallet';
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

export default router;
