# 🦈 Shark Income Scheduler System

This document explains the automated daily income calculation system for shark investments.

## 📋 Overview

The income scheduler automatically calculates and distributes daily income to users who have purchased sharks. It runs every day at **4:00 AM IST** and processes income based on each shark's `dailyIncome` value.

## 🏗️ System Components

### 1. **Income Model** (`server/models/Income.ts`)
Tracks daily income records for each user and shark investment.

### 2. **Income Routes** (`server/routes/income.ts`)
API endpoints to fetch income data for user profiles.

### 3. **Scheduler Script** (`server/scripts/schedule_income.mjs`)
Automated scheduler that runs at 4 AM IST daily.

### 4. **Manual Script** (`server/scripts/calculateDailyIncome.ts`)
For manual income calculation and testing.

## 🚀 How It Works

### Daily Income Calculation Process:

1. **Find Active Investments**: Gets all shark investments with completed purchase transactions
2. **Check Eligibility**: 
   - Investment must be within duration period (durationDays)
   - Purchase transaction must be completed
   - Income not already processed for today
3. **Calculate Income**: Uses the `dailyIncome` value from the shark data
4. **Create Transaction**: Adds income as a DEPOSIT transaction (increases user balance)
5. **Record Income**: Saves income record for tracking and history

### Income Distribution Logic:

```javascript
// For each eligible shark investment:
const dailyIncome = sharkDetails.dailyIncome; // From shark data
const daysSincePurchase = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));

if (daysSincePurchase < sharkDetails.durationDays) {
  // Create income transaction and record
  // Income is added to user's wallet balance
}
```

## 🔧 Setup & Usage

### Installation

```bash
# Install required dependencies
npm install node-cron @types/node-cron

# Build the project
npm run build:server
```

### Manual Income Calculation

```bash
# Run income calculation manually
npm run calculate-income
```

### Start Scheduler (Development)

```bash
# Start the scheduler process
npm run start-scheduler
```

### Production Setup with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start both API and scheduler
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs income-scheduler
```

## 📊 API Endpoints

### Get Total Income (for Profile)
```
GET /api/income/total/:phone
```
**Response:**
```json
{
  "success": true,
  "totalIncome": 12500,
  "totalRecords": 25,
  "message": "Total income from 25 daily income records"
}
```

### Get Income History
```
GET /api/income/history/:phone?page=1&limit=20
```

### Get Income Statistics
```
GET /api/income/stats/:phone
```

### Get Income by Date Range
```
GET /api/income/range/:phone?startDate=2024-01-01&endDate=2024-01-31
```

## 🎯 Example Shark Data

For the scheduler to work, your sharks collection should have this structure:

```json
{
  "title": "Shark VIP 3",
  "image": "https://...",
  "price": 20000,
  "totalReturn": 36000,
  "dailyIncome": 300,        // ← This is used for daily income
  "durationDays": 120,       // ← Income paid for this many days
  "levelNumber": 4,
  "isLocked": false
}
```

## 🕐 Scheduler Configuration

The scheduler runs at **4:00 AM IST** daily using this cron expression:
```javascript
cron.schedule('0 4 * * *', calculateAndRecordIncome, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});
```

## 📈 Income Flow

1. **User purchases shark** → Creates SharkInvestment record
2. **Daily at 4 AM** → Scheduler checks all active investments
3. **For each eligible investment** → Creates income transaction + income record
4. **Income added to balance** → User sees increased wallet balance
5. **Income tracked** → Available via income API endpoints

## 🔍 Monitoring & Logs

### Check Scheduler Status
```bash
# View scheduler logs
pm2 logs income-scheduler

# Check if scheduler is running
pm2 list
```

### Debug Income Calculation
```bash
# Run manual calculation with detailed logs
npm run calculate-income
```

### View Income Records
```bash
# MongoDB query to check income records
db.incomes.find().sort({date: -1}).limit(10)
```

## 🛠️ Troubleshooting

### Common Issues:

1. **No income generated**
   - Check if shark data has valid `dailyIncome` values
   - Verify purchase transactions are completed
   - Ensure investment period hasn't expired

2. **Scheduler not running**
   - Check PM2 process status: `pm2 list`
   - View error logs: `pm2 logs income-scheduler --err`
   - Restart scheduler: `pm2 restart income-scheduler`

3. **Duplicate income**
   - The system prevents duplicates using compound index
   - Check for multiple scheduler instances running

### Manual Recovery
If the scheduler misses a day, you can run manual calculation:
```bash
npm run calculate-income
```

## 🚦 Production Checklist

- [ ] Shark data populated with correct `dailyIncome` values
- [ ] MongoDB indexes created for performance
- [ ] PM2 ecosystem configured
- [ ] Scheduler logs directory exists (`logs/`)
- [ ] System timezone set to IST
- [ ] Monitoring alerts set up for scheduler failures

## 📋 Database Schema

### Income Collection
```javascript
{
  phone: String,           // User phone number
  date: Date,             // Income date
  sharkTitle: String,     // Shark name
  sharkLevel: Number,     // Shark level
  dailyIncomeAmount: Number, // Income amount
  sharkPurchaseId: String,   // Reference to investment
  transactionId: String,     // Income transaction ID
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ phone: 1, sharkPurchaseId: 1, date: 1 }` (unique) - Prevent duplicates
- `{ phone: 1, date: -1 }` - Efficient user income queries

---

The income scheduler system ensures users receive their daily shark income automatically, with full tracking and API access for displaying income data in user profiles.
