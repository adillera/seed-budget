import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';
import { Easing } from 'react-native-reanimated';

import values from './values';

/**
 * Non-color tokens, typed for JS-only uses (Reanimated timing, hitSlop math, safe-area offsets).
 * In components prefer the Tailwind classes (`p-3`, `rounded-card`, `shadow-card`).
 */
export const space = values.space;
export const breakpoints = values.breakpoints;
export const gutter = values.gutter;
export const radius = values.radius;
/** React Native `boxShadow` strings. */
export const shadow = values.shadow;
export const size = values.size;
/** Milliseconds. */
export const duration = values.duration;
/** Universal active-state scale on every button. */
export const scalePress = values.scalePress;
export const opacity = values.opacity;
/** Lucide stroke width; `selected` marks the active tab. */
export const iconStroke = values.iconStroke;

const bezier = ([x1, y1, x2, y2]: number[]) => Easing.bezier(x1, y1, x2, y2);

export const easing = {
  /** Accordion: measured ease-out. */
  expander: bezier(values.easingCurves.expander),
  /** Checkbox mark: springy overshoot. */
  option: bezier(values.easingCurves.option),
};

function subscribeToWidth(onChange: () => void) {
  const sub = Dimensions.addEventListener('change', onChange);
  return () => sub.remove();
}

/**
 * Window width for logic that needs it in JS. For layout use breakpoint classes (`md:`).
 * Never `useWindowDimensions`: this reports 0 during web server rendering and hydration,
 * so the server HTML matches the first client render, then updates to the real width.
 */
export function useWindowWidth() {
  return useSyncExternalStore(
    subscribeToWidth,
    () => Dimensions.get('window').width,
    () => 0,
  );
}

