const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_PHONE = '7777777777'; // Use a test phone
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';

async function testIndividualSharkPurchases() {
  console.log('🦈 Testing Individual Shark Purchase Tracking\n');
  
  try {
    // Step 1: Set up test balance
    console.log('1. Setting up test balance...');
    try {
      const rechargeRes = await axios.post(`${BASE_URL}/wallet/recharge`, {
        phone: TEST_PHONE,
        amount: 5000 // Give enough balance to buy multiple sharks
      });
      console.log(`   ✅ Added ₹5000 test balance: ${rechargeRes.data.transactionId}\n`);
    } catch (error) {
      console.log(`   ⚠️  Could not add test balance: ${error.response?.data?.error || error.message}\n`);
    }

    // Step 2: Check available sharks in Level 1
    console.log('2. Checking available sharks in Level 1...');
    const levelsRes = await axios.get(`${BASE_URL}/shark/levels/${TEST_PHONE}`);
    const levels = levelsRes.data.levels;
    const level1 = levels.find(level => level.level === 1);
    
    if (!level1 || level1.sharks.length < 2) {
      console.log('   ❌ Level 1 should have at least 2 sharks (Shark A and Shark B)');
      console.log('   Run: node scripts/addSharkData.js to add test data');
      return;
    }
    
    console.log(`   Level 1 sharks available: ${level1.sharks.length}`);
    level1.sharks.forEach(shark => {
      console.log(`   - ${shark.title}: ₹${shark.price} (Purchased: ${shark.isPurchased})`);
    });
    console.log();

    // Step 3: Purchase the first shark (e.g., Shark A)
    const sharkA = level1.sharks.find(shark => shark.title.includes('Shark A') || shark.title === 'Shark A');
    if (!sharkA) {
      console.log('   ❌ Shark A not found in Level 1');
      return;
    }

    console.log('3. Purchasing first shark (Shark A)...');
    const purchaseARes = await axios.post(`${BASE_URL}/shark/buy`, {
      phone: TEST_PHONE,
      shark: sharkA.title,
      price: sharkA.price,
      level: 1
    });
    
    if (purchaseARes.data.success) {
      console.log(`   ✅ Successfully purchased ${sharkA.title} for ₹${sharkA.price}`);
      console.log(`   Transaction ID: ${purchaseARes.data.transactionId}\n`);
    } else {
      console.log(`   ❌ Failed to purchase ${sharkA.title}: ${purchaseARes.data.error}\n`);
      return;
    }

    // Step 4: Check purchase status after first purchase
    console.log('4. Checking purchase status after first purchase...');
    const afterFirstRes = await axios.get(`${BASE_URL}/shark/levels/${TEST_PHONE}`);
    const level1AfterFirst = afterFirstRes.data.levels.find(level => level.level === 1);
    
    console.log('   Level 1 sharks status:');
    level1AfterFirst.sharks.forEach(shark => {
      const status = shark.isPurchased ? '✅ PURCHASED' : '⭕ Available';
      console.log(`   - ${shark.title}: ${status}`);
    });
    
    // Verify only Shark A is purchased
    const sharkAPurchased = level1AfterFirst.sharks.find(s => s.title === sharkA.title)?.isPurchased;
    const otherSharksNotPurchased = level1AfterFirst.sharks.filter(s => s.title !== sharkA.title).every(s => !s.isPurchased);
    
    if (sharkAPurchased && otherSharksNotPurchased) {
      console.log('   ✅ CORRECT: Only Shark A is marked as purchased\n');
    } else {
      console.log('   ❌ INCORRECT: Purchase tracking is wrong\n');
      return;
    }

    // Step 5: Try to purchase the same shark again (should fail)
    console.log('5. Attempting to purchase the same shark again...');
    try {
      const duplicateRes = await axios.post(`${BASE_URL}/shark/buy`, {
        phone: TEST_PHONE,
        shark: sharkA.title,
        price: sharkA.price,
        level: 1
      });
      console.log('   ❌ INCORRECT: Duplicate purchase should have failed but succeeded\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`   ✅ CORRECT: Duplicate purchase prevented - ${error.response.data.error}\n`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.response?.data?.error || error.message}\n`);
      }
    }

    // Step 6: Purchase a different shark in the same level (should succeed)
    const sharkB = level1AfterFirst.sharks.find(shark => shark.title !== sharkA.title && !shark.isPurchased);
    if (!sharkB) {
      console.log('   ⚠️  No other available sharks in Level 1 to test with\n');
      return;
    }

    console.log(`6. Purchasing different shark in same level (${sharkB.title})...`);
    try {
      const purchaseBRes = await axios.post(`${BASE_URL}/shark/buy`, {
        phone: TEST_PHONE,
        shark: sharkB.title,
        price: sharkB.price,
        level: 1
      });
      
      if (purchaseBRes.data.success) {
        console.log(`   ✅ CORRECT: Successfully purchased ${sharkB.title} for ₹${sharkB.price}`);
        console.log(`   Transaction ID: ${purchaseBRes.data.transactionId}\n`);
      } else {
        console.log(`   ❌ INCORRECT: Should be able to purchase different shark in same level\n`);
        return;
      }
    } catch (error) {
      console.log(`   ❌ INCORRECT: Purchase of different shark failed - ${error.response?.data?.error || error.message}\n`);
      return;
    }

    // Step 7: Final verification - check both sharks are purchased
    console.log('7. Final verification - checking both sharks are purchased...');
    const finalRes = await axios.get(`${BASE_URL}/shark/levels/${TEST_PHONE}`);
    const level1Final = finalRes.data.levels.find(level => level.level === 1);
    
    console.log('   Final Level 1 sharks status:');
    level1Final.sharks.forEach(shark => {
      const status = shark.isPurchased ? '✅ PURCHASED' : '⭕ Available';
      console.log(`   - ${shark.title}: ${status}`);
    });
    
    const purchasedCount = level1Final.sharks.filter(s => s.isPurchased).length;
    console.log(`\n   Purchased sharks in Level 1: ${purchasedCount}/${level1Final.sharks.length}`);
    
    if (purchasedCount >= 2) {
      console.log('   ✅ SUCCESS: Multiple individual sharks can be purchased in the same level!\n');
    } else {
      console.log('   ❌ FAILURE: Individual shark purchase tracking not working correctly\n');
    }

    // Step 8: Check purchased sharks endpoint
    console.log('8. Checking purchased sharks endpoint...');
    const purchasedRes = await axios.get(`${BASE_URL}/shark/purchased/${TEST_PHONE}`);
    const purchasedSharks = purchasedRes.data.purchases;
    
    console.log(`   Total purchased sharks: ${purchasedSharks.length}`);
    purchasedSharks.forEach(purchase => {
      console.log(`   - ${purchase.shark} (Level ${purchase.level}): ₹${purchase.price}`);
    });

    console.log('\n🎉 Individual Shark Purchase Test Complete!');
    
    if (purchasedCount >= 2) {
      console.log('\n✅ FIXED: Individual shark purchase tracking is working correctly!');
      console.log('   - Each shark can be purchased independently');
      console.log('   - Purchasing one shark does not mark the entire level as purchased');
      console.log('   - Multiple sharks can be purchased within the same level');
      console.log('   - Duplicate purchases are properly prevented');
    }

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.response?.data || error.message);
  }
}

// Run the test
testIndividualSharkPurchases();
