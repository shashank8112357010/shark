import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Admin schema definition (matching server/models/Admin.ts)
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
import bcrypt from 'bcryptjs';

AdminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

// Method to verify password
AdminSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function updateAdminPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Delete existing admin
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      await Admin.deleteOne({ email: 'admin@gmail.com' });
      console.log('🗑️  Removed existing admin account');
    }

    // Create new admin with correct password
    const admin = new Admin({
      email: 'admin@gmail.com',
      password: 'admin@123',
      name: 'Admin',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin@123');
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
console.log('🔐 Updating admin account with correct password...');
updateAdminPassword();
