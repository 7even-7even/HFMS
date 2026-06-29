import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Dietician = 'Dietician',
  Patient = 'Patient',
  Pantry = 'Pantry',
  Delivery = 'Delivery',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phoneNumber?: string;
  active: boolean;
  isOnline: boolean; // For tracking active online pantry and delivery staff
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    phoneNumber: { type: String },
    active: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
