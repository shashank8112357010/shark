import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  password: string;
  withdrawalPassword: string;
  inviteCode: string;
  referrer?: string;
  created: Date;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  withdrawalPassword: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true },
  referrer: { type: String },
  created: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
