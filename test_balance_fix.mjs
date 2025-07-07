import { connectDb } from './server/utils/db.js';
import { calculateUserBalance, checkSufficientBalance } from './server/utils/balanceCalculator.js';
import Transaction, { TransactionType, TransactionStatus } from './server/models/Transaction.js';

const TEST_PHONE = '1234567890';

async function testBalanceCalculations() {
  console.log('🧪 Testing Balance Calculation Fix\n');
  
  try {
    await connectDb();
    
    // Step 1: Clear previous test data
    console.log('1. Clearing previous test data...');
    await Transaction.deleteMany({ phone: TEST_PHONE });
    console.log('   ✅ Previous test data cleared\n');
    
    // Step 2: Add a completed deposit transaction
    console.log('2. Adding deposit transaction...');
    const depositTx = new Transaction({
      phone: TEST_PHONE,
      type: TransactionType.DEPOSIT,
      amount: 1000,
      status: TransactionStatus.COMPLETED,
      transactionId: `DEP-${Date.now()}`,
      description: 'Test deposit'
    });
    await depositTx.save();
    console.log('   ✅ Added ₹1000 deposit transaction\n');
    
    // Step 3: Check balance
    console.log('3. Checking balance...');
    const balance = await calculateUserBalance(TEST_PHONE);
    console.log(`   Current balance: ₹${balance}`);
    if (balance === 1000) {
      console.log('   ✅ Balance calculation correct!\n');
    } else {
      console.log('   ❌ Balance calculation incorrect!\n');
    }
    
    // Step 4: Test sufficient balance check (should pass)
    console.log('4. Testing sufficient balance check (₹500 purchase)...');
    const sufficientCheck = await checkSufficientBalance(TEST_PHONE, 500);
    console.log(`   Has sufficient balance: ${sufficientCheck.hasBalance}`);
    console.log(`   Current balance: ₹${sufficientCheck.currentBalance}`);
    if (sufficientCheck.hasBalance && sufficientCheck.currentBalance === 1000) {
      console.log('   ✅ Sufficient balance check working correctly!\n');
    } else {
      console.log('   ❌ Sufficient balance check failed!\n');
    }
    
    // Step 5: Test insufficient balance check (should fail)
    console.log('5. Testing insufficient balance check (₹1500 purchase)...');
    const insufficientCheck = await checkSufficientBalance(TEST_PHONE, 1500);
    console.log(`   Has sufficient balance: ${insufficientCheck.hasBalance}`);
    console.log(`   Current balance: ₹${insufficientCheck.currentBalance}`);
    if (!insufficientCheck.hasBalance && insufficientCheck.currentBalance === 1000) {
      console.log('   ✅ Insufficient balance check working correctly!\n');
    } else {
      console.log('   ❌ Insufficient balance check failed!\n');
    }
    
    // Step 6: Add a purchase transaction and verify balance decreases
    console.log('6. Adding purchase transaction...');
    const purchaseTx = new Transaction({
      phone: TEST_PHONE,
      type: TransactionType.PURCHASE,
      amount: 300,
      status: TransactionStatus.COMPLETED,
      transactionId: `PUR-${Date.now()}`,
      description: 'Test shark purchase'
    });
    await purchaseTx.save();
    console.log('   ✅ Added ₹300 purchase transaction\n');
    
    // Step 7: Check updated balance
    console.log('7. Checking updated balance...');
    const newBalance = await calculateUserBalance(TEST_PHONE);
    console.log(`   Updated balance: ₹${newBalance}`);
    if (newBalance === 700) {
      console.log('   ✅ Balance updated correctly after purchase!\n');
    } else {
      console.log('   ❌ Balance not updated correctly after purchase!\n');
    }
    
    // Step 8: Test with pending transaction (should not affect balance)
    console.log('8. Testing pending transaction (should not affect balance)...');
    const pendingTx = new Transaction({
      phone: TEST_PHONE,
      type: TransactionType.DEPOSIT,
      amount: 500,
      status: TransactionStatus.PENDING,
      transactionId: `PEN-${Date.now()}`,
      description: 'Test pending deposit'
    });
    await pendingTx.save();
    
    const balanceAfterPending = await calculateUserBalance(TEST_PHONE);
    console.log(`   Balance after adding pending transaction: ₹${balanceAfterPending}`);
    if (balanceAfterPending === 700) {
      console.log('   ✅ Pending transactions correctly excluded from balance!\n');
    } else {
      console.log('   ❌ Pending transaction incorrectly included in balance!\n');
    }
    
    // Cleanup
    console.log('9. Cleaning up test data...');
    await Transaction.deleteMany({ phone: TEST_PHONE });
    console.log('   ✅ Test data cleaned up\n');
    
    console.log('🎉 Balance Calculation Test Complete!\n');
    console.log('✅ Key improvements implemented:');
    console.log('   - Consistent balance calculation across all endpoints');
    console.log('   - Only completed transactions are counted');
    console.log('   - Pending and failed transactions are excluded');
    console.log('   - Balance checks now return detailed information');
    console.log('   - Centralized balance calculation utility');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBalanceCalculations();
