import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { ColorToken, TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  /** Type style from the design system. Default `body`. */
  variant?: TypeVariant;
  /** Color token. Default `textBlack` (`greenBrand` for `h1`). */
  color?: ColorToken;
  /** Layout classes only (margins, flex, alignment). Type and color come from the props. */
  className?: string;
};

// Full class strings, written out so Tailwind can find them. Family + size (+ uppercase).
const variantClass: Record<TypeVariant, string> = {
  display: 'font-manrope-semibold text-display',
  jumbo: 'font-manrope-semibold text-jumbo',
  heroLarge: 'font-manrope-semibold text-hero-large',
  h1: 'font-manrope-semibold text-h1',
  h2: 'font-manrope text-h2',
  bandTitle: 'font-manrope-bold text-band-title uppercase',
  bodyLarge: 'font-manrope text-body-large',
  body: 'font-manrope text-body',
  bodyStrong: 'font-manrope-semibold text-body-strong',
  small: 'font-manrope text-small',
  smallStrong: 'font-manrope-semibold text-small-strong',
  smallBold: 'font-manrope-bold text-small-bold',
  micro: 'font-manrope text-micro',
  buttonLabel: 'font-manrope-semibold text-button-label',
  buttonLabelSm: 'font-manrope-semibold text-button-label-sm',
  fieldLabel: 'font-manrope-bold text-field-label uppercase',
  editorial: 'font-lora text-editorial',
};

const colorClass: Record<ColorToken, string> = {
  greenBrand: 'text-green-brand',
  greenAccent: 'text-green-accent',
  greenHouse: 'text-green-house',
  greenUplift: 'text-green-uplift',
  greenLight: 'text-green-light',
  gold: 'text-gold',
  goldLight: 'text-gold-light',
  goldLightest: 'text-gold-lightest',
  white: 'text-white',
  neutralCool: 'text-neutral-cool',
  neutralWarm: 'text-neutral-warm',
  ceramic: 'text-ceramic',
  black: 'text-black',
  textBlack: 'text-text-black',
  textBlackSoft: 'text-text-black-soft',
  textWhite: 'text-text-white',
  textWhiteSoft: 'text-text-white-soft',
  red: 'text-red',
  yellow: 'text-yellow',
  inputBorder: 'text-input-border',
  hairline: 'text-hairline',
  validTint: 'text-valid-tint',
  invalidTint: 'text-invalid-tint',
  focusRing: 'text-focus-ring',
};

/** All text in the app goes through this component. */
export function Text({ variant = 'body', color, className, ...rest }: TextProps) {
  const resolved = color ?? (variant === 'h1' ? 'greenBrand' : 'textBlack');
  return (
    <RNText className={`${variantClass[variant]} ${colorClass[resolved]} ${className ?? ''}`} {...rest} />
  );
}
