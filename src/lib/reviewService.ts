import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCookStore } from '../store/cookStore';

const LAST_REVIEW_PROMPT_KEY = 'spicechef_last_review_prompt';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_COOK_SESSIONS = 2;

/**
 * Request an in-app review if conditions are met:
 * - User has completed at least 2 cook sessions
 * - At least 30 days since last prompt
 * - StoreReview action is available on device
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    // Check minimum cook sessions
    const { recentlyCooked } = useCookStore.getState();
    if (recentlyCooked.length < MIN_COOK_SESSIONS) return;

    // Check 30-day cooldown
    const lastPrompt = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);
    if (lastPrompt) {
      const elapsed = Date.now() - Number(lastPrompt);
      if (elapsed < THIRTY_DAYS_MS) return;
    }

    // Check if review action is available
    const available = await StoreReview.hasAction();
    if (!available) return;

    // Request review and record timestamp
    await StoreReview.requestReview();
    await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, String(Date.now()));
  } catch {
    // Silently fail — review prompts are non-critical
  }
}
