import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

// Connect to MongoDB
const connectDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shark';
    console.log('Using MongoDB URI:', mongoUri?.replace(/\/\/.*@/, '//***:***@'));
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

const TransactionSchema = new mongoose.Schema({
  phone: String,
  type: String,
  amount: Number,
  transactionId: String,
  description: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ReferralAmount = mongoose.model('ReferralAmount', ReferralAmountSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

const createReferralReward = async () => {
  await connectDb();
  
  const referrerPhone = '8112357010';
  const referredPhone = '7355429022';
  
  // Check if referral reward already exists
  const existingReferral = await ReferralAmount.findOne({
    referrer: referrerPhone,
    referred: referredPhone
  });
  
  if (existingReferral) {
    console.log('Referral reward already exists:', existingReferral);
    mongoose.connection.close();
    return;
  }
  
  // Create referral reward
  const referralTransactionId = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const referralAmount = new ReferralAmount({
    referrer: referrerPhone,
    referred: referredPhone,
    referralTransactionId: referralTransactionId,
    rewardAmount: 500,
    status: 'completed',
    dateEarned: new Date(),
    referredPurchaseAmount: 0
  });
  
  await referralAmount.save();
  console.log('Created referral amount record:', referralAmount);
  
  // Create transaction record
  const rewardTransaction = new Transaction({
    phone: referrerPhone,
    type: 'referral',
    amount: 500,
    transactionId: referralTransactionId,
    description: `Referral reward for referring ${referredPhone} (registration)`,
    status: 'completed'
  });
  
  await rewardTransaction.save();
  console.log('Created transaction record:', rewardTransaction);
  
  console.log('✅ Referral reward created successfully!');
  mongoose.connection.close();
};

createReferralReward().catch(console.error);
