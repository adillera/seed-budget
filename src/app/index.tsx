import { Redirect, Stack } from 'expo-router';

import { Card, Screen, Text } from '@/components/ui';
import { useOnboarded } from '@/lib/onboarding';

export default function Index() {
  const onboarded = useOnboarded();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Screen scroll edges={[]}>
      <Stack.Screen options={{ title: 'Budget' }} />
      <Text variant="heroLarge">Budget</Text>
      <Text variant="bodyLarge" color="textBlackSoft">
        Set your starting capital, add recurring income and expenses, and see where you&apos;ll land.
      </Text>
      <Card>
        <Text variant="h1">Getting started</Text>
        <Text color="textBlackSoft">
          Edit src/app/index.tsx to build this screen with the components in src/components/ui.
        </Text>
      </Card>
    </Screen>
  );
}
