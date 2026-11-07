import { Card, Screen, Text } from '@/components/ui';

/** Stand-in for a tab that isn't built yet. */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen scroll>
      <Text variant="h1" color="greenBrand" accessibilityRole="header">
        {title}
      </Text>
      <Card>
        <Text color="textBlackSoft">Coming soon.</Text>
      </Card>
    </Screen>
  );
}
