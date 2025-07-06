# Admin Dashboard Setup and Usage Guide

## Overview

This admin dashboard system provides comprehensive management for the Shark investment platform with the following features:

- **User Statistics Dashboard**: Track total users, wallet balances, and activity metrics
- **Recharge Request Management**: Review and approve/reject user wallet recharge requests
- **Withdrawal Management**: Process withdrawal requests with payment proof and UTR tracking
- **Secure Authentication**: JWT-based admin authentication system

## Features Implemented

### 1. Admin Authentication
- **Login Credentials**: 
  - Email: `admin@gmail.com`
  - Password: `admin@321`
- JWT token-based authentication
- Session management with automatic logout

### 2. User Recharge Management
- Users submit recharge requests with QR code and UTR number
- Admin can view all requests with filtering and pagination
- Approve/reject requests with admin notes
- Automatic wallet balance updates on approval

### 3. Withdrawal Management
- View all withdrawal requests with tax calculations
- Approve withdrawals by uploading payment proof and UTR
- Reject withdrawals with reason notes
- Automatic refund to user wallet on rejection

### 4. Dashboard Analytics
- Total user count
- Recharge request statistics (pending/approved/rejected)
- Withdrawal request statistics (pending/approved/completed)
- Total wallet balance across all users
- Recent activity feeds

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Admin User
```bash
npm run create-admin
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Admin Dashboard
Navigate to: `http://localhost:8080/admin/login`

## Admin Dashboard URLs

- **Login**: `/admin/login`
- **Dashboard**: `/admin/dashboard`
- **Recharge Requests**: `/admin/recharge-requests`
- **Withdrawals**: `/admin/withdrawals`

## Database Models

### Admin Model
```typescript
interface IAdmin {
  email: string;
  password: string; // Hashed with bcrypt
  name: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Recharge Request Model
```typescript
interface IRechargeRequest {
  phone: string;
  amount: number;
  utrNumber: string;
  qrCode: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Updated Withdrawal Model
```typescript
interface IWithdrawal {
  phone: string;
  amount: number;
  tax: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  paymentProof?: string; // Payment screenshot
  paymentUtr?: string; // UTR number for payment
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics

### Recharge Management
- `GET /api/admin/recharge-requests` - Get all recharge requests
- `POST /api/admin/recharge-requests/:id/review` - Approve/reject recharge

### Withdrawal Management
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/withdrawals/:id/reject` - Reject withdrawal

### User Endpoints
- `POST /api/wallet/recharge-request` - Submit recharge request
- `GET /api/wallet/recharge-requests/:phone` - Get user's recharge requests

## User Workflow

### Recharge Process
1. User navigates to recharge page
2. Selects amount and enters UTR number and QR code
3. Request is submitted with 'pending' status
4. Admin reviews and approves/rejects request
5. On approval, amount is added to user's wallet
6. User receives notification of status change

### Withdrawal Process
1. User submits withdrawal request
2. Request appears in admin dashboard
3. Admin reviews request and either:
   - **Approves**: Uploads payment proof and UTR number
   - **Rejects**: Provides reason, amount refunded to wallet
4. Status updated to 'COMPLETED' or 'REJECTED'

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Admin session management
- Input validation and sanitization
- Protected admin routes

## Environment Variables

Make sure your `.env` file includes:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Troubleshooting

### Common Issues

1. **Admin can't login**: Ensure admin user was created using `npm run create-admin`
2. **Database connection**: Check MongoDB connection string in `.env`
3. **JWT errors**: Verify JWT_SECRET is set in environment variables

### Database Indexes

The system creates indexes on:
- `utrNumber` (unique) for recharge requests
- `phone` for user queries
- `createdAt` for sorting

## Future Enhancements

1. **QR Code Integration**: Implement actual QR code scanning
2. **File Upload**: Real file storage for payment proofs (AWS S3, etc.)
3. **Email Notifications**: Notify users of status changes
4. **Audit Logs**: Track all admin actions
5. **Advanced Analytics**: Charts and graphs for better insights
6. **Bulk Operations**: Approve/reject multiple requests at once

## Support

For technical support or questions about the admin dashboard, please contact the development team.
