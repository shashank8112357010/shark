import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_PHONE = '9026849414'; // User who has shark investments

async function testProfileIncome() {
  console.log('🧪 Testing Profile Income Integration\n');
  
  try {
    console.log('1️⃣ Testing income total endpoint (used by profile)...');
    
    const response = await axios.get(`${BASE_URL}/income/total/${TEST_PHONE}`);
    
    if (response.data.success) {
      console.log('✅ Income API Response:');
      console.log(`   📊 Total Income: ₹${response.data.totalIncome}`);
      console.log(`   📋 Total Records: ${response.data.totalRecords}`);
      console.log(`   💬 Message: ${response.data.message}`);
      
      console.log('\n💡 This data will now show in the profile page "Income" section');
      console.log('   - Separate from wallet balance');
      console.log('   - Shows cumulative shark earnings');
      console.log('   - Updates when daily income is processed');
      
      if (response.data.totalIncome > 0) {
        console.log('\n🎉 Profile will display income data successfully!');
      } else {
        console.log('\n⚠️  No income records found. Income will show ₹0.00');
        console.log('   💡 Run income calculation to generate records:');
        console.log('      npm run calculate-income');
      }
    } else {
      console.log('❌ API returned success=false:', response.data);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server not running. To test the profile integration:');
      console.log('   1. Start the server: npm start');
      console.log('   2. Open profile page in browser');
      console.log('   3. Check browser console for income loading logs');
      console.log('   4. Verify income amount appears in the Income card');
    } else {
      console.error('❌ Error testing profile income:', error.message);
    }
  }
}

testProfileIncome();
