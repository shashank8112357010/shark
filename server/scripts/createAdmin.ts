import { connectDb } from '../utils/db';
import Admin from '../models/Admin';

async function createDefaultAdmin() {
  try {
    await connectDb();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create default admin
    const admin = new Admin({
      email: 'admin@gmail.com',
      password: 'admin@123',
      name: 'Admin',
      role: 'admin',
      isActive: true
    });
    
    await admin.save();
    console.log('Default admin user created successfully');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin@123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createDefaultAdmin();
