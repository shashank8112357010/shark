import { Router } from "express";
import bcrypt from "bcryptjs";
import User from '../models/User';
import ReferralAmount from '../models/ReferralAmount';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';

import QRCode from 'qrcode';
import { connectDb } from "../utils/db";

const router = Router();

// Helper to generate unique invite code
function generateInviteCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to generate dynamic QR code data
function generateDynamicQR(phone: string): string {
  return `tel:${phone}`;
}

// Helper to generate dynamic referral link
function generateReferralLink(inviteCode: string) {
  return `https://theshark.in/join/${inviteCode}`;
}

// Register
router.post("/register", async (req, res) => {
  try {
    await connectDb();
    const { phone, password, withdrawalPassword } = req.body;

    if (!phone || !password || !withdrawalPassword) {
      return res.status(400).json({ error: "Phone, password, and withdrawal password are required" });
    }

    // Check if user already exists
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Generate invite code
    let userInviteCode = generateInviteCode();
    
    // Get referrer from query parameter or request body
    const referrerCode = req.query.referrer ? String(req.query.referrer) : req.body.inviteCode;
    let referrer = undefined;
    
    // If referrer code is provided, find the user by invite code
    if (referrerCode) {
      const referrerUser = await User.findOne({ inviteCode: referrerCode });
      if (referrerUser) {
        referrer = referrerUser.phone;
      }
    }

    // Hash passwords
    const hash = await bcrypt.hash(password, 10);
    const withdrawalHash = await bcrypt.hash(withdrawalPassword, 10);

    // Create user
    const user = new User({
      phone,
      password: hash,
      withdrawalPassword: withdrawalHash,
      inviteCode: userInviteCode,
      referrer,
      created: new Date(),
    });
    await user.save();

    // Generate QR code for user
    const qrData = generateDynamicQR(phone);
    const qrCode = await QRCode.toDataURL(qrData);

    // Generate referral link
    const referralLink = generateReferralLink(userInviteCode);
    
// Create referral reward immediately upon registration
    if (referrer) {
      const referralTransactionId = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const referralAmount = new ReferralAmount({
        referrer: referrer,
        referred: phone,
        referralTransactionId: referralTransactionId,
        rewardAmount: 300,  // Set reward amount for registration
        status: 'completed',
        dateEarned: new Date(),
        referredPurchaseAmount: 0  // Set to 0 as no purchase is necessary
      });
      await referralAmount.save();

      // Create reward transaction in the transaction model
      const rewardTransaction = new Transaction({
        phone: referrer,
        type: TransactionType.REFERRAL,
        amount: 300,  // Set reward amount
        transactionId: referralTransactionId,
        description: `Referral reward for referring ${phone} (registration)`,
        status: TransactionStatus.COMPLETED
      });
      await rewardTransaction.save();
    }
    
    res.json({ 
      success: true, 
      user: { 
        phone: user.phone, 
        inviteCode: userInviteCode,
        referralLink
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    await connectDb();
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate QR code
    const qrData = generateDynamicQR(phone);
    const qrCode = await QRCode.toDataURL(qrData);

    res.json({ 
      success: true, 
      user: { 
        phone: user.phone, 
        inviteCode: user.inviteCode,
        qrCode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  console.log("[/api/auth/forgot-password] Received request");
  console.log("Request Body:", req.body);
  try {
    console.log("Connecting to DB...");
    await connectDb();
    console.log("DB connected.");
    const { phone, withdrawalPin, newPassword } = req.body;

    if (!phone || !withdrawalPin || !newPassword) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Phone, withdrawal PIN, and new password are required" });
    }

    console.log(`Finding user with phone: ${phone}`);
    const user = await User.findOne({ phone });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found.");

    console.log("Verifying withdrawal PIN...");
    const isWithdrawalPinValid = await bcrypt.compare(withdrawalPin, user.withdrawalPassword);
    if (!isWithdrawalPinValid) {
      console.log("Invalid withdrawal PIN");
      return res.status(401).json({ error: "Invalid withdrawal PIN" });
    }
    console.log("Withdrawal PIN verified.");

    console.log("Hashing new password...");
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log("New password hashed.");

    console.log("Updating user password...");
    await User.findOneAndUpdate(
      { phone },
      { password: hashedNewPassword },
      { new: true }
    );
    console.log("User password updated.");

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

// Get user by phone
router.get("/user/:phone", async (req, res) => {
  await connectDb();
  const user = await User.findOne({ phone: req.params.phone }); // Correct usage
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ phone: user.phone, inviteCode: user.inviteCode || "" });
});

// Demo user creation (if not exists)
router.post("/demo-user", async (_req, res) => {
  try {
    await connectDb();
    const phone = "9999999999";
    const password = "admin123";
    
    let user = await User.findOne({ phone });
    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      const withdrawalHash = await bcrypt.hash(password, 10);
      user = new User({
        phone,
        password: hash,
        withdrawalPassword: withdrawalHash,
        inviteCode: "demo",
        created: new Date()
      });
      await user.save();
    }
    res.json({ success: true, user: { phone, inviteCode: user.inviteCode } });
  } catch (error) {
    console.error('Demo user creation error:', error);
    res.status(500).json({ error: "Demo user creation failed" });
  }
});

export default router;
