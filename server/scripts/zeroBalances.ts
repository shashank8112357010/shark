import mongoose from 'mongoose';
import { calculateUserBalance } from '../utils/balanceCalculator';
import { connectDb } from '../utils/db';
import { IUser } from '../models/User';
import User from '../models/User';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';


async function zeroBalances() {
  console.log('Starting zeroBalances script');
  try {
    console.log('Connecting to the database...');
    await connectDb(); // Connect to the database
    console.log('Database connected!');

    const users = await User.find({}); // Fetch all users

    for (const user of users) {
      const phone = user.phone;

      console.log(`Processing user: ${phone}`);
      const currentNonRechargeBalance = await calculateUserBalance(phone);
      console.log(`User ${phone}: Current non-recharge balance = ${currentNonRechargeBalance}`);
      let currentRechargeBalance = 0;
      console.log(`User ${phone}: Current recharge balance = ${currentRechargeBalance}`);

      if (currentNonRechargeBalance !== 0) {
        let transactionType: TransactionType;
        let amount: number;
        let description: string;

        if (currentNonRechargeBalance > 0) {
          transactionType = TransactionType.WITHDRAWAL;
          amount = currentNonRechargeBalance;
          description = 'Balance adjustment (zeroing out) Non-Recharge Balance';
        } else {
          transactionType = TransactionType.DEPOSIT;
          amount = Math.abs(currentNonRechargeBalance);
          description = 'Balance adjustment (zeroing out) Non-Recharge Balance';
        }

        const transactionId = 'BALANCE_ADJUSTMENT_' + Date.now() + '_' + Math.random().toString(36).substring(7);

        const transaction = new Transaction({
          phone: phone,
          type: transactionType,
          amount: amount,
          status: TransactionStatus.COMPLETED,
          transactionId: transactionId,
          description: description,
        });

        await transaction.save();

        console.log(`User ${phone}: Adjusted balance by ${amount} (${transactionType}). Transaction ID: ${transactionId}`);
      } else {
        console.log(`User ${phone}: Non-Recharge Balance already zero`);
      }
       if (currentRechargeBalance !== 0) {
        let transactionType: TransactionType;
        let amount: number;
        let description: string;
        if (currentRechargeBalance > 0) {
          transactionType = TransactionType.WITHDRAWAL;
          amount = currentRechargeBalance;
          description = 'Balance adjustment (zeroing out) Recharge Balance';
        } else {
          transactionType = TransactionType.DEPOSIT;
          amount = Math.abs(currentRechargeBalance);
          description = 'Balance adjustment (zeroing out) Recharge Balance';
        }

        const transactionId = 'BALANCE_ADJUSTMENT_' + Date.now() + '_' + Math.random().toString(36).substring(7);

        const transaction = new Transaction({
          phone: phone,
          type: transactionType,
          amount: amount,
          status: TransactionStatus.COMPLETED,
          transactionId: transactionId,
          description: description,
        });

        await transaction.save();

        console.log(`User ${phone}: Adjusted recharge balance by ${amount} (${transactionType}). Transaction ID: ${transactionId}`);
      } else {
        console.log(`User ${phone}: Recharge Balance already zero`);
      }
    }

    console.log('All balances zeroed!');
  } catch (error) {
    console.error('Error zeroing balances:', error);
  } finally {
    mongoose.disconnect(); // Disconnect from the database
  }
}

zeroBalances();