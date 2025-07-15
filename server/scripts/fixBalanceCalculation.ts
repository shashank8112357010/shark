import { connectDb } from '../utils/db';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import { calculateAvailableRecharge } from '../utils/balanceCalculator';

export async function fixBalanceCalculation() {
  await connectDb();
  
  console.log('🔍 Starting balance calculation fix...');
  
  // Get all users with transactions
  const users = await Transaction.distinct('phone');
  console.log(`Found ${users.length} users with transactions`);
  
  for (const phone of users) {
    console.log(`\n📱 Checking user: ${phone}`);
    
    // Get all transactions for this user
    const allTransactions = await Transaction.find({ phone }).sort({ createdAt: -1 });
    console.log(`  Total transactions: ${allTransactions.length}`);
    
    // Get recharge deposits
    const rechargeDeposits = await Transaction.find({ 
      phone, 
      status: TransactionStatus.COMPLETED, 
      type: TransactionType.DEPOSIT,
      'metadata.source': 'recharge' 
    });
    
    let totalRechargeDeposits = 0;
    rechargeDeposits.forEach(tx => {
      totalRechargeDeposits += tx.amount;
    });
    console.log(`  Recharge deposits: ${rechargeDeposits.length} transactions = ₹${totalRechargeDeposits}`);
    
    // Get purchases with fromRecharge
    const purchases = await Transaction.find({ 
      phone, 
      status: TransactionStatus.COMPLETED, 
      type: TransactionType.PURCHASE,
      'metadata.fromRecharge': { $exists: true }
    });
    
    let totalFromRecharge = 0;
    purchases.forEach(tx => {
      const fromRecharge = tx.metadata?.fromRecharge || 0;
      totalFromRecharge += fromRecharge;
    });
    console.log(`  Purchase deductions: ${purchases.length} transactions = ₹${totalFromRecharge}`);
    
    // Calculate expected available recharge
    const expectedAvailableRecharge = totalRechargeDeposits - totalFromRecharge;
    console.log(`  Expected available recharge: ₹${expectedAvailableRecharge}`);
    
    // Calculate using our function
    const calculatedAvailableRecharge = await calculateAvailableRecharge(phone);
    console.log(`  Calculated available recharge: ₹${calculatedAvailableRecharge}`);
    
    // Check if they match
    if (expectedAvailableRecharge === calculatedAvailableRecharge) {
      console.log(`  ✅ Balance calculation is correct!`);
    } else {
      console.log(`  ❌ Balance calculation mismatch!`);
      console.log(`  Difference: ₹${expectedAvailableRecharge - calculatedAvailableRecharge}`);
      
      // Show detailed breakdown
      console.log('\n  📋 Detailed transaction breakdown:');
      rechargeDeposits.forEach((tx, i) => {
        console.log(`    ${i + 1}. RECHARGE: +₹${tx.amount} - ${tx.description} (${tx.createdAt})`);
      });
      
      purchases.forEach((tx, i) => {
        const fromRecharge = tx.metadata?.fromRecharge || 0;
        console.log(`    ${i + 1}. PURCHASE: -₹${fromRecharge} (total: ₹${tx.amount}) - ${tx.description} (${tx.createdAt})`);
      });
    }
  }
}

// Run the fix
if (require.main === module) {
  fixBalanceCalculation()
    .then(() => {
      console.log('\n✅ Balance calculation check completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
