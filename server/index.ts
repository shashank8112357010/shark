import express from "express";
import cors from "cors";
import cron from "node-cron";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import walletRouter from "./routes/wallet";
import sharkRouter from "./routes/shark";
import referralRouter from "./routes/referral";
import referralAmountRouter from "./routes/referralAmount";
import withdrawRouter from "./routes/withdraw";
import adminRouter from "./routes/admin";
import incomeRouter from "./routes/income";
import { startIncomeScheduler } from "./utils/incomeScheduler";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Add auth routes
  app.use("/api/auth", authRouter);

  // Add wallet routes
  app.use("/api/wallet", walletRouter);

  // Add shark investment routes
  app.use("/api/shark", sharkRouter);

  // Add referral routes
  app.use("/api/referral", referralRouter);
  
  // Add referral amount routes (new system)
  app.use("/api/referral-amount", referralAmountRouter);
  
  app.use("/api/withdraw", withdrawRouter);
  
  // Add income routes
  app.use("/api/income", incomeRouter);
  
  // Add admin routes
  app.use("/api/admin", adminRouter);

  // Start the income scheduler (runs at 4 AM IST daily)
  startIncomeScheduler();
  console.log('🕐 Income scheduler started - will run daily at 4 AM IST');

  return app;
}
