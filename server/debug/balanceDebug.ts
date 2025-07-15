import { connectDb } from '../utils/db';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import { calculateAvailableRecharge } from '../utils/balanceCalculator';

export async function debugUserBalance(phone: string) {
  await connectDb();
  
  console.log(`\n=== DEBUGGING BALANCE FOR ${phone} ===`);
  
  // Get all transactions for this user
  const allTransactions = await Transaction.find({ phone }).sort({ createdAt: -1 });
  
  console.log(`\nAll transactions (${allTransactions.length}):`);
  allTransactions.forEach((tx, i) => {
    console.log(`${i + 1}. ${tx.type.toUpperCase()} - ₹${tx.amount} - Status: ${tx.status}`);
    console.log(`   Description: ${tx.description}`);
    console.log(`   Metadata:`, tx.metadata);
    console.log(`   Date: ${tx.createdAt}`);
    console.log('---');
  });

  // Get recharge deposits
  const rechargeDeposits = await Transaction.find({ 
    phone, 
    status: TransactionStatus.COMPLETED, 
    type: TransactionType.DEPOSIT,
    'metadata.source': 'recharge' 
  });
  
  console.log(`\nRecharge deposits (${rechargeDeposits.length}):`);
  let totalRechargeDeposits = 0;
  rechargeDeposits.forEach((tx, i) => {
    console.log(`${i + 1}. ₹${tx.amount} - ${tx.description}`);
    totalRechargeDeposits += tx.amount;
  });
  console.log(`Total recharge deposits: ₹${totalRechargeDeposits}`);

  // Get purchases with fromRecharge
  const purchases = await Transaction.find({ 
    phone, 
    status: TransactionStatus.COMPLETED, 
    type: TransactionType.PURCHASE,
    'metadata.fromRecharge': { $exists: true }
  });
  
  console.log(`\nPurchases with fromRecharge (${purchases.length}):`);
  let totalFromRecharge = 0;
  purchases.forEach((tx, i) => {
    const fromRecharge = tx.metadata?.fromRecharge || 0;
    console.log(`${i + 1}. ${tx.description} - Total: ₹${tx.amount}, FromRecharge: ₹${fromRecharge}`);
    totalFromRecharge += fromRecharge;
  });
  console.log(`Total deducted from recharge: ₹${totalFromRecharge}`);

  // Calculate expected available recharge
  const expectedAvailableRecharge = totalRechargeDeposits - totalFromRecharge;
  console.log(`\nExpected available recharge: ₹${expectedAvailableRecharge}`);

  // Calculate using our function
  const calculatedAvailableRecharge = await calculateAvailableRecharge(phone);
  console.log(`Calculated available recharge: ₹${calculatedAvailableRecharge}`);

  // Check if they match
  if (expectedAvailableRecharge === calculatedAvailableRecharge) {
    console.log('✅ Balance calculation is correct!');
  } else {
    console.log('❌ Balance calculation mismatch!');
    console.log(`Difference: ₹${expectedAvailableRecharge - calculatedAvailableRecharge}`);
  }

  return {
    totalRechargeDeposits,
    totalFromRecharge,
    expectedAvailableRecharge,
    calculatedAvailableRecharge
  };
}

// Usage: Call this function with a phone number to debug
// debugUserBalance('1234567890');
