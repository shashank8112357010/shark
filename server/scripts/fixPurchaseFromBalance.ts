import { connectDb } from '../utils/db';
import Transaction from '../models/Transaction';

async function fixPurchaseFromBalance(phone: string) {
  await connectDb();
  const purchases = await Transaction.find({ phone, type: 'purchase', status: 'completed' });
  for (const txn of purchases) {
    const amount = txn.amount;
    txn.metadata = { ...(txn.metadata || {}), fromBalance: amount, fromRecharge: 0 };
    await txn.save();
    console.log(`Updated purchase txn ${txn._id}: fromBalance=${amount}, fromRecharge=0`);
  }
  process.exit(0);
}

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: tsx fixPurchaseFromBalance.ts <phone>');
  process.exit(1);
}
fixPurchaseFromBalance(phone);
