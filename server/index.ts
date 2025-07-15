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
import bankDetailsRouter from "./routes/bankDetails";
import uploadRouter from "./routes/upload";
import path from 'path';

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Increase payload limit for image uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  
  // Add bank details routes
  app.use("/api/bank-details", bankDetailsRouter);
  
  // Add upload routes
  app.use("/api/upload", uploadRouter);
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  return app;
}