import cron from 'node-cron';
import mongoose from 'mongoose';
import Transaction, { TransactionType, TransactionStatus } from '../models/Transaction.js';
import SharkInvestment from '../models/SharkInvestment.js';
import SharkModel from '../models/Shark.js';
import Income from '../models/Income.js';
import { connectDb } from '../utils/db.js';

// Add INCOME transaction type
const INCOME_TRANSACTION_TYPE = 'income';

async function calculateAndRecordIncome() {
  console.log('🕐 Starting daily income calculation at 4 AM IST');
  
  try {
    await connectDb();
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`📅 Processing income for date: ${todayStr}`);
    
    // Get all active shark investments (only completed purchases)
    const activeInvestments = await SharkInvestment.find({
      transactionId: { $exists: true, $ne: null }
    }).populate('transactionId');
    
    console.log(`🦈 Found ${activeInvestments.length} active shark investments`);
    
    let totalIncomeProcessed = 0;
    let successfulRecords = 0;
    
    for (const investment of activeInvestments) {
      try {
        const { phone, shark, level, price, date: purchaseDate } = investment;
        
        // Check if transaction is completed
        const purchaseTransaction = await Transaction.findOne({
          transactionId: investment.transactionId,
          status: TransactionStatus.COMPLETED
        });
        
        if (!purchaseTransaction) {
          console.log(`⏭️  Skipping ${shark} for ${phone} - Purchase not completed`);
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
          console.log(`⏭️  Income already processed for ${shark} (${phone}) today`);
          continue;
        }
        
        // Get shark details to fetch daily income
        const sharkDetails = await SharkModel.findOne({
          title: shark,
          levelNumber: level
        });
        
        if (!sharkDetails) {
          console.log(`⚠️  Shark details not found for ${shark} (Level ${level})`);
          continue;
        }
        
        const dailyIncome = sharkDetails.dailyIncome;
        
        if (!dailyIncome || dailyIncome <= 0) {
          console.log(`⚠️  Invalid daily income for ${shark}: ${dailyIncome}`);
          continue;
        }
        
        // Check if investment duration is still valid
        const daysSincePurchase = Math.floor((today - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
        if (daysSincePurchase >= sharkDetails.durationDays) {
          console.log(`⏰ Investment period expired for ${shark} (${phone}) - ${daysSincePurchase}/${sharkDetails.durationDays} days`);
          continue;
        }
        
        // Create income transaction
        const incomeTransactionId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const incomeTransaction = new Transaction({
          phone,
          type: TransactionType.DEPOSIT, // Using DEPOSIT type for income (adds to balance)
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
        
        // Record income in Income model
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
        
        console.log(`✅ Recorded ₹${dailyIncome} income for ${phone} from ${shark} (Day ${daysSincePurchase + 1}/${sharkDetails.durationDays})`);
        
      } catch (error) {
        console.error(`❌ Failed to process income for ${investment.shark} (${investment.phone}):`, error.message);
      }
    }
    
    console.log(`🎉 Income calculation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total investments checked: ${activeInvestments.length}`);
    console.log(`   - Successful income records: ${successfulRecords}`);
    console.log(`   - Total income processed: ₹${totalIncomeProcessed}`);
    
  } catch (error) {
    console.error('❌ Error in income calculation process:', error);
  }
}

// Schedule the task to run daily at 4 AM IST
cron.schedule('0 4 * * *', () => {
  console.log('Running the scheduled income calculation task at 4 AM IST');
  calculateAndRecordIncome();
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata' // Define timezone for IST
});
