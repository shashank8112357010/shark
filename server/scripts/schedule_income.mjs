import cron from 'node-cron';
import { exec } from 'child_process';

// Schedule the daily income calculation script to run at 4 AM IST
cron.schedule('0 4 * * *', () => {
  console.log('🚀 Running daily income calculation script...');
  exec('tsx server/scripts/calculateDailyIncome.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error executing script: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }
    console.log(`Script stdout: ${stdout}`);
  });
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log('🕐 Income scheduler started - will run daily at 4 AM IST');
