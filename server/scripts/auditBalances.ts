import mongoose from 'mongoose';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import User from '../models/User';
import { connectDb } from '../utils/db';
import { calculateUserBalance } from '../utils/balanceCalculator';

async function auditBalances() {
  console.log('🚀 Starting balance audit...');

  try {
    await connectDb();

    const users = await (User as any).find({});
    console.log(`👥 Found ${users.length} users to audit.`);

    for (const user of users) {
      const { phone } = user;
      console.log(`\n🔍 Auditing user: ${phone}`);

      const storedBalance = await calculateUserBalance(phone);
      
      const transactions = await (Transaction as any).find({ phone, status: TransactionStatus.COMPLETED });

      let calculatedBalance = 0;
      for (const t of transactions) {
        if (t.type === TransactionType.DEPOSIT || t.type === TransactionType.REFERRAL) {
          calculatedBalance += t.amount;
        } else if (t.type === TransactionType.WITHDRAWAL || t.type === TransactionType.PURCHASE) {
          calculatedBalance -= t.amount;
        }
      }

      const discrepancy = calculatedBalance - storedBalance;

      if (discrepancy !== 0) {
        console.log(`  - Stored balance: ₹${storedBalance.toFixed(2)}`);
        console.log(`  - Calculated balance: ₹${calculatedBalance.toFixed(2)}`);
        console.log(`  - Discrepancy: ₹${discrepancy.toFixed(2)}`);

        const correctionTransaction = new Transaction({
          phone,
          type: discrepancy > 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
          amount: Math.abs(discrepancy),
          status: TransactionStatus.COMPLETED,
          transactionId: `AUDIT-${Date.now()}`,
          description: `Balance correction due to audit. Discrepancy: ${discrepancy.toFixed(2)}`,
          metadata: {
            source: 'audit',
            discrepancy,
            storedBalance,
            calculatedBalance,
          },
        });

        await correctionTransaction.save();
        console.log(`  ✅ Corrective transaction created.`);
      } else {
        console.log(`  ✅ Balance is correct.`);
      }
    }

    console.log('\n🎉 Balance audit completed!');
  } catch (error: any) {
    console.error('❌ Error during balance audit:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

auditBalances();