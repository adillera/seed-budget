import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { DropdownMenu } from './dropdown-menu';
import { HintScrollView } from './scroll-hint';
import { FieldLabel, TextField } from './text-field';
import { Icon, icons } from './icon';
import { Modal } from './modal';
import { Stepper, type StepperProps } from './stepper';
import { Text } from './text';

export type SelectOption = { label: string; value: string };

type BaseProps = {
  /** Uppercase label on the top border. */
  label: string;
};

type OptionsProps = BaseProps & {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown when nothing is selected. */
  placeholder?: string;
  /**
   * - notch (default): the label sits on the top border and the value is centered.
   * - above: uppercase label above a boxed row, value left-aligned (matches TextField `above`).
   */
  labelPosition?: 'notch' | 'above';
  /**
   * Long lists (currencies): the modal gets a search box (matches label or value, any case) and a
   * scrolling list capped at `max-h-picker`, with a check on the selected option.
   */
  searchable?: boolean;
  /** Searchable only: placeholder of the search box. */
  searchPlaceholder?: string;
  stepper?: never;
  rowLabel?: never;
};

type StepperRowProps = BaseProps & {
  /** Quantity row: the chevron is replaced by a Stepper. */
  stepper: StepperProps;
  /** Text on the left of the quantity row. */
  rowLabel: string;
  options?: never;
};

export type SelectFieldProps = OptionsProps | StepperRowProps;

/** Outlined row with a floating uppercase label. Stack rows with a space[3] gap. */
export function SelectField(props: SelectFieldProps) {
  if (props.stepper) {
    return (
      <Outline label={props.label}>
        <View className="flex-row items-center gap-3">
          <Text className="flex-1">{props.rowLabel}</Text>
          <Stepper {...props.stepper} />
        </View>
      </Outline>
    );
  }
  return <OptionsSelect {...props} />;
}

function OptionsSelect({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  labelPosition = 'notch',
  searchable,
  searchPlaceholder,
}: OptionsProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const selected = options.find((o) => o.value === current);

  const choose = (option: SelectOption) => {
    setInternal(option.value);
    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder ?? 'not set'}`}
        accessibilityHint="Opens the list of options">
        {labelPosition === 'above' ? (
          <View className="gap-1">
            <FieldLabel label={label} />
            {/* Same box geometry as TextField `above` (border, p-px, a py-3 row) so they line up side by side. */}
            <View className="min-h-field rounded-field border border-input-border p-px bg-white justify-center">
              <View className="flex-row items-center gap-2 px-3 py-3">
                <Text
                  className="flex-1"
                  color={selected ? 'textBlack' : 'textBlackSoft'}
                  numberOfLines={1}>
                  {selected?.label ?? placeholder ?? ''}
                </Text>
                <Icon name={icons.chevronDown} size={18} />
              </View>
            </View>
          </View>
        ) : (
          <Outline label={label}>
            <View className="flex-row items-center">
              <Text
                className="flex-1 text-center px-5"
                color={selected ? 'textBlack' : 'textBlackSoft'}
                numberOfLines={1}>
                {selected?.label ?? placeholder ?? ''}
              </Text>
              <View className="absolute right-0">
                <Icon name={icons.chevronDown} size={18} />
              </View>
            </View>
          </Outline>
        )}
      </Pressable>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        {searchable ? (
          // Mounted only while open, so the search starts empty every time.
          open && (
            <SearchableOptions
              label={label}
              options={options}
              selected={current}
              placeholder={searchPlaceholder}
              onSelect={choose}
            />
          )
        ) : (
          <DropdownMenu items={options} onSelect={choose} />
        )}
      </Modal>
    </>
  );
}

function SearchableOptions({
  label,
  options,
  selected,
  placeholder,
  onSelect,
}: {
  label: string;
  options: readonly SelectOption[];
  selected?: string;
  placeholder?: string;
  onSelect: (option: SelectOption) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : options;

  return (
    <View className="gap-3">
      <TextField
        label={`Search ${label.toLowerCase()}`}
        labelPosition="above"
        hideLabel
        placeholder={placeholder ?? 'Search'}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => {
          if (matches.length === 1) onSelect(matches[0]);
        }}
      />
      {matches.length === 0 ? (
        <Text color="textBlackSoft" className="px-1 py-2">
          Nothing matches “{query.trim()}”
        </Text>
      ) : (
        <HintScrollView
          className="max-h-picker bg-neutral-cool rounded-card overflow-hidden"
          contentContainerClassName="py-2"
          keyboardShouldPersistTaps="handled"
          accessibilityRole="list">
          {matches.map((option) => {
            const isSelected = option.value === selected;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelect(option)}
                accessibilityRole="button"
                aria-selected={isSelected}
                className="min-h-tap-target flex-row items-center gap-2 px-4 py-2 active:bg-black-alpha-6">
                <Text className="flex-1" variant={isSelected ? 'bodyStrong' : 'body'}>
                  {option.label}
                </Text>
                {isSelected && <Icon name={icons.check} size={18} color="greenAccent" />}
              </Pressable>
            );
          })}
        </HintScrollView>
      )}
    </View>
  );
}

// The label notch sits on the top border: it's lifted by about half the fieldLabel line height,
// and the outline gets the same room above it.
const notchGeometry = { outline: { marginTop: 10 }, notch: { top: -11 } } as const;

function Outline({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View
      className="min-h-button border border-input-border rounded-field bg-white justify-center px-3 py-2"
      style={notchGeometry.outline}>
      <View className="absolute left-2 px-1 bg-white" style={notchGeometry.notch}>
        <Text variant="fieldLabel">{label}</Text>
      </View>
      {children}
    </View>
  );
}
