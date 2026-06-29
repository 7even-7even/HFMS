import mongoose, { Document, Schema } from 'mongoose';

export interface IMealSchedule {
  mealType: string; // e.g., 'Breakfast', 'Lunch', 'Dinner', 'Morning Snack'
  time: string; // e.g., '08:00 AM'
}

export interface IDietPlan extends Document {
  patientId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // Doctor or Dietician
  calories: number;
  proteinLimit: number; // in grams
  carbsLimit: number; // in grams
  fatLimit: number; // in grams
  sugarLimit: number; // in grams
  sodiumLimit: number; // in mg
  allergies: string[];
  foodRestrictions: string[];
  mealSchedule: IMealSchedule[];
  status: 'Active' | 'Modified' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
}

const DietPlanSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calories: { type: Number, required: true },
    proteinLimit: { type: Number, required: true },
    carbsLimit: { type: Number, required: true },
    fatLimit: { type: Number, required: true },
    sugarLimit: { type: Number, required: true },
    sodiumLimit: { type: Number, required: true },
    allergies: [{ type: String }],
    foodRestrictions: [{ type: String }],
    mealSchedule: [
      {
        mealType: { type: String, required: true },
        time: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Modified', 'Archived'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);
