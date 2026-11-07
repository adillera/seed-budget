import { Redirect } from 'expo-router';

import { AppTabs } from '@/features/tabs/app-tabs';
import { useOnboarded } from '@/lib/onboarding';

/** Main app tabs. Until onboarded, every tab redirects to /onboarding (first launch only). */
export default function TabsLayout() {
  const onboarded = useOnboarded();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
