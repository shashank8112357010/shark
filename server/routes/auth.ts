import { Router } from "express";
import bcrypt from "bcryptjs";
import User from '../models/User';
import { connectDb } from '../utils/db';
import QRCode from 'qrcode';

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
    
    // Note: Referral rewards are now only given when referred user buys shark
    // Registration no longer gives immediate reward
    
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

// Get user by phone
router.get("/user/:phone", async (req, res) => {
  await connectDb();
  const user = await User.findOne({ phone: req.params.phone }); // Correct usage
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ phone: user.phone, inviteCode: user.inviteCode || "" });
});

// Demo user creation (if not exists)
router.post("/demo-user", async (_req, res) => {
  const db = await getDb();
  const users = db.collection("users");
  const phone = "9999999999";
  const password = "admin123";
  let user = await users.findOne({ phone });
  if (!user) {
    const hash = await bcrypt.hash(password, 10);
    user = { phone, password: hash, inviteCode: "demo", created: new Date() };
    await users.insertOne(user);
  }
  res.json({ success: true, user: { phone, inviteCode: user.inviteCode } });
});

export default router;
