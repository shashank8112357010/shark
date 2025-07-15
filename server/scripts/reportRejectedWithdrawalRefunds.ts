import { connectDb } from '../utils/db';
import Transaction, { TransactionType } from '../models/Transaction';
import Withdrawal from '../models/Withdrawal';

async function main() {
  await connectDb();
  // Find all rejected withdrawals
  const rejectedWithdrawals = await Withdrawal.find({ status: 'REJECTED' }).lean();
  const userRefunds: Record<string, number> = {};
  const refundTxns: any[] = [];

  for (const wd of rejectedWithdrawals) {
    // Find refund deposit for this withdrawal
    const refund = await Transaction.findOne({
      phone: wd.phone,
      type: TransactionType.DEPOSIT,
      description: { $regex: 'Withdrawal refund for rejected request', $options: 'i' },
      amount: wd.amount
    }).lean();
    if (refund) {
      userRefunds[wd.phone] = (userRefunds[wd.phone] || 0) + wd.amount;
      refundTxns.push({ phone: wd.phone, withdrawalId: wd._id, refundTxnId: refund._id, amount: wd.amount });
    }
  }

  console.log('Users with doubled balance due to rejected withdrawal refunds:');
  for (const [phone, total] of Object.entries(userRefunds)) {
    console.log(`- ${phone}: ₹${total} extra credited`);
  }
  console.log('\nDetails of refund transactions:');
  for (const entry of refundTxns) {
    console.log(entry);
  }
  process.exit(0);
}

main();
