import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';

/**
 * Calculate user balance using consistent logic across the application
 * Only counts completed transactions to ensure accurate balance
 */
export async function calculateUserBalance(phone: string): Promise<number> {
  // Sum all non-recharge DEPOSITs (referral earnings, daily income, etc.)
  const nonRechargeDeposits = await Transaction.aggregate([
   
    { $match: { phone, status: TransactionStatus.COMPLETED, type: TransactionType.DEPOSIT,
      $or: [
        { 'metadata.source': { $exists: false } },
        { 'metadata.source': { $ne: 'recharge' } },
        { 'metadata.incomeType': { $exists: false } },
        { 'metadata.incomeType': { $ne: 'recharge' } }
      ]
    } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalNonRechargeDeposits = nonRechargeDeposits[0]?.total || 0;

  // Sum all PURCHASEs' fromBalance (from metadata) - this is what was deducted from non-recharge balance
  const purchases = await Transaction.aggregate([
    { $match: { phone, status: TransactionStatus.COMPLETED, type: TransactionType.PURCHASE, 'metadata.fromBalance': { $exists: true } } },
    { $group: { _id: null, total: { $sum: "$metadata.fromBalance" } } }
  ]);
  const totalFromBalance = purchases[0]?.total || 0;

  // Subtract withdrawals
  const withdrawals = await Transaction.aggregate([
    { $match: { phone, status: TransactionStatus.COMPLETED, type: TransactionType.WITHDRAWAL } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalWithdrawals = withdrawals[0]?.total || 0;

  // Non-recharge balance = non-recharge deposits - fromBalance (purchases) - withdrawals
  return totalNonRechargeDeposits - totalFromBalance - totalWithdrawals;
}

/**
 * Check if user has sufficient balance for a transaction
 */
export async function checkSufficientBalance(phone: string, amount: number): Promise<{ hasBalance: boolean; currentBalance: number }> {
  const currentBalance = await calculateUserBalance(phone);
  return {
    hasBalance: currentBalance >= amount,
    currentBalance
  };
}

/**
 * Calculate available recharge amount for a user (sum of all completed DEPOSITs with metadata.source === 'recharge', minus all PURCHASEs that used recharge)
 */
export async function calculateAvailableRecharge(phone: string): Promise<number> {
  // console.log(`Calculating available recharge for user: ${phone}`);
  // Sum all completed recharge DEPOSITs
  const rechargeDeposits = await Transaction.aggregate([
    { $match: { phone, status: TransactionStatus.COMPLETED, type: TransactionType.DEPOSIT, 'metadata.source': 'recharge' } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalRecharge = rechargeDeposits[0]?.total || 0;

  // Sum all PURCHASEs' fromRecharge (from metadata) - this is what was deducted from recharge
  const purchases = await Transaction.aggregate([
    { $match: { phone, status: TransactionStatus.COMPLETED, type: TransactionType.PURCHASE, 'metadata.fromRecharge': { $exists: true } } },
    { $group: { _id: null, total: { $sum: "$metadata.fromRecharge" } } }
  ]);
  const totalFromRecharge = purchases[0]?.total || 0;

  // Available recharge is recharge - what was actually used from recharge
  return Math.max(0, totalRecharge - totalFromRecharge);
}

/**
 * Calculate available non-recharge balance (referral, daily income, etc.)
 */
export async function calculateAvailableNonRechargeBalance(phone: string): Promise<number> {
  const totalBalance = await calculateUserBalance(phone);
  // This is already excluding recharge, so just return it
  return totalBalance;
}

/**
 * Calculate total balance (recharge + non-recharge) for display purposes
 * Since shark purchases only use recharge, we should only show recharge balance
 */
export async function calculateTotalBalance(phone: string): Promise<number> {
  // Since shark purchases only use recharge balance, we should only show recharge balance
  // Non-recharge balance (referral, daily income) should be kept separate
  const rechargeBalance = await calculateAvailableRecharge(phone);
  return rechargeBalance;
}
