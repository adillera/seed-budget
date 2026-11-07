import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { DropdownMenu } from './dropdown-menu';
import { FieldLabel } from './text-field';
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
}: OptionsProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const selected = options.find((o) => o.value === current);

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
        <DropdownMenu
          items={options}
          onSelect={(option) => {
            setInternal(option.value);
            onChange?.(option.value);
            setOpen(false);
          }}
        />
      </Modal>
    </>
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
