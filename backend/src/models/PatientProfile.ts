import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  patientId: string;
  hospitalRegNumber: string;
  assignedDoctor: mongoose.Types.ObjectId;
  assignedDietician: mongoose.Types.ObjectId;
  wardNumber: string;
  bedNumber: string;
  diseaseType: string;
  recoveryStage: 'Critical' | 'Moderate' | 'Recovering' | 'Discharge Ready';
  ageGroup: string; // e.g., "Child", "Adult", "Elderly"
  allergies: string[];
  medicalRestrictions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    patientId: { type: String, required: true, unique: true, index: true },
    hospitalRegNumber: { type: String, required: true, unique: true },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedDietician: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wardNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    diseaseType: { type: String, default: 'General' },
    recoveryStage: {
      type: String,
      enum: ['Critical', 'Moderate', 'Recovering', 'Discharge Ready'],
      default: 'Recovering',
    },
    ageGroup: { type: String, default: 'Adult' },
    allergies: [{ type: String }],
    medicalRestrictions: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);
