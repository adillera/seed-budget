// Tailwind theme for NativeWind v4, built from the design-system tokens in src/theme/values.js.
// The stock scales are REPLACED (not extended): only design-system classes exist.
const t = require('./src/theme/values');

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const px = (n) => `${n}px`;
const mapKeys = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => fn(k, v)));
const alpha = (scale) => mapKeys(scale, (k, v) => [String(Number(k.slice(1))), v]);

const sizes = mapKeys(t.size, (k, v) => [kebab(k), px(v)]);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Light theme only. 'class' lets the app pin the color scheme (userInterfaceStyle: light)
  // instead of following the system.
  darkMode: 'class',
  theme: {
    screens: mapKeys(t.breakpoints, (k, v) => [k, px(v)]),
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...mapKeys(t.colors, (k, v) => [kebab(k), v]),
      'black-alpha': alpha(t.blackAlpha),
      'white-alpha': alpha(t.whiteAlpha),
    },
    spacing: { 0: '0px', px: '1px', ...mapKeys(t.space, (k, v) => [k, px(v)]) },
    borderRadius: { none: '0px', ...mapKeys(t.radius, (k, v) => [k, px(v)]) },
    // No shadow classes: NativeWind flattens multi-layer shadows on native. Use
    // style={{ boxShadow: shadow.card }} from '@/theme' (React Native boxShadow).
    boxShadow: { none: 'none' },
    fontFamily: mapKeys(t.fontFamilies, (k, v) => [kebab(k), [v]]),
    fontSize: mapKeys(t.typeScale, (k, v) => [
      kebab(k),
      [px(v.size), { lineHeight: px(v.lineHeight), letterSpacing: px(v.letterSpacing) }],
    ]),
    extend: {
      width: sizes,
      height: sizes,
      size: sizes,
      minWidth: sizes,
      minHeight: sizes,
      maxHeight: sizes,
      maxWidth: { content: px(t.size.maxContent), modal: px(t.size.modal) },
      padding: { 'modal-inset-top': px(t.size.modalInsetTop) },
      opacity: mapKeys(t.opacity, (k, v) => [k, String(v)]),
    },
  },
  plugins: [],
};
