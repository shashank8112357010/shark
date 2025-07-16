import mongoose from 'mongoose';
import Transaction, { TransactionType } from '../models/Transaction';
import { connectDb } from '../utils/db';

async function deleteTodayIncome() {
  await connectDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Find and delete all DEPOSIT transactions with metadata.source === 'shark_income' created today
  const result = await Transaction.deleteMany({
    type: TransactionType.DEPOSIT,
    'metadata.source': 'shark_income',
    createdAt: { $gte: today, $lt: tomorrow }
  });

  console.log(`Deleted ${result.deletedCount} shark income transactions for today.`);
  await mongoose.disconnect();
}

deleteTodayIncome()