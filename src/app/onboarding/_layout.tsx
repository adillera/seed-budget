import { Redirect, Stack } from 'expo-router';

import { OnboardingDraftProvider } from '@/features/onboarding/draft';
import { useOnboarded } from '@/lib/onboarding';
import { colors } from '@/theme';

/**
 * Onboarding: hold to unlock → fields → plough. The draft is shared by the setup steps.
 * Once onboarded (after "Plant the seeds", or on a later launch or deep link) this redirects to
 * `/`, replacing onboarding in the root stack so Back can't return to it.
 */
export default function OnboardingLayout() {
  const onboarded = useOnboarded();
  if (onboarded) return <Redirect href="/" />;

  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.greenHouse } }} />
    </OnboardingDraftProvider>
  );
}
