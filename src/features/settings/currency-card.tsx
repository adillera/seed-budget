import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, SelectField, Text } from '@/components/ui';
import { CURRENCIES, findCurrency } from '@/lib/currencies';
import { setCurrencyCode, useCurrency } from '@/lib/currency';
import { formatMoney } from '@/lib/money';

/** The sample in "Amounts will look like". */
const SAMPLE_CENTS = 123_450;

// "₱ Philippine peso (PHP)"; no symbol prefix when the symbol is just the code.
const OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: c.symbol === c.code ? `${c.name} (${c.code})` : `${c.symbol} ${c.name} (${c.code})`,
}));

/** Pick the app currency; the preview follows the pick, Save applies it everywhere. */
export function CurrencyCard() {
  const saved = useCurrency();
  const [picked, setPicked] = useState(saved.code);
  const preview = findCurrency(picked) ?? saved;
  const changed = picked !== saved.code;

  return (
    <Card>
      <Text variant="h1" color="greenBrand" accessibilityRole="header">
        Currency
      </Text>
      <View className="gap-3">
        <SelectField
          label="Default currency"
          labelPosition="above"
          searchable
          searchPlaceholder="Search by name or code"
          options={OPTIONS}
          value={picked}
          onChange={setPicked}
        />
        <View className="gap-1">
          <View
            className="flex-row items-center justify-between gap-3 rounded-card bg-ceramic px-3 py-3"
            accessible
            accessibilityLabel={`Amounts will look like ${formatMoney(SAMPLE_CENTS, preview)}`}>
            <Text variant="small" color="textBlackSoft">
              Amounts will look like
            </Text>
            <Text variant="h1" color="greenAccent" numberOfLines={1} adjustsFontSizeToFit className="shrink">
              {formatMoney(SAMPLE_CENTS, preview)}
            </Text>
          </View>
          <Text variant="micro" color="textBlackSoft">
            Switching changes the symbol only. Your amounts keep their numbers.
          </Text>
        </View>
        <Button fullWidth disabled={!changed} onPress={() => setCurrencyCode(picked)}>
          Save currency
        </Button>
      </View>
    </Card>
  );
}
