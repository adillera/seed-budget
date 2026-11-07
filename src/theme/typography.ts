import values from './values';

/**
 * One family name per weight. Always set `fontFamily`, never `fontWeight`:
 * custom fonts don't switch faces through fontWeight on Android.
 */
export const fonts = {
  sans: {
    regular: values.fontFamilies.manrope,
    semibold: values.fontFamilies.manropeSemibold,
    bold: values.fontFamilies.manropeBold,
  },
  serif: {
    regular: values.fontFamilies.lora,
  },
} as const;

/** Type style names. The styles themselves are Tailwind classes, applied by `Text`. */
export type TypeVariant = keyof typeof values.typeScale;

/** Raw numbers per type style, for JS-only uses (TextField's animated label). */
export const typeScale = values.typeScale;

