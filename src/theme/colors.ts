/**
 * Color tokens (light theme only), typed for JS-only uses: Reanimated, `tintColor`,
 * `ActivityIndicator`, the navigation theme. In components prefer the Tailwind classes
 * (`bg-green-accent`, `text-text-black`). Values and usage notes live in `./values.js`.
 */
import values from './values';

export const colors = values.colors;
export type ColorToken = keyof typeof colors;

/** Dark overlays and scrims on light surfaces. */
export const blackAlpha = values.blackAlpha;

/** Translucent fills on dark green. */
export const whiteAlpha = values.whiteAlpha;

/** Pixel-art palette for the Home growth avatar (react-native-svg fills). */
export const pixel = values.pixel;
export type PixelColor = keyof typeof pixel;
