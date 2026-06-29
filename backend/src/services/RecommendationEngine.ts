import MealItem, { IMealItem } from '../models/MealItem';
import { IPatientProfile } from '../models/PatientProfile';
import { IDietPlan } from '../models/DietPlan';
import { AllergyDetector } from './AllergyDetector';

export class RecommendationEngine {
  static async getRecommendations(
    profile: IPatientProfile,
    dietPlan: IDietPlan | null
  ): Promise<{ recommendedMeals: IMealItem[]; reasoning: string[] }> {
    const allMeals = await MealItem.find({ available: true });
    const recommendedMeals: IMealItem[] = [];
    const reasoning: string[] = [];

    const disease = profile.diseaseType ? profile.diseaseType.toLowerCase() : 'general';
    const stage = profile.recoveryStage || 'Recovering';

    reasoning.push(`Patient is being treated for ${profile.diseaseType || 'General'} in ${stage} stage.`);

    for (const meal of allMeals) {
      // 1. Check if safe using AllergyDetector
      const validation = AllergyDetector.validateMealForPatient(meal, profile, dietPlan);
      if (!validation.isSafe) {
        continue; // Skip unsafe meals
      }

      let matches = false;

      // 2. Check recommendedFor tags
      if (meal.recommendedFor && meal.recommendedFor.length > 0) {
        if (meal.recommendedFor.some((tag) => tag.toLowerCase().includes(disease))) {
          matches = true;
        }
      }

      // 3. Recovery stage checks
      if (stage === 'Critical' && meal.category === 'Beverage') {
        matches = true; // Clear liquid or light beverages for critical stage
      } else if (stage === 'Recovering' && meal.protein > 15) {
        matches = true; // High protein for tissue repair
      }

      // 4. Fallback for general matches
      if (meal.recommendedFor.includes('General')) {
        matches = true;
      }

      if (matches) {
        recommendedMeals.push(meal);
      }
    }

    if (recommendedMeals.length === 0) {
      // Fallback to any safe meals if specific matching returns empty
      for (const meal of allMeals) {
        if (AllergyDetector.validateMealForPatient(meal, profile, dietPlan).isSafe) {
          recommendedMeals.push(meal);
        }
      }
      reasoning.push('Defaulted to general safe catalog items matching dietary limits.');
    } else {
      reasoning.push(`Found ${recommendedMeals.length} specific meals optimized for ${profile.diseaseType}.`);
    }

    return {
      recommendedMeals,
      reasoning,
    };
  }
}
