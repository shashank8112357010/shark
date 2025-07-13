import { connectDb } from '../utils/db';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import SharkInvestment from '../models/SharkInvestment';

async function fixTransactionMetadata() {
  try {
    await connectDb();
    console.log('🔧 Starting transaction metadata fix...');

    // Find all completed purchase transactions that don't have fromRecharge/fromBalance metadata
    const incompleteTransactions = await Transaction.find({
      type: TransactionType.PURCHASE,
      status: TransactionStatus.COMPLETED,
      $or: [
        { 'metadata.fromRecharge': { $exists: false } },
        { 'metadata.fromBalance': { $exists: false } }
      ]
    });

    console.log(`Found ${incompleteTransactions.length} transactions with incomplete metadata`);

    let fixedCount = 0;
    for (const transaction of incompleteTransactions) {
      try {
        const phone = transaction.phone;
        const amount = transaction.amount;
        
        // Calculate what should have been deducted from recharge vs balance
        // For old transactions, we'll assume they used recharge first if available
        const rechargeDeposits = await Transaction.aggregate([
          { 
            $match: { 
              phone, 
              status: TransactionStatus.COMPLETED, 
              type: TransactionType.DEPOSIT, 
              'metadata.source': 'recharge',
              createdAt: { $lt: transaction.createdAt }
            } 
          },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRechargeBefore = rechargeDeposits[0]?.total || 0;

        // Calculate how much was already used from recharge before this transaction
        const previousRechargeUsage = await Transaction.aggregate([
          { 
            $match: { 
              phone, 
              status: TransactionStatus.COMPLETED, 
              type: TransactionType.PURCHASE, 
              'metadata.fromRecharge': { $exists: true },
              createdAt: { $lt: transaction.createdAt }
            } 
          },
          { $group: { _id: null, total: { $sum: "$metadata.fromRecharge" } } }
        ]);
        const totalRechargeUsedBefore = previousRechargeUsage[0]?.total || 0;

        const availableRechargeBefore = Math.max(0, totalRechargeBefore - totalRechargeUsedBefore);
        
        // Calculate deduction split
        let fromRecharge = 0;
        let fromBalance = 0;
        
        if (availableRechargeBefore >= amount) {
          fromRecharge = amount;
          fromBalance = 0;
        } else {
          fromRecharge = availableRechargeBefore;
          fromBalance = amount - availableRechargeBefore;
        }

        // Update the transaction with proper metadata
        await Transaction.findByIdAndUpdate(transaction._id, {
          $set: {
            'metadata.fromRecharge': fromRecharge,
            'metadata.fromBalance': fromBalance
          }
        });

        console.log(`✅ Fixed transaction ${transaction.transactionId}: fromRecharge=${fromRecharge}, fromBalance=${fromBalance}`);
        fixedCount++;

      } catch (error) {
        console.error(`❌ Error fixing transaction ${transaction.transactionId}:`, error);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} out of ${incompleteTransactions.length} transactions`);
    
    // Verify the fix by checking a few transactions
    console.log('\n🔍 Verification: Checking a few transactions...');
    const sampleTransactions = await Transaction.find({
      type: TransactionType.PURCHASE,
      status: TransactionStatus.COMPLETED
    }).limit(5);

    for (const tx of sampleTransactions) {
      console.log(`Transaction ${tx.transactionId}: fromRecharge=${tx.metadata?.fromRecharge || 'N/A'}, fromBalance=${tx.metadata?.fromBalance || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error in fixTransactionMetadata:', error);
  } finally {
    process.exit(0);
  }
}

fixTransactionMetadata(); 