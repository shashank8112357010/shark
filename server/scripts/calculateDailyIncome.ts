import mongoose from 'mongoose';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction';
import SharkInvestment from '../models/SharkInvestment';
import SharkModel from '../models/Shark';
import Income from '../models/Income';
import { connectDb } from '../utils/db';

async function calculateDailyIncome() {
  console.log('🚀 Starting manual daily income calculation...');
  
  try {
    await connectDb();
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Processing income for date: ${todayStr}`);
    
    // Get all active shark investments
    const activeInvestments = await SharkInvestment.find({
      transactionId: { $exists: true, $ne: null }
    });
    
    console.log(`🦈 Found ${activeInvestments.length} shark investments`);
    
    let totalIncomeProcessed = 0;
    let successfulRecords = 0;
    let skippedRecords = 0;
    
    for (const investment of activeInvestments) {
      try {
        const { phone, shark, level, price, date: purchaseDate } = investment;
        
        console.log(`\n🔍 Processing: ${shark} (Level ${level}) for user ${phone}`);
        
        // Check if transaction is completed
        const purchaseTransaction = await Transaction.findOne({
          transactionId: investment.transactionId,
          status: TransactionStatus.COMPLETED
        });
        
        if (!purchaseTransaction) {
          console.log(` ⏭️ Skipping - Purchase transaction not completed`);
          skippedRecords++;
          continue;
        }
        
        // Check if income already processed for today
        const existingIncome = await Income.findOne({
          phone: phone,
          sharkPurchaseId: investment._id.toString(),
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        });
        
        if (existingIncome) {
          console.log(`   ⏭️ Skipping - Income already processed for today`);
          skippedRecords++;
          continue;
        }
        
        // Get shark details
        const sharkDetails = await SharkModel.findOne({
          title: shark,
          levelNumber: level
        });
        
        if (!sharkDetails) {
          console.log(`   ⚠️ Warning - Shark details not found in database`);
          skippedRecords++;
          continue;
        }
        
        const dailyIncome = sharkDetails.dailyIncome;
        
        if (!dailyIncome || dailyIncome <= 0) {
          console.log(`   ⚠️ Warning - Invalid daily income: ₹${dailyIncome}`);
          skippedRecords++;
          continue;
        }
        
        // Check investment duration
        const daysSincePurchase = Math.floor((today - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
        
        if (daysSincePurchase >= sharkDetails.durationDays) {
          console.log(`   ⏰ Skipping - Investment period expired (${daysSincePurchase}/${sharkDetails.durationDays} days)`);
          skippedRecords++;
          continue;
        }
        
        // Create income transaction
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
            sharkPurchaseId: investment._id.toString()
          }
        });
        await incomeTransaction.save();
        
        // Record income
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
        
        console.log(`   ✅ Success - Recorded ₹${dailyIncome} income (Day ${daysSincePurchase + 1}/${sharkDetails.durationDays})`);
        
      } catch (error: any) {
        console.error(`   ❌ Error processing ${investment.shark} for ${investment.phone}:`, error.message);
        skippedRecords++;
      }
    }
    
    console.log(`\n🎉 Daily income calculation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total investments found: ${activeInvestments.length}`);
    console.log(`   - Successful income records: ${successfulRecords}`);
    console.log(`   - Skipped records: ${skippedRecords}`);
    console.log(`   - Total income processed: ₹${totalIncomeProcessed}`);
    
    if (successfulRecords > 0) {
      console.log(`\n💡 Income has been added to user balances and can be viewed in:`);
      console.log(`   - User wallet balance (increased by income amount)`);
      console.log(`   - Income history via /api/income/history/:phone`);
      console.log(`   - Income statistics via /api/income/stats/:phone`);
    }
    
  } catch (error: any) {
    console.error('❌ Error in daily income calculation:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the calculation
calculateDailyIncome();
