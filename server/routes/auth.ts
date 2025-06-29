import { Router } from "express";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const router = Router();

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB || "shark";
const client = new MongoClient(MONGO_URI);

async function getDb() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db(DB_NAME);
}

// Register
router.post("/register", async (req, res) => {
  const { phone, password, inviteCode } = req.body;
  if (!phone || !password) return res.status(400).json({ error: "Missing fields" });
  const db = await getDb();
  const users = db.collection("users");
  const exists = await users.findOne({ phone });
  if (exists) return res.status(409).json({ error: "User exists" });
  const hash = await bcrypt.hash(password, 10);
  const user = { phone, password: hash, inviteCode, created: new Date() };
  await users.insertOne(user);
  res.json({ success: true, user: { phone, inviteCode } });
});

// Login
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ phone });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ success: true, user: { phone: user.phone, inviteCode: user.inviteCode || "" } });
});

// Get user by phone
router.get("/user/:phone", async (req, res) => {
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ phone: req.params.phone });
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
