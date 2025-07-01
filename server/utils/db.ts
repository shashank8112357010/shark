import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shark';

const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;

  try {
    // Mask credentials for logging
    const safeUri = MONGO_URI.replace(/(mongodb(?:\+srv)?:\/\/)(.*?:.*?@)/, '$1****:****@');
    console.log(`Connecting to MongoDB at: ${safeUri}`);
    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Check that your MongoDB server is running and accessible at the configured URI.');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      connectDb();
    }, 5000);
    throw error;
  }

  // Add event listeners for connection events
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
}
