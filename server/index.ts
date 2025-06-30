import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import walletRouter from "./routes/wallet";
import sharkRouter from "./routes/shark";
import referralRouter from "./routes/referral";

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

  return app;
}
