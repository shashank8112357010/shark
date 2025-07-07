import cron from 'node-cron';
import mongoose from 'mongoose';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import SharkInvestment from '../models/SharkInvestment';
import SharkModel from '../models/Shark';
import Income from '../models/Income';
import { connectDb } from './db';

async function calculateDailyIncome() {
  console.log('🕐 Starting scheduled daily income calculation at 4 AM IST');
  
  try {
    await connectDb();
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Processing income for date: ${todayStr}`);
    
    // Get all active shark investments (only completed purchases)
    const activeInvestments = await SharkInvestment.find({
      transactionId: { $exists: true, $ne: null }
    });
    
    console.log(`🦈 Found ${activeInvestments.length} shark investments to check`);
    
    let totalIncomeProcessed = 0;
    let successfulRecords = 0;
    let skippedRecords = 0;
    let duplicateSkips = 0;
    
    for (const investment of activeInvestments) {
      try {
        const { phone, shark, level, price, date: purchaseDate } = investment;
        
        // Check if transaction is completed
        const purchaseTransaction = await Transaction.findOne({
          transactionId: investment.transactionId,
          status: TransactionStatus.COMPLETED
        });
        
        if (!purchaseTransaction) {
          console.log(`⏭️ Skipping ${shark} for ${phone} - Purchase not completed`);
          skippedRecords++;
          continue;
        }
        
        // 🔒 DUPLICATE PROTECTION: Check if income already processed for today
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const existingIncome = await Income.findOne({
          phone: phone,
          sharkPurchaseId: investment._id.toString(),
          date: {
            $gte: todayStart,
            $lt: todayEnd
          }
        });
        
        if (existingIncome) {
          console.log(`🛡️ Income already processed for ${shark} (${phone}) on ${todayStr}`);
          duplicateSkips++;
          continue;
        }
        
        // Get shark details to fetch daily income
        const sharkDetails = await SharkModel.findOne({
          title: shark,
          levelNumber: level
        });
        
        if (!sharkDetails) {
          console.log(`⚠️ Shark details not found: ${shark} (Level ${level})`);
          skippedRecords++;
          continue;
        }
        
        const dailyIncome = sharkDetails.dailyIncome;
        
        if (!dailyIncome || dailyIncome <= 0) {
          console.log(`⚠️ Invalid daily income for ${shark}: ₹${dailyIncome}`);
          skippedRecords++;
          continue;
        }
        
        // Check if investment duration is still valid
        const daysSincePurchase = Math.floor((today - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
        
        if (daysSincePurchase >= sharkDetails.durationDays) {
          console.log(`⏰ Investment expired: ${shark} (${phone}) - ${daysSincePurchase}/${sharkDetails.durationDays} days`);
          skippedRecords++;
          continue;
        }
        
        // Create income transaction (adds to user's balance)
        const incomeTransactionId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const incomeTransaction = new Transaction({
          phone,
          type: TransactionType.DEPOSIT, // Income adds to balance
          amount: dailyIncome,
          status: TransactionStatus.COMPLETED,
          transactionId: incomeTransactionId,
          description: `Daily income from ${shark} - Day ${daysSincePurchase + 1}/${sharkDetails.durationDays}`,
          metadata: {
            incomeType: 'daily_shark_income',
            sharkTitle: shark,
            sharkLevel: level,
            dayNumber: daysSincePurchase + 1,
            totalDays: sharkDetails.durationDays,
            sharkPurchaseId: investment._id.toString(),
            processedDate: todayStr
          }
        });
        await incomeTransaction.save();
        
        // Record income in Income collection (for tracking)
        const incomeRecord = new Income({
          phone: phone,
          date: today,
          sharkTitle: shark,
          sharkLevel: level,
          dailyIncomeAmount: dailyIncome,
          sharkPurchaseId: investment._id.toString(),
          transactionId: incomeTransactionId
        });
        await incomeRecord.save();
        
        totalIncomeProcessed += dailyIncome;
        successfulRecords++;
        
        console.log(`✅ ₹${dailyIncome} income processed for ${phone} from ${shark} (Day ${daysSincePurchase + 1}/${sharkDetails.durationDays})`);
        
      } catch (error: any) {
        console.error(`❌ Error processing ${investment.shark} for ${investment.phone}:`, error.message);
        skippedRecords++;
      }
    }
    
    console.log(`\n🎉 Daily income calculation completed!`);
    console.log(`📊 Summary for ${todayStr}:`);
    console.log(`   - Total investments checked: ${activeInvestments.length}`);
    console.log(`   - Successful income records: ${successfulRecords}`);
    console.log(`   - Duplicate skips (already processed): ${duplicateSkips}`);
    console.log(`   - Other skips: ${skippedRecords}`);
    console.log(`   - Total income distributed: ₹${totalIncomeProcessed}`);
    
    if (successfulRecords > 0) {
      console.log(`💰 Income has been added to user balances and income records`);
    }
    
  } catch (error: any) {
    console.error('❌ Error in daily income calculation:', error);
  }
}

// Export function to start the scheduler
export function startIncomeScheduler() {
  // Schedule the task to run daily at 4 AM IST
  cron.schedule('0 4 * * *', () => {
    console.log('\n🚀 Running scheduled income calculation at 4 AM IST');
    calculateDailyIncome();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata' // IST timezone
  });
  
  console.log('📅 Income scheduler configured to run daily at 4:00 AM IST');
}

// Export function for manual trigger (for testing)
export async function triggerIncomeCalculation() {
  console.log('🔧 Manual income calculation triggered');
  await calculateDailyIncome();
}
