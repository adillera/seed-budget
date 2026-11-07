/**
 * Every raw design-system value, once. Plain CommonJS with no imports, so both
 * `tailwind.config.js` and the typed modules in `src/theme/` can read it.
 * Usage notes for each token: prompts/01-design-system.md → Token reference.
 * Add a missing value here first, never inline in a component.
 */

/** Café Verde palette (light theme only). Tailwind names are kebab-case: greenAccent → `bg-green-accent`. */
const colors = {
  /** h1 headings, primary section headers, the single brand signal. */
  greenBrand: '#006241',
  /** Primary CTA fill, outline button text/border, links, selected ring, focus ring. Never on greenHouse. */
  greenAccent: '#00754a',
  /** Dark bands. Pair with textWhite / textWhiteSoft. */
  greenHouse: '#1e3932',
  /** Decorative accents and details on dark bands. */
  greenUplift: '#2b5148',
  /** Pale mint utility surface. */
  greenLight: '#d4e9e2',
  /** Reserved for status callouts. As text only on greenHouse. */
  gold: '#cba258',
  goldLight: '#dfc49d',
  goldLightest: '#faf6ee',
  /** Card and modal surface; inverse button fill on greenHouse. */
  white: '#ffffff',
  /** DropdownMenu, quiet containers. */
  neutralCool: '#f9f9f9',
  /** THE page canvas. Use instead of pure white for screens. */
  neutralWarm: '#f2f0eb',
  /** Zone separators, soft section washes. */
  ceramic: '#edebe9',
  /** Black filled button only. Never for text. */
  black: '#000000',
  /** Primary text on light grounds. */
  textBlack: 'rgba(0, 0, 0, 0.87)',
  /** Secondary text and metadata. */
  textBlackSoft: 'rgba(0, 0, 0, 0.58)',
  /** Primary text on greenHouse, greenAccent, greenBrand. */
  textWhite: '#ffffff',
  /** Secondary text on greenHouse. */
  textWhiteSoft: 'rgba(255, 255, 255, 0.7)',
  /** Error and destructive. Always paired with a message. */
  red: '#c82014',
  /** Warning fills. Never as text on light; pair with textBlack. */
  yellow: '#fbbc05',
  /** Resting border of fields and stepper buttons. */
  inputBorder: '#d6dbde',
  /** 1px row divider. */
  hairline: '#e7e7e7',
  validTint: 'hsla(160, 32%, 87%, 0.33)',
  invalidTint: 'hsla(4, 82%, 43%, 0.05)',
  /** 2px focus outline on light grounds. Use textWhite on greenHouse. */
  focusRing: '#00754a',
};

/**
 * Pixel-art palette for the Home growth avatar (src/features/home/growth-avatar.tsx).
 * JS only (react-native-svg fills), not Tailwind classes. Tuned to sit on the photo scrim.
 */
const pixel = {
  soilDark: '#3b2a1e',
  soil: '#5a4030',
  soilLight: '#7a5a42',
  stem: '#7fbf5a',
  trunk: '#6b4a2f',
  leafDark: '#2f6b3a',
  leaf: '#4f9a4a',
  leafLight: '#8fd06a',
};

/** Dark overlays and scrims on light surfaces. Tailwind: `bg-black-alpha-50`. */
const blackAlpha = {
  a06: 'rgba(0, 0, 0, 0.06)',
  a10: 'rgba(0, 0, 0, 0.1)',
  a20: 'rgba(0, 0, 0, 0.2)',
  a30: 'rgba(0, 0, 0, 0.3)',
  a40: 'rgba(0, 0, 0, 0.4)',
  a50: 'rgba(0, 0, 0, 0.5)',
  a60: 'rgba(0, 0, 0, 0.6)',
  a70: 'rgba(0, 0, 0, 0.7)',
  a80: 'rgba(0, 0, 0, 0.8)',
  a90: 'rgba(0, 0, 0, 0.9)',
};

/** Translucent fills on dark green. Tailwind: `bg-white-alpha-30`. */
const whiteAlpha = {
  a10: 'rgba(255, 255, 255, 0.1)',
  a20: 'rgba(255, 255, 255, 0.2)',
  a30: 'rgba(255, 255, 255, 0.3)',
  a40: 'rgba(255, 255, 255, 0.4)',
  a50: 'rgba(255, 255, 255, 0.5)',
  a60: 'rgba(255, 255, 255, 0.6)',
  a70: 'rgba(255, 255, 255, 0.7)',
  a80: 'rgba(255, 255, 255, 0.8)',
  a90: 'rgba(255, 255, 255, 0.9)',
};

/** space[3] (16) is the default: card padding, phone gutter, sibling gap. Tailwind: `p-3`. */
const space = { 1: 4, 2: 8, 3: 16, 4: 24, 5: 32, 6: 40, 7: 48, 8: 56, 9: 64 };

/** Tailwind screens: `md:` = 768 and up. */
const breakpoints = { sm: 480, md: 768, lg: 1024, xl: 1440 };

/** Outer page gutter: 16 below 768, 24 from 768, 40 from 1024 (= space 3 / 4 / 6). */
const gutter = { sm: 16, md: 24, lg: 40 };

/** Tailwind: `rounded-field|card|pill|circle`. */
const radius = {
  /** TextField, SelectField, Checkbox box. */
  field: 4,
  /** Cards, modals, panels. */
  card: 12,
  /** Every button. No exceptions. */
  pill: 50,
  /** FloatButton, stepper buttons, avatars. */
  circle: 9999,
};

/** CSS / React Native `boxShadow` strings. */
const shadow = {
  card: '0 0 0.5px 0 rgba(0, 0, 0, 0.14), 0 1px 1px 0 rgba(0, 0, 0, 0.24)',
  nav: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 2px 2px 0 rgba(0, 0, 0, 0.06), 0 0 2px 0 rgba(0, 0, 0, 0.07)',
  float: '0 0 6px 0 rgba(0, 0, 0, 0.24), 0 8px 12px 0 rgba(0, 0, 0, 0.14)',
  floatActive: '0 0 6px 0 rgba(0, 0, 0, 0.24), 0 8px 12px 0 rgba(0, 0, 0, 0)',
};

/** Fixed sizes. Tailwind (width/height/min-*): `h-button`, `size-stepper`, `max-w-content`… */
const size = {
  /** Reading width on tablets and web (column-lg). */
  maxContent: 720,
  /** Modal panel width cap. */
  modal: 500,
  float: 56,
  floatMini: 40,
  stepperButton: 32,
  /** Minimum tap target. */
  tapTarget: 44,
  /** Button md, SelectField row, SubNav tab. */
  button: 48,
  /** Button sm. */
  buttonSm: 36,
  /** TextField and Accordion header minimum height. */
  field: 56,
  /** Checkbox box. */
  checkbox: 24,
  /** Stacked FeatureBand media slot. */
  media: 160,
  /** Modal panel top padding (room for the close button). */
  modalInsetTop: 88,
  /** HoldToUnlock button face. */
  holdButton: 88,
  /** HoldToUnlock progress ring (outer box). */
  holdRing: 112,
  /** HoldToUnlock ring stroke width. */
  holdRingStroke: 4,
  /** Seed mark inside the HoldToUnlock button. */
  holdMark: 56,
  /** Logo mark in the brand lockup. */
  logoMark: 32,
  /** Onboarding field list: max height of its nested scroll area (about 2.5 rows, as in the mockup). */
  fieldList: 176,
  /** ScrollHint chip height. */
  scrollHint: 36,
  /** Home category breakdown bar height. */
  progressBar: 6,
  /** Home pixel plant (32 × 20 sprite grid at 3 per pixel). */
  growthAvatarWidth: 96,
  growthAvatarHeight: 60,
};

/** Milliseconds. */
const duration = {
  button: 200,
  icon: 200,
  image: 300,
  expander: 300,
  base: 400,
  /** Full press-and-hold to unlock (HoldToUnlock). */
  hold: 3000,
  /** Drain back from a full hold after an early release. */
  release: 800,
};

/** Cubic-bezier control points; `src/theme/tokens.ts` turns them into Reanimated easings. */
const easingCurves = {
  /** Accordion: measured ease-out. */
  expander: [0.25, 0.46, 0.45, 0.94],
  /** Checkbox mark: springy overshoot. */
  option: [0.32, 2.32, 0.61, 0.27],
};

/** Universal active-state scale on every button. */
const scalePress = 0.95;

const opacity = {
  /** Disabled controls. Tailwind: `opacity-disabled`. */
  disabled: 0.4,
  /** Pressed links (BackLink). */
  pressed: 0.6,
  /** Controls at rest that brighten while pressed (HoldToUnlock). */
  rest: 0.7,
};

/**
 * One family name per weight. Never set fontWeight with custom fonts.
 * Tailwind: `font-manrope|manrope-semibold|manrope-bold|lora`. Not `sans`/`serif`: NativeWind's
 * native preset overrides those keys with the system font and Georgia.
 */
const fontFamilies = {
  manrope: 'Manrope_400Regular',
  manropeSemibold: 'Manrope_600SemiBold',
  manropeBold: 'Manrope_700Bold',
  lora: 'Lora_400Regular',
};

/**
 * Type styles from the design reference: family key, size, line height, letter spacing.
 * On phones the largest heading is heroLarge (display/jumbo only at ≥ 768).
 */
const typeScale = {
  display: { family: 'manropeSemibold', size: 80, lineHeight: 96, letterSpacing: -0.16 },
  jumbo: { family: 'manropeSemibold', size: 58, lineHeight: 70, letterSpacing: -0.16 },
  heroLarge: { family: 'manropeSemibold', size: 45, lineHeight: 54, letterSpacing: -0.16 },
  /** Primary heading, set in greenBrand. */
  h1: { family: 'manropeSemibold', size: 24, lineHeight: 36, letterSpacing: -0.16 },
  /** Section title in textBlack. Same size as h1: weight and color carry the hierarchy. */
  h2: { family: 'manrope', size: 24, lineHeight: 36, letterSpacing: -0.16 },
  /** Uppercase title, textWhite on greenHouse. */
  bandTitle: { family: 'manropeBold', size: 32, lineHeight: 38, letterSpacing: -0.16, uppercase: true },
  bodyLarge: { family: 'manrope', size: 19, lineHeight: 33, letterSpacing: -0.16 },
  body: { family: 'manrope', size: 16, lineHeight: 24, letterSpacing: -0.16 },
  bodyStrong: { family: 'manropeSemibold', size: 16, lineHeight: 24, letterSpacing: -0.16 },
  small: { family: 'manrope', size: 14, lineHeight: 21, letterSpacing: -0.14 },
  smallStrong: { family: 'manropeSemibold', size: 14, lineHeight: 21, letterSpacing: -0.14 },
  /** BackLink label. */
  smallBold: { family: 'manropeBold', size: 14, lineHeight: 21, letterSpacing: -0.14 },
  micro: { family: 'manrope', size: 13, lineHeight: 20, letterSpacing: -0.13 },
  buttonLabel: { family: 'manropeSemibold', size: 16, lineHeight: 19, letterSpacing: -0.16 },
  buttonLabelSm: { family: 'manropeSemibold', size: 14, lineHeight: 17, letterSpacing: -0.14 },
  /** Uppercase label on a SelectField border. */
  fieldLabel: { family: 'manropeBold', size: 13, lineHeight: 20, letterSpacing: 0.325, uppercase: true },
  /** Occasional editorial headline. Never in data-entry flows. */
  editorial: { family: 'lora', size: 45, lineHeight: 54, letterSpacing: 0 },
};

module.exports = {
  colors,
  pixel,
  blackAlpha,
  whiteAlpha,
  space,
  breakpoints,
  gutter,
  radius,
  shadow,
  size,
  duration,
  easingCurves,
  scalePress,
  opacity,
  fontFamilies,
  typeScale,
};
