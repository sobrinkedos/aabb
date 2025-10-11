import { useState, useEffect } from 'react';

export interface UseOnboardingReturn {
  showOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

export function useOnboarding(userId?: string): UseOnboardingReturn {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Verificar se o usuário já completou o onboarding
  useEffect(() => {
    if (!userId) return;

    const onboardingKey = `onboarding_completed_${userId}`;
    const completed = localStorage.getItem(onboardingKey);
    
    if (!completed) {
      // Se não completou, verificar se deve mostrar (ex: após registro)
      const shouldShow = sessionStorage.getItem('show_onboarding');
      if (shouldShow === 'true') {
        setShowOnboarding(true);
        sessionStorage.removeItem('show_onboarding');
      }
    }
  }, [userId]);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    if (userId) {
      const onboardingKey = `onboarding_completed_${userId}`;
      localStorage.setItem(onboardingKey, 'true');
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    if (userId) {
      const onboardingKey = `onboarding_completed_${userId}`;
      localStorage.setItem(onboardingKey, 'skipped');
    }
  };

  return {
    showOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  };
}