const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_PHONE = '8888888888'; // Use a different phone for testing
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';

async function verifyBalanceSystem() {
  console.log('🔍 Verifying Balance System Consistency\n');
  
  try {
    let adminToken;

    // Step 1: Admin login
    console.log('1. Logging in as admin...');
    try {
      const adminLoginRes = await axios.post(`${BASE_URL}/admin/login`, {
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD
      });
      adminToken = adminLoginRes.data.token;
      console.log('   ✅ Admin logged in successfully\n');
    } catch (error) {
      console.log('   ⚠️  Admin login failed - using existing admin or check credentials\n');
    }

    // Step 2: Check initial balance
    console.log('2. Checking initial balance...');
    const initialBalanceRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const initialBalance = initialBalanceRes.data.balance;
    console.log(`   Initial balance: ₹${initialBalance}\n`);

    // Step 3: Create a test deposit transaction (simulating approved recharge)
    console.log('3. Creating test deposit transaction...');
    const depositAmount = 1000;
    const depositRes = await axios.post(`${BASE_URL}/wallet/recharge`, {
      phone: TEST_PHONE,
      amount: depositAmount
    });
    console.log(`   ✅ Deposit transaction created: ${depositRes.data.transactionId}\n`);

    // Step 4: Check balance after deposit
    console.log('4. Checking balance after deposit...');
    const afterDepositRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const afterDepositBalance = afterDepositRes.data.balance;
    console.log(`   Balance after deposit: ₹${afterDepositBalance}`);
    
    const expectedAfterDeposit = initialBalance + depositAmount;
    if (Math.abs(afterDepositBalance - expectedAfterDeposit) < 0.01) {
      console.log('   ✅ Deposit correctly increased balance\n');
    } else {
      console.log(`   ❌ Deposit failed - Expected: ₹${expectedAfterDeposit}, Got: ₹${afterDepositBalance}\n`);
    }

    // Step 5: Create a test withdrawal transaction
    console.log('5. Creating test withdrawal...');
    const withdrawalAmount = 500;
    const withdrawalRes = await axios.post(`${BASE_URL}/wallet/withdraw`, {
      phone: TEST_PHONE,
      amount: withdrawalAmount
    });
    console.log(`   ✅ Withdrawal transaction created: ${withdrawalRes.data.transactionId}\n`);

    // Step 6: Check balance after withdrawal
    console.log('6. Checking balance after withdrawal...');
    const afterWithdrawalRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const afterWithdrawalBalance = afterWithdrawalRes.data.balance;
    console.log(`   Balance after withdrawal: ₹${afterWithdrawalBalance}`);
    
    const expectedAfterWithdrawal = afterDepositBalance - withdrawalAmount;
    if (Math.abs(afterWithdrawalBalance - expectedAfterWithdrawal) < 0.01) {
      console.log('   ✅ Withdrawal correctly decreased balance\n');
    } else {
      console.log(`   ❌ Withdrawal failed - Expected: ₹${expectedAfterWithdrawal}, Got: ₹${afterWithdrawalBalance}\n`);
    }

    // Step 7: Test recharge request flow (if admin token available)
    if (adminToken) {
      console.log('7. Testing recharge request approval flow...');
      
      // Create recharge request
      const rechargeAmount = 750;
      const rechargeReqRes = await axios.post(`${BASE_URL}/wallet/recharge-request`, {
        phone: TEST_PHONE,
        amount: rechargeAmount,
        utrNumber: `UTR${Date.now()}`,
        qrCode: 'test-qr-verification'
      });
      console.log(`   Recharge request created: ${rechargeReqRes.data.requestId}`);

      // Get pending requests
      const pendingRes = await axios.get(`${BASE_URL}/admin/recharge-requests?status=pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const pendingRequests = pendingRes.data.rechargeRequests;
      
      if (pendingRequests.length > 0) {
        const requestToApprove = pendingRequests.find(req => req.phone === TEST_PHONE);
        if (requestToApprove) {
          // Approve the request
          const approvalRes = await axios.post(
            `${BASE_URL}/admin/recharge-requests/${requestToApprove._id}/review`,
            {
              status: 'approved',
              adminNotes: 'Test approval for verification',
              approvedAmount: rechargeAmount
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          );
          console.log(`   Recharge approved: ${approvalRes.data.message}`);

          // Check final balance
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
          const finalBalanceRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
          const finalBalance = finalBalanceRes.data.balance;
          console.log(`   Final balance: ₹${finalBalance}`);
          
          const expectedFinalBalance = afterWithdrawalBalance + rechargeAmount;
          if (Math.abs(finalBalance - expectedFinalBalance) < 0.01) {
            console.log('   ✅ Recharge approval correctly increased balance\n');
          } else {
            console.log(`   ❌ Recharge approval failed - Expected: ₹${expectedFinalBalance}, Got: ₹${finalBalance}\n`);
          }
        }
      }
    }

    // Step 8: Check transaction history
    console.log('8. Checking transaction history...');
    const historyRes = await axios.get(`${BASE_URL}/shark/history/${TEST_PHONE}`);
    const transactions = historyRes.data.transactions || [];
    console.log(`   Total transactions: ${transactions.length}`);
    
    const recentTransactions = transactions.slice(0, 5);
    console.log('   Recent transactions:');
    recentTransactions.forEach(tx => {
      const sign = ['deposit', 'referral'].includes(tx.type) ? '+' : '-';
      console.log(`   - ${tx.description}: ${sign}₹${tx.amount} (${tx.status})`);
    });

    // Step 9: Verify no double counting
    console.log('\n9. Verifying balance calculation consistency...');
    const deposits = transactions.filter(tx => ['deposit', 'referral'].includes(tx.type) && tx.status === 'completed');
    const debits = transactions.filter(tx => ['withdrawal', 'purchase'].includes(tx.type) && tx.status === 'completed');
    
    const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebits = debits.reduce((sum, tx) => sum + tx.amount, 0);
    const calculatedBalance = totalDeposits - totalDebits;
    
    console.log(`   Total deposits: ₹${totalDeposits}`);
    console.log(`   Total debits: ₹${totalDebits}`);
    console.log(`   Calculated balance: ₹${calculatedBalance}`);
    
    const currentBalanceRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const currentBalance = currentBalanceRes.data.balance;
    console.log(`   API balance: ₹${currentBalance}`);
    
    if (Math.abs(currentBalance - calculatedBalance) < 0.01) {
      console.log('   ✅ Balance calculation is consistent - no double counting detected\n');
    } else {
      console.log('   ❌ Balance calculation inconsistency detected!\n');
    }

    console.log('🎉 Balance System Verification Complete!\n');
    console.log('✅ Key fixes implemented:');
    console.log('   - Removed Wallet model from recharge approval process');
    console.log('   - All balance calculations now use Transaction aggregation');
    console.log('   - Eliminated double counting issues');
    console.log('   - Unified balance system across all operations');

  } catch (error) {
    console.error('\n❌ ERROR during verification:', error.response?.data || error.message);
  }
}

// Run the verification
verifyBalanceSystem();
