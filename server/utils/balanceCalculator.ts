import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';

/**
 * Calculate user balance using consistent logic across the application
 * Only counts completed transactions to ensure accurate balance
 */
export async function calculateUserBalance(phone: string): Promise<number> {
  const balanceResult = await Transaction.aggregate([
    { $match: { phone, status: TransactionStatus.COMPLETED } }, // Only count completed transactions
    { $group: {
      _id: null,
      balance: { 
        $sum: { 
          $switch: {
            branches: [
              { case: { $eq: ["$type", TransactionType.DEPOSIT] }, then: "$amount" },
              { case: { $eq: ["$type", TransactionType.REFERRAL] }, then: "$amount" },
              { case: { $eq: ["$type", TransactionType.WITHDRAWAL] }, then: { $multiply: ["$amount", -1] } },
              { case: { $eq: ["$type", TransactionType.PURCHASE] }, then: { $multiply: ["$amount", -1] } }
            ],
            default: 0
          }
        }
      }
    }}
  ]);
  
  return balanceResult[0]?.balance || 0;
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
