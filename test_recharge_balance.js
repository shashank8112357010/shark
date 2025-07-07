const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_PHONE = '9999999999';
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';

async function testRechargeBalanceFlow() {
  console.log('🧪 Testing Recharge Balance Flow\n');
  
  try {
    // Step 1: Check initial balance
    console.log('1. Checking initial balance...');
    const initialBalanceRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const initialBalance = initialBalanceRes.data.balance;
    console.log(`   Initial balance: ₹${initialBalance}\n`);

    // Step 2: Create a recharge request
    console.log('2. Creating recharge request...');
    const rechargeAmount = 1000;
    const rechargeReqRes = await axios.post(`${BASE_URL}/wallet/recharge-request`, {
      phone: TEST_PHONE,
      amount: rechargeAmount,
      utrNumber: `UTR${Date.now()}`,
      qrCode: 'test-qr-code'
    });
    console.log(`   Recharge request created: ${rechargeReqRes.data.message}`);
    console.log(`   Request ID: ${rechargeReqRes.data.requestId}\n`);

    // Step 3: Admin login
    console.log('3. Logging in as admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/login`, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    });
    const adminToken = adminLoginRes.data.token;
    console.log(`   Admin logged in successfully\n`);

    // Step 4: Get recharge requests
    console.log('4. Fetching pending recharge requests...');
    const rechargeRequestsRes = await axios.get(`${BASE_URL}/admin/recharge-requests?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingRequests = rechargeRequestsRes.data.rechargeRequests;
    console.log(`   Found ${pendingRequests.length} pending request(s)\n`);

    if (pendingRequests.length === 0) {
      console.log('❌ No pending recharge requests found. Test failed.');
      return;
    }

    // Step 5: Approve the latest recharge request
    const requestToApprove = pendingRequests[0];
    console.log('5. Approving recharge request...');
    const approvalRes = await axios.post(
      `${BASE_URL}/admin/recharge-requests/${requestToApprove._id}/review`,
      {
        status: 'approved',
        adminNotes: 'Test approval',
        approvedAmount: rechargeAmount
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log(`   Recharge approved: ${approvalRes.data.message}\n`);

    // Step 6: Check balance after approval
    console.log('6. Checking balance after approval...');
    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalBalanceRes = await axios.get(`${BASE_URL}/wallet/balance/${TEST_PHONE}`);
    const finalBalance = finalBalanceRes.data.balance;
    console.log(`   Final balance: ₹${finalBalance}`);
    console.log(`   Expected balance: ₹${initialBalance + rechargeAmount}`);
    
    // Step 7: Verify the balance increase
    const expectedBalance = initialBalance + rechargeAmount;
    if (Math.abs(finalBalance - expectedBalance) < 0.01) { // Allow for floating point precision
      console.log('\n✅ SUCCESS: Balance updated correctly after recharge approval!');
      console.log(`   Balance increased by ₹${finalBalance - initialBalance}`);
    } else {
      console.log('\n❌ FAILURE: Balance not updated correctly');
      console.log(`   Expected increase: ₹${rechargeAmount}`);
      console.log(`   Actual increase: ₹${finalBalance - initialBalance}`);
    }

    // Step 8: Check transactions
    console.log('\n7. Checking transaction history...');
    const historyRes = await axios.get(`${BASE_URL}/shark/history/${TEST_PHONE}`);
    const transactions = historyRes.data.transactions || [];
    const recentDeposits = transactions.filter(tx => tx.type === 'deposit').slice(0, 3);
    console.log(`   Recent deposit transactions:`);
    recentDeposits.forEach(tx => {
      console.log(`   - ${tx.description}: ₹${tx.amount} (${tx.status})`);
    });

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.response?.data || error.message);
  }
}

// Run the test
testRechargeBalanceFlow();
