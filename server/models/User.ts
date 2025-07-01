import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  password: string;
  withdrawalPassword: string;
  inviteCode: string;
  referrer?: string;
  created: Date;
  verifyPassword(password: string): boolean;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  withdrawalPassword: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true },
  referrer: { type: String },
  created: { type: Date, default: Date.now },
});

import bcrypt from 'bcryptjs';

// Add instance method for withdrawal password verification
UserSchema.methods.verifyPassword = function (password: string) {
  // Returns a promise for async bcrypt comparison
  return bcrypt.compare(password, this.withdrawalPassword);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
