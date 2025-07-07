import { connectDb } from './server/utils/db.js';
import { triggerIncomeCalculation } from './server/utils/incomeScheduler.js';

async function testDuplicateProtection() {
  console.log('🧪 Testing Income Duplicate Protection\n');
  
  try {
    await connectDb();
    
    console.log('1️⃣ Running first income calculation...');
    await triggerIncomeCalculation();
    
    console.log('\n2️⃣ Running second income calculation (should skip duplicates)...');
    await triggerIncomeCalculation();
    
    console.log('\n✅ Duplicate protection test completed!');
    console.log('Check the logs above - the second run should show "Income already processed" messages.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    process.exit(0);
  }
}

testDuplicateProtection();
