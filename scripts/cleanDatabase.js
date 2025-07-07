import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Found collections:', collections.map(c => c.name));

    // Collections to keep (only shark-related data)
    const collectionsToKeep = ['sharks'];
    
    // Collections to clean completely
    const collectionsToClean = [
      'sharkinvestments',
      'transactions', 
      'withdrawals',
      'users',
      'wallets',
      'rechargerequests',
      'referrals',
      'admins'
    ];

    console.log('\n🧹 Starting database cleanup...');
    console.log('📦 Collections to keep:', collectionsToKeep);
    console.log('🗑️  Collections to clean:', collectionsToClean);

    // Clean specified collections
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ Cleaned collection '${collectionName}' - Removed ${result.deletedCount} documents`);
        } else {
          console.log(`ℹ️  Collection '${collectionName}' was already empty`);
        }
      } catch (error) {
        console.log(`⚠️  Collection '${collectionName}' doesn't exist or error occurred:`, error.message);
      }
    }

    // Show remaining data
    console.log('\n📊 Remaining data summary:');
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      if (collectionsToKeep.includes(collectionName)) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          console.log(`📦 ${collectionName}: ${count} documents (preserved)`);
        } catch (error) {
          console.log(`⚠️  Error checking ${collectionName}:`, error.message);
        }
      }
    }

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('🦈 Only shark data has been preserved.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will permanently delete all data except shark data from your database!');
console.log('📋 The following collections will be COMPLETELY CLEANED:');
console.log('   - sharkinvestments (user purchases)');
console.log('   - transactions (all transactions)');
console.log('   - withdrawals (withdrawal requests)');
console.log('   - users (user accounts)');
console.log('   - wallets (user balances)');
console.log('   - rechargerequests (recharge requests)');
console.log('   - referrals (referral data)');
console.log('   - admins (admin accounts)');
console.log('');
console.log('📦 The following collections will be PRESERVED:');
console.log('   - sharks (shark plan data)');
console.log('');

// Run the cleanup
cleanDatabase();
