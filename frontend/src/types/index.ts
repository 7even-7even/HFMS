export enum UserRole {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Dietician = 'Dietician',
  Patient = 'Patient',
  Pantry = 'Pantry',
  Delivery = 'Delivery',
}

export interface IPatientProfile {
  _id: string;
  userId: string | any;
  patientId: string;
  hospitalRegNumber: string;
  assignedDoctor: any;
  assignedDietician: any;
  wardNumber: string;
  bedNumber: string;
  diseaseType: string;
  recoveryStage: 'Critical' | 'Moderate' | 'Recovering' | 'Discharge Ready';
  ageGroup: string;
  allergies: string[];
  medicalRestrictions: string[];
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  active?: boolean;
  isOnline?: boolean;
  profile?: IPatientProfile;
}

export interface IMealSchedule {
  mealType: string;
  time: string;
  _id?: string;
}

export interface IDietPlan {
  _id: string;
  patientId: string;
  createdBy: any;
  calories: number;
  proteinLimit: number;
  carbsLimit: number;
  fatLimit: number;
  sugarLimit: number;
  sodiumLimit: number;
  allergies: string[];
  foodRestrictions: string[];
  mealSchedule: IMealSchedule[];
  status: 'Active' | 'Modified' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface IMealItem {
  _id: string;
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
  recommendedFor: string[];
  available: boolean;
  price: number;
}

export interface IOrderItem {
  mealId: IMealItem;
  quantity: number;
  _id?: string;
}

export interface IOrder {
  _id: string;
  patientId: any;
  mealItems: IOrderItem[];
  totalPrice: number;
  orderType: 'Standard' | 'CustomRequest';
  customNotes?: string;
  dieticianApproval: 'Pending' | 'Approved' | 'Rejected' | 'NotRequired';
  preparationStatus: 'Received' | 'Preparing' | 'Packaged' | 'ReadyForDelivery' | 'Delivered';
  deliveryStatus: 'Pending' | 'Assigned' | 'OutForDelivery' | 'Delivered' | 'Failed';
  deliveryPartnerId?: any;
  qrCodeData: string;
  verificationOTP: string;
  paymentStatus: 'Pending' | 'Completed' | 'Refunded';
  failedReason?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface IInventoryItem {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  minimumThreshold: number;
  lastRestocked: string;
}

export interface IAuditLog {
  _id: string;
  userId: any;
  action: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
}

export interface IChatMessage {
  _id: string;
  senderId: any;
  receiverId: any;
  message: string;
  read: boolean;
  createdAt: string;
}
