import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

// Connect to MongoDB
const connectDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shark';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const ReferralAmountSchema = new mongoose.Schema({
  referrer: String,
  referred: String,
  referralTransactionId: String,
  rewardAmount: Number,
  status: String,
  dateEarned: Date,
  referredPurchaseAmount: Number
});

const ReferralAmount = mongoose.model('ReferralAmount', ReferralAmountSchema);

const testReferralSystem = async () => {
  await connectDb();
  
  const referrerPhone = '8112357010';
  
  console.log('=== TESTING NEW REFERRAL SYSTEM ===');
  
  // Get current referral earnings
  const totalStats = await ReferralAmount.aggregate([
    { $match: { referrer: referrerPhone, status: 'completed' } },
    { 
      $group: { 
        _id: null, 
        totalEarned: { $sum: "$rewardAmount" },
        totalReferrals: { $sum: 1 }
      } 
    }
  ]);
  
  const currentEarnings = totalStats[0] || { totalEarned: 0, totalReferrals: 0 };
  
  console.log(`Current referral earnings for ${referrerPhone}:`);
  console.log(`- Total earned: ₹${currentEarnings.totalEarned}`);
  console.log(`- Total referrals: ${currentEarnings.totalReferrals}`);
  console.log(`- Can withdraw: ${currentEarnings.totalEarned >= 1500 ? 'YES' : 'NO'} (minimum: ₹1500)`);
  
  if (currentEarnings.totalEarned >= 1500) {
    const cutAmount = currentEarnings.totalEarned * 0.15;
    const finalAmount = currentEarnings.totalEarned - cutAmount;
    console.log(`- After 15% cut: ₹${finalAmount.toFixed(2)}`);
  }
  
  // Show recent referrals
  const recentReferrals = await ReferralAmount.find({ 
    referrer: referrerPhone 
  })
  .sort({ dateEarned: -1 })
  .limit(5);
  
  console.log('\n=== RECENT REFERRALS ===');
  recentReferrals.forEach((ref, index) => {
    console.log(`${index + 1}. ${ref.referred} - ₹${ref.rewardAmount} (${ref.status}) - ${ref.dateEarned.toLocaleDateString()}`);
  });
  
  console.log('\n=== SYSTEM CONFIGURATION ===');
  console.log('- Referral reward: ₹300 per registration');
  console.log('- Minimum withdrawal: ₹1500');
  console.log('- Tax cut: 15%');
  console.log('- Trigger: Immediate upon registration');
  
  mongoose.connection.close();
  console.log('\n✅ Test completed successfully!');
};

testReferralSystem().catch(console.error);
