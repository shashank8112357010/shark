const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanupData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    const db = mongoose.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log('📋 Found collections:', collections.map(c => c.name).join(', '));
    
    // Define collections to keep
    const collectionsToKeep = ['sharks', 'admins'];
    
    // Define collections to clear (but keep the collection structure)
    const collectionsToClear = [
      'users',
      'wallets', 
      'transactions',
      'rechargerequests',
      'withdrawals',
      'sharkinvestments',
      'referrals'
    ];
    
    console.log('\n🧹 Starting data cleanup...\n');
    
    // Clear specified collections
    for (const collectionName of collectionsToClear) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`🗑️  Cleared ${collectionName}: Removed ${result.deletedCount} documents`);
        } else {
          console.log(`✅ ${collectionName}: Already empty`);
        }
      } catch (error) {
        console.log(`⚠️  ${collectionName}: Collection not found or error - ${error.message}`);
      }
    }
    
    // Show what we're keeping
    console.log('\n📦 Preserved collections:');
    for (const collectionName of collectionsToKeep) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`✅ ${collectionName}: ${count} documents preserved`);
      } catch (error) {
        console.log(`⚠️  ${collectionName}: Collection not found - ${error.message}`);
      }
    }
    
    // Show summary
    console.log('\n📊 Cleanup Summary:');
    console.log('✅ KEPT:');
    console.log('   - Sharks: All shark plan data');
    console.log('   - Admins: All admin accounts');
    console.log('');
    console.log('🗑️  CLEARED:');
    console.log('   - Users: All user accounts');
    console.log('   - Wallets: All wallet balances');
    console.log('   - Transactions: All transaction history');
    console.log('   - Recharge Requests: All recharge requests');
    console.log('   - Withdrawals: All withdrawal requests');
    console.log('   - Shark Investments: All shark purchases');
    console.log('   - Referrals: All referral data');
    
    console.log('\n🎉 Data cleanup completed successfully!');
    console.log('💡 The system now has only shark plans and admin accounts.');
    console.log('🔄 Users will need to register again to use the system.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Confirmation prompt
console.log('⚠️  DATA CLEANUP WARNING ⚠️');
console.log('This script will remove ALL data except:');
console.log('  ✅ Shark plans');
console.log('  ✅ Admin accounts');
console.log('');
console.log('❌ This will DELETE:');
console.log('  - All user accounts');
console.log('  - All wallet balances');
console.log('  - All transaction history');
console.log('  - All recharge/withdrawal requests');
console.log('  - All shark purchases');
console.log('  - All referral data');
console.log('');
console.log('🔄 Starting cleanup in 3 seconds...');
console.log('   (Press Ctrl+C to cancel)');

// Wait 3 seconds then start cleanup
setTimeout(() => {
  cleanupData();
}, 3000);
