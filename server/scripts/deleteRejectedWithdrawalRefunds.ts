import { connectDb } from '../utils/db';
import Transaction, { TransactionType } from '../models/Transaction';
import Withdrawal from '../models/Withdrawal';

async function main() {
  await connectDb();
  // Find all rejected withdrawals
  const rejectedWithdrawals = await Withdrawal.find({ status: 'REJECTED' }).lean();
  let deleted = 0;

  for (const wd of rejectedWithdrawals) {
    // Find refund deposit for this withdrawal
    const refund = await Transaction.findOne({
      phone: wd.phone,
      type: TransactionType.DEPOSIT,
      description: { $regex: 'Withdrawal refund for rejected request', $options: 'i' },
      amount: wd.amount
    });
    if (refund) {
      await Transaction.deleteOne({ _id: refund._id });
      console.log(`Deleted refund txn ${refund._id} for phone ${wd.phone}, amount ₹${wd.amount}`);
      deleted++;
    }
  }
  console.log(`\nDeleted ${deleted} refund transactions for rejected withdrawals.`);
  process.exit(0);
}

main();
