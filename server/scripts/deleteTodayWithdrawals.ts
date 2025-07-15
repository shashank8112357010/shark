import mongoose from 'mongoose';
import Withdrawal from '../models/Withdrawal';
import { connectDb } from '../utils/db';    

export async function deleteTodayWithdrawals(phone: string) {
  await connectDb();

  // Get start and end of today in IST, then convert to UTC for MongoDB query
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes

  // Get today's date in IST
  const istNow = new Date(now.getTime() + (istOffset - now.getTimezoneOffset()) * 60000);
  istNow.setHours(0, 0, 0, 0);

  const startIST = new Date(istNow);
  const endIST = new Date(istNow);
  endIST.setDate(endIST.getDate() + 1);

  // Convert IST boundaries to UTC
  const startUTC = new Date(startIST.getTime() - istOffset * 60000);
  const endUTC = new Date(endIST.getTime() - istOffset * 60000);

  const result = await Withdrawal.deleteMany({
    phone,
    createdAt: { $gte: startUTC, $lt: endUTC }
  });

  // Log the date in IST (YYYY-MM-DD)
  console.log(`Deleted ${result.deletedCount} withdrawal(s) for ${phone} on ${startIST.toISOString().slice(0,10)}`);
  mongoose.disconnect();
}

// Run if called directly
deleteTodayWithdrawals("8112357010").catch(err => {
    console.error('Error deleting withdrawals:', err);
    process.exit(1);
  });