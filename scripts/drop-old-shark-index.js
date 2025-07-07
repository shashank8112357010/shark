// Script to drop the old unique index on { shark, level } from the SharkInvestment collection
// Usage: npx tsx scripts/drop-old-shark-index.js

import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://bsyuhi:shashank123@cluster0.hzlso.mongodb.net/shark?retryWrites=true&w=majority&appName=Cluster0MONGO_DB=shark"
async function dropOldIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    const result = await mongoose.connection.db.collection('sharkinvestments').dropIndex({ shark: 1, level: 1 });
    console.log('Index dropped:', result);
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index not found, nothing to drop.');
    } else {
      console.error('Error dropping index:', err);
    }
  } finally {
    await mongoose.disconnect();
  }
}

dropOldIndex();
