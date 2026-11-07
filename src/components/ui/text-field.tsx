import { useEffect, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, duration, fonts, space, typeScale } from '@/theme';

import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholder'> & {
  /** Visible label, and always the accessibility label. */
  label: string;
  state?: 'valid' | 'invalid';
  /** Shown under the field. Always give one with a state: color never carries it alone. */
  message?: string;
  /**
   * - floating (default): the label sits in the box and shrinks when focused or filled.
   * - above: uppercase `fieldLabel` above a boxed input with a placeholder (form screens).
   */
  labelPosition?: 'floating' | 'above';
  /** Above only: e.g. "(optional)", after the label in micro, not uppercase. */
  optionalHint?: string;
  /** Above only: drawn inside the box before the text, e.g. the currency symbol. */
  prefix?: string;
  /** Above only: `lg` sets the text in `h2` (amounts). */
  inputSize?: 'md' | 'lg';
  /** Above only. */
  placeholder?: string;
  /** Above only: no visible label (it stays the accessibility label). */
  hideLabel?: boolean;
};

// The floating label animates between these; the input padding below is laid out around them.
const LABEL_REST = { size: typeScale.body.size, top: 16 };
const LABEL_RAISED = { size: typeScale.micro.size, top: 6 };

// Input geometry paired with the label positions above (15 = space[3] minus the 1px border).
const inputGeometry = { paddingHorizontal: space[3] - 1, paddingBottom: 6, minHeight: 52 };

// Static part of the animated label. On style, not classes: NativeWind doesn't style Reanimated views on native.
const labelBase = {
  position: 'absolute',
  left: space[3] - 1,
  right: space[3],
  fontFamily: fonts.sans.regular,
  color: colors.textBlackSoft,
} as const;

const borderClass = {
  rest: 'border border-input-border p-px',
  active: 'border border-green-accent p-px',
  invalid: 'border border-red p-px',
  focused: 'border-2 border-green-accent p-0',
  focusedInvalid: 'border-2 border-red p-0',
} as const;

const fillClass = { none: 'bg-white', valid: 'bg-valid-tint', invalid: 'bg-invalid-tint' } as const;

/**
 * Text input. Floating label (shrinks from 16 to 13 when focused or filled) by default;
 * `labelPosition="above"` for the boxed form style with an uppercase label.
 */
export function TextField(props: TextFieldProps) {
  return props.labelPosition === 'above' ? <AboveField {...props} /> : <FloatingField {...props} />;
}

function borderFor(state: TextFieldProps['state'], focused: boolean) {
  if (state === 'invalid') return focused ? borderClass.focusedInvalid : borderClass.invalid;
  if (focused) return borderClass.focused;
  return state === 'valid' ? borderClass.active : borderClass.rest;
}

const inputTextClass = { md: 'text-body', lg: 'text-h2' } as const;

function AboveField({
  label,
  state,
  message,
  labelPosition: _labelPosition,
  optionalHint,
  prefix,
  inputSize = 'md',
  placeholder,
  hideLabel,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const text = value ?? internal;

  return (
    <View className="gap-1">
      {!hideLabel && <FieldLabel label={label} optionalHint={optionalHint} />}
      <View
        className={`min-h-field rounded-field justify-center ${borderFor(state, focused)} ${
          fillClass[state ?? 'none']
        }`}>
        <View className="flex-row items-center gap-2 px-3">
          {prefix && (
            <Text variant={inputSize === 'lg' ? 'h2' : 'body'} color="textBlackSoft" aria-hidden>
              {prefix}
            </Text>
          )}
          <TextInput
            {...rest}
            value={text}
            placeholder={placeholder}
            placeholderTextColor={colors.textBlackSoft}
            onChangeText={(t) => {
              setInternal(t);
              onChangeText?.(t);
            }}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            accessibilityLabel={label}
            accessibilityHint={message}
            selectionColor={colors.greenAccent}
            // outline-none: the box border shows focus; drop the browser's own outline on web.
            className={`flex-1 font-manrope text-text-black py-3 outline-none ${inputTextClass[inputSize]}`}
          />
        </View>
      </View>
      {message && (
        <Text variant="micro" color={state === 'invalid' ? 'red' : 'textBlackSoft'}>
          {message}
        </Text>
      )}
    </View>
  );
}

/** Uppercase label above a field, with an optional lowercase hint ("(optional)"). */
export function FieldLabel({ label, optionalHint }: { label: string; optionalHint?: string }) {
  return (
    <View className="flex-row items-baseline gap-1">
      <Text variant="fieldLabel">{label}</Text>
      {optionalHint && (
        <Text variant="micro" color="textBlackSoft">
          {optionalHint}
        </Text>
      )}
    </View>
  );
}

function FloatingField({
  label,
  state,
  message,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  labelPosition: _labelPosition,
  optionalHint: _optionalHint,
  prefix: _prefix,
  inputSize: _inputSize,
  placeholder: _placeholder,
  hideLabel: _hideLabel,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const text = value ?? internal;
  const raised = focused || text.length > 0;

  const progress = useSharedValue(raised ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(raised ? 1 : 0, { duration: duration.button }));
  }, [raised, progress]);

  const labelStyle = useAnimatedStyle(() => ({
    top: LABEL_REST.top + (LABEL_RAISED.top - LABEL_REST.top) * progress.value,
    fontSize: LABEL_REST.size + (LABEL_RAISED.size - LABEL_REST.size) * progress.value,
  }));

  const border = borderFor(state, focused);

  return (
    <View className="gap-1">
      <View className={`min-h-field rounded-field justify-end ${border} ${fillClass[state ?? 'none']}`}>
        <Animated.Text
          style={[labelBase, labelStyle]}
          numberOfLines={1}
          pointerEvents="none"
          importantForAccessibility="no">
          {label}
        </Animated.Text>
        <TextInput
          {...rest}
          value={text}
          onChangeText={(t) => {
            setInternal(t);
            onChangeText?.(t);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          accessibilityHint={message}
          selectionColor={colors.greenAccent}
          className="font-manrope text-body text-text-black pt-4 outline-none"
          style={inputGeometry}
        />
      </View>
      {message && (
        <Text variant="micro" color={state === 'invalid' ? 'red' : 'textBlackSoft'}>
          {message}
        </Text>
      )}
    </View>
  );
}
