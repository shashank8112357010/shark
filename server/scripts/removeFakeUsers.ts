import mongoose from 'mongoose';
import User from '../models/User';
import Transaction from '../models/Transaction';
import SharkInvestment from '../models/SharkInvestment';
import Referral from '../models/Referral';
import ReferralAmount from '../models/ReferralAmount';
import Income from '../models/Income';
import Withdrawal from '../models/Withdrawal';
import { connectDb } from '../utils/db';

// Basic Indian mobile number validation (10 digits, starts with 6, 7, 8, or 9)
function isValidIndianMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

async function removeFakeUsers() {
  console.log('🚀 Starting fake user removal...');

  try {
    await connectDb();

    const users = await (User as any).find({});
    console.log(`👥 Found ${users.length} users to check.`);

    for (const user of users) {
      const { phone } = user;

      if (!isValidIndianMobile(phone)) {
        console.log(`\n🔥 Found fake user: ${phone}. Removing...`);

        // Remove user and all associated data
        await (User as any).deleteOne({ phone });
        await (Transaction as any).deleteMany({ phone });
        await (SharkInvestment as any).deleteMany({ phone });
        await (Referral as any).deleteMany({ referrer: phone });
        await (Referral as any).deleteMany({ referred: phone });
        await (ReferralAmount as any).deleteMany({ referrer: phone });
        await (ReferralAmount as any).deleteMany({ referred: phone });
        await (Income as any).deleteMany({ phone });
        await (Withdrawal as any).deleteMany({ phone });

        console.log(`  ✅ User ${phone} and all associated data removed.`);
      }
    }

    console.log('\n🎉 Fake user removal completed!');
  } catch (error: any) {
    console.error('❌ Error during fake user removal:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

removeFakeUsers();