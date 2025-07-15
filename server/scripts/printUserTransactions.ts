import { connectDb } from '../utils/db';
import Transaction from '../models/Transaction';

async function printUserTransactions(phone: string) {
  await connectDb();
  const txns = await Transaction.find({ phone }).sort({ createdAt: -1 }).lean();
  console.log(`Transactions for ${phone}:`);
  for (const txn of txns) {
    console.log({
      _id: txn._id,
      type: txn.type,
      status: txn.status,
      amount: txn.amount,
      metadata: txn.metadata,
      createdAt: txn.createdAt
    });
  }
  process.exit(0);
}

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: tsx printUserTransactions.ts <phone>');
  process.exit(1);
}
printUserTransactions(phone);
