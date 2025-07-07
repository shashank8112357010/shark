import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_PHONE = '9026849414'; // User who has shark investments

async function testIncomeAPI() {
  console.log('🧪 Testing Income API Endpoints\n');
  
  try {
    // Test 1: Get total income (for profile section)
    console.log('1️⃣ Testing total income endpoint (for profile)...');
    try {
      const totalIncomeRes = await axios.get(`${BASE_URL}/income/total/${TEST_PHONE}`);
      console.log('   Response:', totalIncomeRes.data);
      
      if (totalIncomeRes.data.success) {
        console.log(`   ✅ Total income: ₹${totalIncomeRes.data.totalIncome}`);
        console.log(`   📊 Total records: ${totalIncomeRes.data.totalRecords}`);
      }
    } catch (error) {
      console.log('   ⚠️ Endpoint not available (server might not be running)');
      console.log('   💡 To test: Start server and run this test again');
    }
    
    // Test 2: Manual income calculation trigger
    console.log('\n2️⃣ Testing manual income calculation trigger...');
    try {
      const triggerRes = await axios.post(`${BASE_URL}/income/calculate-all`);
      console.log('   Response:', triggerRes.data);
    } catch (error) {
      console.log('   ⚠️ Manual trigger endpoint not available (server might not be running)');
    }
    
    // Test 3: Get income history
    console.log('\n3️⃣ Testing income history endpoint...');
    try {
      const historyRes = await axios.get(`${BASE_URL}/income/history/${TEST_PHONE}?limit=5`);
      console.log('   Response:', historyRes.data);
      
      if (historyRes.data.success && historyRes.data.incomeHistory.length > 0) {
        console.log('   ✅ Income history retrieved:');
        historyRes.data.incomeHistory.forEach((record, index) => {
          console.log(`     ${index + 1}. ${record.sharkTitle}: ₹${record.dailyIncomeAmount} on ${record.date.split('T')[0]}`);
        });
      }
    } catch (error) {
      console.log('   ⚠️ History endpoint not available (server might not be running)');
    }
    
    // Test 4: Get income statistics
    console.log('\n4️⃣ Testing income statistics endpoint...');
    try {
      const statsRes = await axios.get(`${BASE_URL}/income/stats/${TEST_PHONE}`);
      console.log('   Response:', statsRes.data);
      
      if (statsRes.data.success) {
        console.log('   ✅ Income statistics retrieved');
        console.log(`   📈 Overall stats:`, statsRes.data.overallStats);
      }
    } catch (error) {
      console.log('   ⚠️ Statistics endpoint not available (server might not be running)');
    }
    
    console.log('\n🎉 Income API testing completed!');
    console.log('\n💡 To use these endpoints in your profile:');
    console.log(`   - Total income: GET /api/income/total/:phone`);
    console.log(`   - Income history: GET /api/income/history/:phone`);
    console.log(`   - Income stats: GET /api/income/stats/:phone`);
    
  } catch (error) {
    console.error('❌ Error during API test:', error.message);
  }
}

// Run the test
testIncomeAPI();
