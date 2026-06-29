import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  mealId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  patientId: mongoose.Types.ObjectId;
  mealItems: IOrderItem[];
  totalPrice: number;
  orderType: 'Standard' | 'CustomRequest';
  customNotes?: string;
  dieticianApproval: 'Pending' | 'Approved' | 'Rejected' | 'NotRequired';
  preparationStatus: 'Received' | 'Preparing' | 'Packaged' | 'ReadyForDelivery' | 'Delivered';
  deliveryStatus: 'Pending' | 'Assigned' | 'OutForDelivery' | 'Delivered' | 'Failed';
  deliveryPartnerId?: mongoose.Types.ObjectId;
  qrCodeData: string; // Used to verify patientId + orderId + dietPlanId
  verificationOTP: string;
  paymentStatus: 'Pending' | 'Completed' | 'Refunded';
  failedReason?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mealItems: [
      {
        mealId: { type: Schema.Types.ObjectId, ref: 'MealItem', required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalPrice: { type: Number, default: 0.0 },
    orderType: {
      type: String,
      enum: ['Standard', 'CustomRequest'],
      default: 'Standard',
    },
    customNotes: { type: String },
    dieticianApproval: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'NotRequired'],
      default: 'NotRequired',
    },
    preparationStatus: {
      type: String,
      enum: ['Received', 'Preparing', 'Packaged', 'ReadyForDelivery', 'Delivered'],
      default: 'Received',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed'],
      default: 'Pending',
      index: true,
    },
    deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    qrCodeData: { type: String, required: true },
    verificationOTP: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Refunded'],
      default: 'Pending',
    },
    failedReason: { type: String },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
