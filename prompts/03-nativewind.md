# 03 · Design system on NativeWind

Status: done

## Goal

The design system from `01-design-system.md` is styled with NativeWind `className` utilities instead of `StyleSheet.create`. It has the same tokens, the same 17 components with the same props, and the same look. New screens are written with Tailwind classes such as `bg-neutral-warm p-3 rounded-card`, which only accept design-system values.

## Decisions

- **Same look, new engine.** Every color, type style, spacing, radius, shadow, duration and component API in `01-design-system.md` → Token reference stays as it is. Screens must look the same before and after; any visible difference is a bug.
- **Version:** NativeWind `4.2.7` (stable `latest`) with `tailwindcss@^3.4.17`. v5 is still `5.0.0-rc.1`, so we don't use it. Source: https://www.nativewind.dev/llms-full.txt (v4 docs).
- **One source of truth for values:** the raw values move into `src/theme/tokens.js`, a plain CommonJS file with no imports. It feeds both `tailwind.config.js` (which can't import TS) and the TS modules in `src/theme/`. The TS modules re-export typed objects with the same names as today (`colors`, `space`, `radius`, `shadow`, `size`, `duration`, `easing`, `scalePress`, `fonts`, `breakpoints`). This keeps working code that needs values in JS: Reanimated, `Icon` `tintColor`, `ActivityIndicator`, `selectionColor` and the navigation theme.
- **The Tailwind theme replaces the stock scales, it doesn't extend them**, for `colors`, `spacing`, `borderRadius`, `fontFamily`, `fontSize`, `boxShadow` and `screens`. Stock classes like `bg-blue-500` or `p-12` then won't generate, which enforces "never hard-code a value". Keep `transparent`, `current`, `0` and `px`.
- **Class names are kebab-case reference names.** Colors: `green-brand`, `green-accent`, `neutral-warm`, `text-black`… This gives classes like `bg-green-accent`, and `text-text-black` for text color. Alpha scales: `black-alpha-{6,10,20,…,90}` and `white-alpha-{10,…,90}`. TS keeps camelCase (`colors.greenAccent`).
- **Spacing keys keep the `space` numbering:** `1`=4, `2`=8, `3`=16, `4`=24, `5`=32, `6`=40, `7`=48, `8`=56, `9`=64. So `p-3` = `space[3]` = 16. Sizes go under `extend.width/height/minHeight/minWidth`: `tap` 44, `float` 56, `float-mini` 40, `stepper` 32, and `max-w-content` 720.
- **Radius:** `rounded-field` 4, `rounded-card` 12, `rounded-pill` 50, `rounded-circle` 9999. The stock radii are removed.
- **Fonts:** one Tailwind family per weight: `font-sans` (Manrope_400Regular), `font-sans-semibold`, `font-sans-bold`, `font-serif` (Lora_400Regular). Never use `font-bold`, `font-semibold` or other weight classes, because they set `fontWeight`. Fonts still load at runtime through `useAppFonts`; NativeWind doesn't load fonts.
- **Type styles become `fontSize` entries** with px lineHeight and letterSpacing, named after the variant: `text-hero-large`, `text-h1`, `text-body-strong`… (the size only). `Text` combines the size class with the right `font-*` class and `uppercase` where needed, in a static `variantClass` map. Screens keep using `<Text variant="h1">`. They never stack `text-*`/`font-*` on it themselves, except `className` for layout.
- **No dynamic class strings.** Tailwind only generates classes it finds written out in full in `src/**/*.{ts,tsx}`. Component variant, size and color props map to complete class strings in static objects (`{ primary: 'bg-green-accent border-green-accent' }`), never `` `bg-${x}` ``.
- **What stays on `style`:** values Reanimated animates (`useAnimatedStyle`), safe-area insets, and `boxShadow`, but only if step 1 shows the `shadow-card` class doesn't render the multi-layer shadow the same way on native. Everything static moves to `className`.
- **Responsive layout uses breakpoint classes.** `screens` = `sm 480, md 768, lg 1024, xl 1440`. The `Screen` gutter becomes `px-3 md:px-4 lg:px-6` (16/24/40) and FeatureBand's stacked/row switch becomes `md:flex-row`. On web these are real CSS media queries, so there's no SSR hydration mismatch. `useWindowWidth()` stays for logic that needs the width in JS, and `useGutter()` is removed if nothing uses it.
- **Pressed states:** `PressScale` keeps the Reanimated scale. Pressed backgrounds that today use a Pressable style function (such as DropdownMenu rows) use `active:` classes, e.g. `active:bg-black-alpha-6`.
- **Third-party components:** `SafeAreaView` (react-native-safe-area-context) and `SymbolView` don't take `className` out of the box. Register `SafeAreaView` once with `cssInterop` in `src/theme/interop.ts`, imported by the root layout. `Icon` keeps `tintColor` from `colors` and a `style` prop.
- **Web bundler:** `app.json` → `web.bundler: "metro"` (the docs require it). `web.output: "server"` stays.
- **Prettier class sorting** (`prettier-plugin-tailwindcss`) is skipped; the project doesn't use Prettier.

## Out of scope

- Visual changes of any kind, new components and dark mode. New tokens are allowed only to name values that already exist in a component (button heights 48/36, the modal's 88 top padding), so the move doesn't need arbitrary `[...]` classes.
- NativeWind v5 or Tailwind v4.
- `02-onboarding` (still a draft). It will be built on the new system afterwards. Its planned tokens (`duration.hold`, `size.holdButton`…) get added to `tokens.js` then, not now.
- Moving the navigation theme (`_layout.tsx` `Theme`/`screenOptions`) to classes. It takes JS values and keeps reading `colors`.

## Steps

### 1. Install, configure, and test on one component

Read the v4 install guide in https://www.nativewind.dev/llms-full.txt (the Expo section) and https://docs.expo.dev/guides/tailwind/ first.

- `npx expo install nativewind@4.2.7 react-native-reanimated react-native-safe-area-context` and `npx expo install --dev tailwindcss@^3.4.17` (npm project; no bun.lock).
- Create `babel.config.js`:
  ```js
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    };
  };
  ```
- Create `metro.config.js`: `withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' })`.
- Create `src/global.css` with the three `@tailwind` directives and import it first thing in `src/app/_layout.tsx` (`import '@/global.css'`).
- Create `nativewind-env.d.ts` at the root: `/// <reference types="nativewind/types" />` (don't name it `nativewind.d.ts`).
- `app.json`: add `"bundler": "metro"` under `web`.
- Create `src/theme/tokens.js` holding every value from `01-design-system.md` → Token reference as plain objects (`module.exports = { colors, blackAlpha, whiteAlpha, space, radius, shadow, size, duration, breakpoints, fontFamilies, typeScale, scalePress }`). Easing curves stay in TS as Reanimated `Easing.bezier`, with their numbers kept in `tokens.js`.
- Create `tailwind.config.js` with `content: ['./src/**/*.{ts,tsx}']`, `presets: [require('nativewind/preset')]`, and `theme` built from `tokens.js` as described in Decisions (replace `colors`, `spacing`, `borderRadius`, `fontFamily`, `fontSize`, `boxShadow`, `screens`; extend the sizes and `maxWidth.content`).
- Point `src/theme/colors.ts`, `tokens.ts` and `typography.ts` at `tokens.js`, keeping their exported names and types unchanged so nothing else breaks yet.
- **Test:** convert only `Card` to `className` (`bg-white rounded-card p-4 gap-2 shadow-card`, `tight` → `p-3`). Run on web and, if available, an iOS simulator. Confirm that: the class styles apply on native and web; `shadow-card` matches the old `boxShadow` (if not, keep `style={{ boxShadow: shadow.card }}` and note it in Decisions); `className` on a Reanimated `Animated.View` works; the React Compiler and `web.output: "server"` produce no errors or hydration warnings; and Fast Refresh picks up class changes.

Done when: typecheck and lint pass and Card looks the same as before. **If any of these checks fail, stop and report instead of working around them.**

### 2. Primitives: Text, Screen, Icon, PressScale

- `Text`: `variantClass: Record<TypeVariant, string>` (e.g. `heroLarge: 'font-sans-semibold text-hero-large'`, `fieldLabel: 'font-sans-bold text-field-label uppercase'`) and `colorClass: Record<ColorToken, string>` (`'text-text-black'`, `'text-green-brand'`…). Same props as now, plus `className` merged last. Default color logic stays the same (h1 → greenBrand).
- `Screen`: `cssInterop` `SafeAreaView` in `src/theme/interop.ts`. Classes: canvas `flex-1 bg-neutral-warm`, column `w-full max-w-content self-center gap-3 px-3 md:px-4 lg:px-6`, scroll content `py-4`. Keep the `edges`, `scroll` and `contentStyle` props, and add `contentClassName`.
- `Icon`: unchanged API. Only its own static styles (if any) move to classes.
- `PressScale`: accept `className` and `containerClassName` alongside `style` and `containerStyle`. Disabled is `opacity-40`. The scale stays on `useAnimatedStyle`.

Done when: `src/app/index.tsx` looks the same on web at 390 and 1024 wide.

### 3. Actions and surfaces: Button, FloatButton, Modal, FeatureBand, DropdownMenu

- `Button`: a static `variants` map of `{ container: 'bg-… border-…', label: ColorToken }`, sizes `min-h-[48px] px-4` / `min-h-[36px] px-3`. Arbitrary values are allowed only for these component-internal heights from plan 01; to avoid them, add `button` 48 and `button-sm` 36 to the size tokens instead (preferred). Base `flex-row items-center justify-center gap-2 border rounded-pill`. `ActivityIndicator` color still comes from `colors`.
- `FloatButton`, `Modal` (scrim `bg-black-alpha-50`, panel `bg-white rounded-card p-4 pt-[88px]` → add a token for 88 if it repeats), `FeatureBand` (`bg-green-house p-5`, `md:flex-row`, media `bg-green-uplift`), `DropdownMenu` (`bg-neutral-cool rounded-card`, rows `py-2 active:bg-black-alpha-6`, destructive label via `Text color="red"`).
- Delete each file's `StyleSheet.create` block once it's empty.

### 4. Forms: TextField, SelectField, Stepper, Checkbox

- Static borders, fills, radii and paddings move to classes. TextField's border/fill per `state` and focus become a static class map (`invalid: 'border-red bg-invalid-tint'`…). The floating label's animated position and size stay on `useAnimatedStyle`.
- Checkbox: box `size-6 border-2 border-text-black rounded-field`; checked `bg-green-accent border-green-accent`. The mark's scale stays animated.
- Stepper: buttons `size-stepper rounded-circle border border-input-border bg-white`. hitSlop is unchanged.
- SelectField: row `min-h-[48px]` (use the `button` 48 token) `border border-input-border rounded-field bg-white`; the label notch is `bg-white px-1`.

### 5. Navigation and content: SubNav, BackLink, Accordion

- SubNav: bar `h-[48px]` (token) `border-b border-hairline`; selected underline `border-b-2 border-green-accent`.
- Accordion: rows `border-b border-black-alpha-10`. The height and chevron rotation stay animated.
- BackLink: classes only.
- After this step, `grep -rn "StyleSheet" src/components/ui src/app` should return nothing, except files where a comment explains why a style must stay in JS.

### 6. Clean up and document

- Remove `useGutter` and any `type` StyleSheet export that nothing imports any more. Keep `TypeVariant` and `ColorToken` types.
- Update `01-design-system.md` only with a one-line note at the top: "Styling engine replaced by NativeWind in 03-nativewind.md; tokens unchanged."
- Apply **AGENTS.md updates**.

## Verification

1. `npx tsc --noEmit`, `npx expo lint` and `npx expo-doctor` pass with no new problems.
2. Before step 1, screenshot `src/app/index.tsx` and a temporary `src/app/dev-design-system.tsx` gallery (every component in each variant and state, as in plan 01 Verification step 3) on web at 390 and 1024. After step 5, take the same screenshots again and compare them side by side. They should match, allowing 1px anti-aliasing differences.
3. On web, check by hand: Manrope renders; buttons scale on press; the TextField label floats; the Checkbox mark springs; the Accordion animates; DropdownMenu rows darken while pressed; the gutter is 16/24/40 at 390/800/1100 wide; there are no hydration warnings in the console with `web.output: "server"`.
4. iOS simulator or Android emulator if available: the same checks, and shadows visible on Card and FloatButton. If none is available, mark it ❌ with the reason.
5. Confirm a stock class doesn't apply: temporarily add `bg-blue-500` to a View and see no color, then remove it.
6. Delete the temp gallery route. End to end: the app starts cold (`npx expo start --clear`), opens on the neutralWarm canvas in Manrope, and looks identical to before.

## AGENTS.md updates

In `## Design system`, replace the first bullet ("Never hard-code…") and the spacing and responsive bullets with:

```md
- Style with NativeWind v4 `className` (Tailwind v3). The Tailwind theme replaces the stock scales with our tokens, so only design-system classes exist: colors `bg-green-accent`, `text-text-black`, `border-input-border`; spacing `p-3` (= 16, the default padding/gutter/gap); radius `rounded-card|field|pill|circle`; shadows `shadow-card|nav|float`. Raw values live once in `src/theme/tokens.js` (feeds `tailwind.config.js`); `@/theme` re-exports them typed for JS-only uses (Reanimated, `tintColor`, navigation theme). Missing value → add it to `tokens.js` first. No arbitrary `[...]` values.
- Never build class names dynamically (`` `bg-${c}` ``); map props to full class strings in static objects. Use `style` only for Reanimated animated styles and safe-area insets.
- Fonts: `font-sans`, `font-sans-semibold`, `font-sans-bold`, `font-serif`, one family per weight. Never `font-bold`/`font-semibold` (they set `fontWeight`).
- Responsive layout uses breakpoint classes (`md:` 768, `lg:` 1024). Use `useWindowWidth()` only when JS needs the width; never `useWindowDimensions` (web SSR hydration).
- Third-party components need `cssInterop` (in `src/theme/interop.ts`) before they accept `className`.
```

Under `## Commands`, nothing changes. If the shadow fallback in step 1 is taken, add "shadows go on `style={{ boxShadow: shadow.x }}`" instead of the `shadow-*` classes.

## Result

Built as planned. All 17 components use `className`. Web screenshots at 390/800/1100 match the baseline pixel for pixel, apart from anti-aliasing and the FeatureBand note below. iOS (Expo Go, iPhone 16 Plus simulator) renders the gallery correctly. Deviations:
- The values file is `src/theme/values.js`, not `tokens.js`, because `tokens.js` next to `tokens.ts` made `./tokens` imports ambiguous.
- **Fonts:** NativeWind's native preset overrides the `sans`/`serif`/`mono` font keys (system font, Georgia). The families are therefore `font-manrope`, `font-manrope-semibold`, `font-manrope-bold` and `font-lora`.
- **Shadows:** the step 1 check failed on native. `shadow-card` rendered a ~2px shadow instead of ~6px, so the fallback was taken: shadows stay on `style={{ boxShadow: shadow.x }}` and the Tailwind theme has no `shadow-*` classes.
- **Reanimated:** `className` on `Animated.View`/`Animated.Text` works on web with `cssInterop` but not on native. PressScale puts its classes on an inner `View`. The TextField label and the Accordion panel keep their static values on `style` next to the animated ones. `interop.ts` only registers `SafeAreaView`.
- **Borders:** on native, `border-hairline` colors all four sides and draws faint lines even at width 0. One-sided borders use `border-b-hairline` etc.
- **Dark mode:** added `darkMode: 'class'`. With `media`, NativeWind throws because the app pins the color scheme (`userInterfaceStyle: light`).
- **Tokens:** added size tokens for existing values (`button` 48, `buttonSm` 36, `field` 56, `checkbox` 24, `media` 160, `modal` 500, `modalInsetTop` 88), `opacity` (`disabled` 0.4, `pressed` 0.6) and a `smallBold` type style (BackLink). No visual change.
- **Geometry on `style`:** TextField input padding (15/6, min 52) and the SelectField notch offsets (10/−11) stay on commented `style` objects. They're paired with the animated label and notch positions and have no token.
- **FeatureBand at ≥768:** it's now exactly 60/40 (`md:w-3/5` / `md:w-2/5`), matching plan 01 and native. Before, react-native-web rendered `flex: 3/2` as about 64/36.
- **Playwright:** added as a dev dependency (at your request) and used for the screenshot and interaction checks.
- **Known, pre-existing:** a `Modal` that is `open` on the first server render causes a hydration error on web. That was out of scope here.
