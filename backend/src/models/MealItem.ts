import mongoose, { Document, Schema } from 'mongoose';

export interface IMealItem extends Document {
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Beverage';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
  ingredients: string[];
  allergens: string[];
  recommendedFor: string[]; // e.g., 'Diabetes', 'Hypertension', 'Cardiac', 'General', 'Post-Op'
  available: boolean;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const MealItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage'],
      required: true,
      index: true,
    },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    sugar: { type: Number, required: true },
    sodium: { type: Number, required: true },
    ingredients: [{ type: String }],
    allergens: [{ type: String }],
    recommendedFor: [{ type: String }],
    available: { type: Boolean, default: true },
    price: { type: Number, default: 0.0 }, // For hospital cafeteria/custom billing
  },
  { timestamps: true }
);

export default mongoose.model<IMealItem>('MealItem', MealItemSchema);
