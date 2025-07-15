import { connectDb } from '../utils/db';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';

async function addAdjustmentDeposit(phone: string, amount: number) {
  await connectDb();
  const txn = new Transaction({
    phone,
    type: TransactionType.DEPOSIT,
    amount,
    status: TransactionStatus.COMPLETED,
    transactionId: `ADJUST-${Date.now()}`,
    description: 'Manual adjustment to correct wallet balance',
    metadata: { source: 'adjustment' }
  });
  await txn.save();
  console.log(`Added adjustment deposit of ₹${amount} for ${phone}`);
  process.exit(0);
}

const phone = process.argv[2];
const amount = Number(process.argv[3]);
if (!phone || !amount) {
  console.error('Usage: tsx addAdjustmentDeposit.ts <phone> <amount>');
  process.exit(1);
}
addAdjustmentDeposit(phone, amount);
