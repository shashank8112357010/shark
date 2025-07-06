import { connectDb } from '../utils/db';
import RechargeRequest from '../models/RechargeRequest';
import Withdrawal from '../models/Withdrawal';
import User from '../models/User';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import { TransactionType, TransactionStatus } from '../models/Transaction';

async function addTestData() {
  try {
    await connectDb();
    
    console.log('Adding test data...');
    
    // Create test users if they don't exist
    const testUsers = [
      { phone: '9876543210', inviteCode: 'TEST001' },
      { phone: '9876543211', inviteCode: 'TEST002' },
      { phone: '9876543212', inviteCode: 'TEST003' }
    ];
    
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ phone: userData.phone });
      if (!existingUser) {
        const user = new User({
          phone: userData.phone,
          inviteCode: userData.inviteCode,
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Default hashed password for 'password'
          withdrawalPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Default hashed password for 'password'
        });
        await user.save();
        console.log(`Created test user: ${userData.phone}`);
        
        // Create wallet for user
        const wallet = new Wallet({
          phone: userData.phone,
          balance: 5000 // Give them some initial balance
        });
        await wallet.save();
        console.log(`Created wallet for user: ${userData.phone}`);
      }
    }
    
    // Add test recharge requests
    const testRechargeRequests = [
      {
        phone: '9876543210',
        amount: 1000,
        utrNumber: 'UTR001TEST',
        qrCode: 'test-qr-code-1',
        status: 'pending'
      },
      {
        phone: '9876543211',
        amount: 2000,
        utrNumber: 'UTR002TEST',
        qrCode: 'test-qr-code-2',
        status: 'pending'
      },
      {
        phone: '9876543212',
        amount: 1500,
        utrNumber: 'UTR003TEST',
        qrCode: 'test-qr-code-3',
        status: 'approved'
      }
    ];
    
    for (const reqData of testRechargeRequests) {
      const existingRequest = await RechargeRequest.findOne({ utrNumber: reqData.utrNumber });
      if (!existingRequest) {
        const rechargeRequest = new RechargeRequest(reqData);
        await rechargeRequest.save();
        console.log(`Created test recharge request: ${reqData.utrNumber}`);
      }
    }
    
    // Add test withdrawal requests
    const testWithdrawals = [
      {
        phone: '9876543210',
        amount: 800,
        tax: 120, // 15% of 800
        netAmount: 680,
        status: 'PENDING'
      },
      {
        phone: '9876543211',
        amount: 1200,
        tax: 180, // 15% of 1200
        netAmount: 1020,
        status: 'PENDING'
      },
      {
        phone: '9876543212',
        amount: 1000,
        tax: 150, // 15% of 1000
        netAmount: 850,
        status: 'COMPLETED',
        paymentUtr: 'UTR004PAYMENT',
        reviewedBy: 'admin@gmail.com',
        reviewedAt: new Date()
      }
    ];
    
    for (const withdrawalData of testWithdrawals) {
      // Create transaction first
      const transaction = new Transaction({
        phone: withdrawalData.phone,
        type: TransactionType.WITHDRAWAL,
        amount: withdrawalData.amount,
        tax: withdrawalData.tax,
        netAmount: withdrawalData.netAmount,
        status: withdrawalData.status === 'PENDING' ? TransactionStatus.PENDING : TransactionStatus.COMPLETED
      });
      await transaction.save();
      
      const withdrawal = new Withdrawal({
        ...withdrawalData,
        transactionId: transaction._id
      });
      await withdrawal.save();
      console.log(`Created test withdrawal: ${withdrawalData.phone} - ${withdrawalData.amount}`);
    }
    
    console.log('Test data added successfully!');
    console.log('You can now login to the admin dashboard with:');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin@321');
    
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    process.exit(0);
  }
}

addTestData();
