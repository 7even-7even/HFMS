import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User, { UserRole } from '../models/User';
import PatientProfile from '../models/PatientProfile';
import DietPlan from '../models/DietPlan';
import MealItem from '../models/MealItem';
import InventoryItem from '../models/InventoryItem';
import Order from '../models/Order';
import AuditLog from '../models/AuditLog';
import { QRService } from '../services/QRService';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hfms';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await PatientProfile.deleteMany({});
    await DietPlan.deleteMany({});
    await MealItem.deleteMany({});
    await InventoryItem.deleteMany({});
    await Order.deleteMany({});
    await AuditLog.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@hfms.org',
      passwordHash,
      role: UserRole.Admin,
      phoneNumber: '+1-800-555-0100',
      active: true,
    });

    const doctor = await User.create({
      name: 'Dr. Robert Greene, MD',
      email: 'doctor@hfms.org',
      passwordHash,
      role: UserRole.Doctor,
      phoneNumber: '+1-800-555-0101',
      active: true,
    });

    const dietician = await User.create({
      name: 'Sarah Jenkins, RD',
      email: 'dietician@hfms.org',
      passwordHash,
      role: UserRole.Dietician,
      phoneNumber: '+1-800-555-0102',
      active: true,
    });

    const patient = await User.create({
      name: 'Alex Mercer',
      email: 'patient@hfms.org',
      passwordHash,
      role: UserRole.Patient,
      phoneNumber: '+1-800-555-0103',
      active: true,
    });

    const pantry = await User.create({
      name: 'Mario Rossi (Pantry Head)',
      email: 'pantry@hfms.org',
      passwordHash,
      role: UserRole.Pantry,
      phoneNumber: '+1-800-555-0104',
      active: true,
      isOnline: true, // Show as active online
    });

    const delivery = await User.create({
      name: 'David Miller (Express Delivery)',
      email: 'delivery@hfms.org',
      passwordHash,
      role: UserRole.Delivery,
      phoneNumber: '+1-800-555-0105',
      active: true,
      isOnline: true, // Show as active online
    });

    // 2. Create Patient Profile
    const patientProfile = await PatientProfile.create({
      userId: patient._id,
      patientId: 'PT-98321',
      hospitalRegNumber: 'HOSP-2026-089',
      assignedDoctor: doctor._id,
      assignedDietician: dietician._id,
      wardNumber: 'Ward 4B (Cardiology)',
      bedNumber: 'Bed 12',
      diseaseType: 'Hypertension & Post-Angioplasty',
      recoveryStage: 'Recovering',
      ageGroup: 'Adult',
      allergies: ['Peanuts', 'Shellfish'],
      medicalRestrictions: ['High Sodium', 'Saturated Fat'],
    });

    // 3. Create Diet Plan
    const dietPlan = await DietPlan.create({
      patientId: patient._id,
      createdBy: dietician._id,
      calories: 1800,
      proteinLimit: 90,
      carbsLimit: 220,
      fatLimit: 45,
      sugarLimit: 25,
      sodiumLimit: 1500,
      allergies: ['Peanuts', 'Shellfish'],
      foodRestrictions: ['High Sodium', 'Saturated Fat'],
      mealSchedule: [
        { mealType: 'Breakfast', time: '08:00 AM' },
        { mealType: 'Lunch', time: '12:30 PM' },
        { mealType: 'Dinner', time: '06:30 PM' },
      ],
      status: 'Active',
    });

    // 4. Create Meal Catalog Items
    const meal1 = await MealItem.create({
      name: 'Oatmeal Bowl with Almond Milk & Berries',
      category: 'Breakfast',
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 6,
      sugar: 12,
      sodium: 140,
      ingredients: ['Organic Rolled Oats', 'Almond Milk', 'Blueberries', 'Chia Seeds'],
      allergens: ['Almonds'],
      recommendedFor: ['General', 'Hypertension', 'Diabetes'],
      available: true,
      price: 6.50,
    });

    const meal2 = await MealItem.create({
      name: 'Steamed Quinoa & Herbed Grilled Chicken breast',
      category: 'Lunch',
      calories: 480,
      protein: 42,
      carbs: 45,
      fat: 10,
      sugar: 4,
      sodium: 380,
      ingredients: ['Quinoa', 'Chicken Breast', 'Olive Oil', 'Garlic', 'Steamed Broccoli'],
      allergens: [],
      recommendedFor: ['General', 'Cardiac', 'Post-Op'],
      available: true,
      price: 12.00,
    });

    const meal3 = await MealItem.create({
      name: 'Low-Sodium Vegetable Barley Soup',
      category: 'Dinner',
      calories: 280,
      protein: 8,
      carbs: 48,
      fat: 3,
      sugar: 6,
      sodium: 210,
      ingredients: ['Pearl Barley', 'Carrots', 'Celery', 'Low-Sodium Veg Broth'],
      allergens: ['Gluten'],
      recommendedFor: ['General', 'Hypertension', 'Post-Op'],
      available: true,
      price: 8.00,
    });

    const meal4 = await MealItem.create({
      name: 'Electrolyte Herb Infused Recovery Broth',
      category: 'Beverage',
      calories: 90,
      protein: 4,
      carbs: 15,
      fat: 0,
      sugar: 3,
      sodium: 120,
      ingredients: ['Clear Broth', 'Ginseng', 'Mineral Infusion'],
      allergens: [],
      recommendedFor: ['Critical', 'Post-Op'],
      available: true,
      price: 4.50,
    });

    // 5. Create Inventory Items
    await InventoryItem.create({
      itemName: 'Organic Rolled Oats (10kg Pack)',
      category: 'Grains & Cereals',
      quantity: 45,
      unit: 'kg',
      minimumThreshold: 15,
    });

    await InventoryItem.create({
      itemName: 'Premium Quinoa',
      category: 'Grains & Cereals',
      quantity: 22,
      unit: 'kg',
      minimumThreshold: 10,
    });

    await InventoryItem.create({
      itemName: 'Low-Sodium Vegetable Broth Base',
      category: 'Liquids & Soups',
      quantity: 8, // Below threshold to trigger low stock alert!
      unit: 'liters',
      minimumThreshold: 15,
    });

    await InventoryItem.create({
      itemName: 'Almond Milk (Unsweetened)',
      category: 'Dairy & Alternatives',
      quantity: 30,
      unit: 'liters',
      minimumThreshold: 12,
    });

    // 6. Create Sample Active Order
    const verificationOTP = '492810';
    const qrCodeData = QRService.generateQRData(patient._id.toString(), 'SAMPLE_ORDER_1', dietPlan._id.toString());

    const order = await Order.create({
      patientId: patient._id,
      mealItems: [{ mealId: meal2._id, quantity: 1 }],
      totalPrice: 12.00,
      orderType: 'Standard',
      dieticianApproval: 'NotRequired',
      preparationStatus: 'Packaged', // Ready for delivery partner
      deliveryStatus: 'Assigned',
      deliveryPartnerId: delivery._id,
      qrCodeData,
      verificationOTP,
      paymentStatus: 'Completed',
    });

    // Update order QR Code Data with its actual ID
    order.qrCodeData = QRService.generateQRData(patient._id.toString(), order._id.toString(), dietPlan._id.toString());
    await order.save();

    // 7. Create Audit Logs
    await AuditLog.create({
      userId: dietician._id,
      action: 'DIET_PLAN_CREATED',
      details: { patientId: patient._id, calories: 1800 },
      ipAddress: '192.168.1.10',
    });

    await AuditLog.create({
      userId: patient._id,
      action: 'ORDER_PLACED',
      details: { orderId: order._id, orderType: 'Standard' },
      ipAddress: '192.168.1.55',
    });

    await AuditLog.create({
      userId: pantry._id,
      action: 'ORDER_PREP_STATUS_UPDATED',
      details: { orderId: order._id, preparationStatus: 'Packaged' },
      ipAddress: '192.168.1.22',
    });

    console.log('Production Sample Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
