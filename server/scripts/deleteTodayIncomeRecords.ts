import mongoose from 'mongoose';
import Income from '../models/Income';
import { connectDb } from '../utils/db';

async function deleteTodayIncomeRecords() {
  await connectDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Delete all income records created today
  const result = await Income.deleteMany({
    date: { $gte: today, $lt: tomorrow }
  });

  console.log(`Deleted ${result.deletedCount} income records for today.`);
  await mongoose.disconnect();
}

deleteTodayIncomeRecords();
