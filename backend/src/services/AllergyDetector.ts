import { IPatientProfile } from '../models/PatientProfile';
import { IDietPlan } from '../models/DietPlan';
import { IMealItem } from '../models/MealItem';

export interface ValidationResult {
  isSafe: boolean;
  warnings: string[];
  requiresDieticianApproval: boolean;
}

export class AllergyDetector {
  static validateMealForPatient(
    meal: IMealItem,
    profile: IPatientProfile | null,
    dietPlan: IDietPlan | null,
    customNotes?: string
  ): ValidationResult {
    const warnings: string[] = [];
    let requiresDieticianApproval = false;

    // 1. Check Allergies
    if (profile && profile.allergies && profile.allergies.length > 0) {
      for (const allergy of profile.allergies) {
        const allergyLower = allergy.toLowerCase();
        // Check allergens list
        if (meal.allergens.some((a) => a.toLowerCase().includes(allergyLower))) {
          warnings.push(`Meal contains allergen matching patient allergy: ${allergy}`);
        }
        // Check ingredient list
        if (meal.ingredients.some((i) => i.toLowerCase().includes(allergyLower))) {
          warnings.push(`Meal ingredient list contains allergen matching patient allergy: ${allergy}`);
        }
      }
    }

    // 2. Check Medical Restrictions from Profile
    if (profile && profile.medicalRestrictions && profile.medicalRestrictions.length > 0) {
      for (const restriction of profile.medicalRestrictions) {
        const restrictionLower = restriction.toLowerCase();
        if (
          meal.ingredients.some((i) => i.toLowerCase().includes(restrictionLower)) ||
          meal.name.toLowerCase().includes(restrictionLower)
        ) {
          warnings.push(`Meal conflicts with medical restriction: ${restriction}`);
        }
      }
    }

    // 3. Check Diet Plan Limitations
    if (dietPlan) {
      if (dietPlan.calories && meal.calories > dietPlan.calories * 0.6) {
        warnings.push(`Single meal calories (${meal.calories} kcal) exceeds 60% of daily allowance (${dietPlan.calories} kcal).`);
      }
      if (dietPlan.sugarLimit && meal.sugar > dietPlan.sugarLimit * 0.5) {
        warnings.push(`Meal sugar content (${meal.sugar}g) exceeds safe single-meal threshold.`);
      }
      if (dietPlan.sodiumLimit && meal.sodium > dietPlan.sodiumLimit * 0.5) {
        warnings.push(`Meal sodium content (${meal.sodium}mg) exceeds safe single-meal threshold.`);
      }
      if (dietPlan.foodRestrictions && dietPlan.foodRestrictions.length > 0) {
        for (const restr of dietPlan.foodRestrictions) {
          if (meal.ingredients.some((i) => i.toLowerCase().includes(restr.toLowerCase()))) {
            warnings.push(`Meal contains doctor-prescribed restricted food: ${restr}`);
          }
        }
      }
    }

    // 4. Custom Request Rules
    if (customNotes && customNotes.trim().length > 0) {
      requiresDieticianApproval = true;
      warnings.push(`Customized food request notes provided ("${customNotes}"). Requires Dietician review.`);
    }

    if (warnings.length > 0 && !requiresDieticianApproval) {
      // If there's an allergy or dietary warning, elevate to require dietician approval or flag as unsafe
      requiresDieticianApproval = true;
    }

    return {
      isSafe: warnings.length === 0 && !requiresDieticianApproval,
      warnings,
      requiresDieticianApproval,
    };
  }
}
