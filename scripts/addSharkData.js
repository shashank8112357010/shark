import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Shark schema definition (matching server/models/Shark.ts)
const SharkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  totalReturn: { type: Number, required: true },
  dailyIncome: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  levelNumber: { type: Number, required: true, index: true },
}, { timestamps: true });

const Shark = mongoose.models.Shark || mongoose.model('Shark', SharkSchema);

const sampleSharks = [
  // Level 1 Sharks
  {
    title: "Shark A",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 499,
    totalReturn: 10800,
    dailyIncome: 90,
    durationDays: 120,
    levelNumber: 1
  },
  {
    title: "Shark B",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 1990,
    totalReturn: 37400,
    dailyIncome: 340,
    durationDays: 110,
    levelNumber: 1
  },

  // Level 2 Sharks
  {
    title: "Shark C",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 4980,
    totalReturn: 138300,
    dailyIncome: 1383,
    durationDays: 100,
    levelNumber: 2
  },
  {
    title: "Shark D",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 16890,
    totalReturn: 496700,
    dailyIncome: 4967,
    durationDays: 100,
    levelNumber: 2
  },
  {
    title: "Shark VIP 1",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 5000,
    totalReturn: 9000,
    dailyIncome: 3000,
    durationDays: 3,
    levelNumber: 2
  },

  // Level 3 Sharks
  {
    title: "Shark E",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 29800,
    totalReturn: 838080,
    dailyIncome: 9312,
    durationDays: 90,
    levelNumber: 3
  },
  {
    title: "Shark F",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 46800,
    totalReturn: 1290960,
    dailyIncome: 16137,
    durationDays: 80,
    levelNumber: 3
  },
  {
    title: "Shark VIP 2",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 10000,
    totalReturn: 18000,
    dailyIncome: 6000,
    durationDays: 3,
    levelNumber: 3
  },

  // Level 4 Sharks
  {
    title: "Shark G",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 79800,
    totalReturn: 2234400,
    dailyIncome: 31920,
    durationDays: 70,
    levelNumber: 4
  },
  {
    title: "Shark H",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 129800,
    totalReturn: 1947000,
    dailyIncome: 64900,
    durationDays: 30,
    levelNumber: 4
  },
  {
    title: "Shark VIP 3",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 20000,
    totalReturn: 36000,
    dailyIncome: 12000,
    durationDays: 3,
    levelNumber: 4
  },

  // Level 5 Sharks
  {
    title: "Shark I",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 158000,
    totalReturn: 21066600,
    dailyIncome: 105333,
    durationDays: 200,
    levelNumber: 5
  },
  {
    title: "Shark VIP 4",
    image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
    price: 30000,
    totalReturn: 54000,
    dailyIncome: 18000,
    durationDays: 3,
    levelNumber: 5
  }
];

async function addSharkData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing shark data
    const existingCount = await Shark.countDocuments();
    if (existingCount > 0) {
      await Shark.deleteMany({});
      console.log(`🗑️  Removed ${existingCount} existing shark records`);
    }

    // Insert new shark data
    console.log('🦈 Adding sample shark data...');
    const insertedSharks = await Shark.insertMany(sampleSharks);
    
    console.log(`✅ Successfully added ${insertedSharks.length} shark plans!`);
    
    // Group by levels and show summary
    const levels = {};
    insertedSharks.forEach(shark => {
      if (!levels[shark.levelNumber]) {
        levels[shark.levelNumber] = [];
      }
      levels[shark.levelNumber].push(shark.title);
    });
    
    console.log('\n📋 Shark Plans Summary:');
    Object.keys(levels).sort().forEach(level => {
      console.log(`📦 Level ${level}: ${levels[level].join(', ')}`);
    });
    
    console.log('\n✨ Shark data setup completed successfully!');
    console.log('🎯 You can now test the shark purchase system.');
    
  } catch (error) {
    console.error('❌ Error adding shark data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the setup
console.log('🦈 Setting up shark plan data...');
console.log('📋 This will add sample shark plans across 5 levels\n');

addSharkData();
