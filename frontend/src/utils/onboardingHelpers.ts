/**
 * Helper functions for onboarding flow
 */

/**
 * Update the onboarding status in localStorage
 * This ensures OnboardingGuard has the latest status without needing to re-fetch from API
 */
export const updateLocalStorageOnboardingStatus = (
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
): void => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Update both naming conventions for compatibility
      user.onboarding_status = status;
      user.onboardingStatus = status;
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Failed to update onboarding status in localStorage:', error);
  }
};

/**
 * Get the current onboarding status from localStorage
 */
export const getLocalStorageOnboardingStatus = (): string | null => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.onboarding_status || user.onboardingStatus || null;
    }
  } catch (error) {
    console.error('Failed to read onboarding status from localStorage:', error);
  }
  return null;
};

