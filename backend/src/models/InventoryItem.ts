import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryItem extends Document {
  itemName: string;
  category: string;
  quantity: number;
  unit: string; // e.g., 'kg', 'liters', 'packets', 'pieces'
  minimumThreshold: number;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema(
  {
    itemName: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    minimumThreshold: { type: Number, required: true, default: 10 },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
