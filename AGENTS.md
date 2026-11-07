# Seed: Budget

This is an Expo/React Native mobile budgetting application.
Users can set an initial capital and add in their recurring income and expenses.
Users can also forecast to see the state of their budget over a chosen timeframe.
Prioritize mobile-first patterns, performance, and cross-platform compatibility.

This file is the project's main memory: It holds every decision that is still true.
Any plans in `prompts/` are history.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx playwright ...         # dev dependency: drive and screenshot the web build for verification
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Design system

Build all UI from the design system: tokens in `src/theme/` and components in `src/components/ui/` (`import { Button, ... } from '@/components/ui'`). It is based on the Café Verde reference in `assets/images/design-reference/`. Token table and component rules: `prompts/01-design-system.md`; styling engine: `prompts/03-nativewind.md`.

- Style with NativeWind v4 `className` (Tailwind v3). `tailwind.config.js` replaces the stock scales with our tokens, so only design-system classes exist: colors `bg-green-accent`, `text-text-black`, `border-input-border`, `bg-black-alpha-50`; spacing `p-3` (= `space[3]` = 16); radius `rounded-card|field|pill|circle`; sizes `min-h-button`, `size-float`, `max-w-content`. No arbitrary `[...]` values.
- Raw values live once in `src/theme/values.js` (feeds `tailwind.config.js`); `@/theme` re-exports them typed (`colors`, `space`, `shadow`, `duration`…) for JS-only uses: Reanimated, `tintColor`, `ActivityIndicator`, navigation theme, safe-area math. Missing value → add it to `values.js` first. Never hard-code a color, font, size, spacing, radius, shadow or duration.
- Never build class names dynamically (`` `bg-${c}` ``): map props to full class strings in static objects. Use `style` only for animated values, safe-area offsets and shadows (`style={{ boxShadow: shadow.card }}`; there are no `shadow-*` classes because NativeWind flattens multi-layer shadows on native).
- NativeWind doesn't style Reanimated views on native: put classes on a plain `View` inside/around the `Animated.*` component and keep only animated values on it. Other third-party components need `cssInterop` in `src/theme/interop.ts`.
- On native a border color class colors all four sides (faint lines appear): for one-sided borders use the side color too, `border-b border-b-hairline`.
- `Pressable` pressed states use `active:` classes (`active:bg-black-alpha-6`); button press scale stays in `PressScale`.
- Before building UI, check `src/components/ui/` for an existing component: Text, Screen, Icon, PressScale, Button, FloatButton, Card, Modal, TextField, SelectField, Stepper, Checkbox, Accordion, SubNav, BackLink, FeatureBand, DropdownMenu, HoldToUnlock, ChoiceChips, Badge, HintScrollView, DateField. Extend one before making a new one; new shared components go there too (one per kebab-case file, named export, added to `index.ts`).
- Form screens use the boxed style: `TextField`/`SelectField` with `labelPosition="above"` (uppercase label above a white box; TextField adds `prefix`, `optionalHint`, `inputSize="lg"`, `hideLabel`) and `DateField`. On photo or dark screens: `BackLink variant="circle"`, a `bg-black-alpha-50` scrim, and the CTA as `Button variant="inverse"`.
- `HintScrollView` (a ScrollView with the "Scroll for more" chip) for any scroll area whose overflow isn't obvious. On web, inputs carry `outline-none` (the box border shows focus).
- Light theme only (`userInterfaceStyle: "light"`, Tailwind `darkMode: 'class'`, no `dark:` classes). Screens use `Screen` (neutralWarm canvas, safe area, gutter, 720 max width; `transparent` for full-bleed photo screens like onboarding). Content goes in white `Card`s. Dark bands use `greenHouse` with `textWhite`/`textWhiteSoft`.
- All text goes through `Text` with a `variant` and `color` prop (its `className` is for layout only). Fonts are Manrope 400/600/700 and Lora 400, loaded at runtime by `useAppFonts` in the root layout, one family per weight: `font-manrope`, `font-manrope-semibold`, `font-manrope-bold`, `font-lora` (not `font-sans`/`font-serif`, which NativeWind's native preset overrides). Never `font-bold`/`fontWeight`. On phones the biggest heading is `heroLarge` (`display`/`jumbo` only at ≥768).
- Text color is `textBlack`/`textBlackSoft`, never pure black. `greenAccent` is for actions and links and never goes on `greenHouse`. `red` is for errors and destructive actions, always with a message.
- Every button is a pill that scales to 0.95 on press (`PressScale`), with no shadows. Use at most one `FloatButton` per screen.
- `p-3`/`gap-3` (16) is the default padding, phone gutter and gap. Make tap targets at least 44 (`min-h-tap-target` or `hitSlop`).
- Icons go through `Icon` (expo-symbols) with `{ ios, android, web }` names; shared ones are in `icons`.
- Responsive layout uses breakpoint classes (`md:` 768, `lg:` 1024; gutter `px-3 md:px-4 lg:px-6`). Use `useWindowWidth()` only when JS needs the width; never `useWindowDimensions` (web is server-rendered, so a width read during render causes hydration mismatches).
- For accessibility state use `aria-checked`/`aria-expanded`/`aria-selected`/`aria-disabled`, not `accessibilityState`, which react-native-web ignores.
- Animate with Reanimated and write shared values with `.set()` (the React Compiler lint rule rejects `.value =`).
- A timing animation that *is* a timer or progress (HoldToUnlock) sets `reduceMotion: ReduceMotion.Never`; Reanimated's default jumps to the end when the system reduce-motion setting is on.
- Bundled photos live in `assets/images/<feature>/` with a `CREDITS.md`. Import assets with the `@/assets/*` alias.

## App state

- App data lives in SQLite: `seed.db`, opened by `SQLiteProvider` in the root layout, migrated in `src/db/migrate.ts` by `PRAGMA user_version` (never edit a released step; add one and bump the version). Row types in `src/db/schema.ts`; queries are parameterized (`runAsync` with `?`), never `execAsync` with user input. Screens get the db from `useSQLiteContext()`.
- Web SQLite needs `wasm` in Metro `assetExts` and the COOP/COEP headers set by the `expo-router` plugin `headers` in `app.json` (they apply to the dev server too; `crossOriginIsolated` must be true).
- Money is integer cents, PHP (₱), parsed and formatted only by `src/lib/money.ts`. Dates are local `YYYY-MM-DD` strings via `src/lib/dates.ts` (never `toISOString()`, which is UTC).
- Small device-local flags go through a wrapper in `src/lib/`: `expo-sqlite/kv-store` sync API on native, `localStorage` in a `.web.ts` twin. On web the hook returns `null` on the server and during hydration, and the root layout renders nothing until it's known.
- Feature-specific non-route code (draft state, shared screen chrome) lives in `src/features/<feature>/`.
- Onboarding is `src/app/onboarding/` (hold → fields → plough), shown on first launch only. The draft lives in memory until "Plant the seeds" saves it in one transaction, then `completeOnboarding()` sets the flag. Gating uses explicit `<Redirect>`s (`index` → `/onboarding` until onboarded; `onboarding/_layout` → `/` once onboarded), not `Stack.Protected`: in SDK 58 a guard flip doesn't move off a nested screen, and a manual `replace` on top of it loops. To see onboarding again, clear the flag (web: clear site data; iOS sim: delete the `onboarded` row in Expo Go's `ExpoSQLiteStorage`) and delete `seed.db`.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## How we build features

For new features or change across several files.
Skip this for small questions or fixes.

1. **Understand** - Read the code involved. Open the earlier plans if this feature builds directly on it (pick by file name). Read the current docs pages for any API you will use, load matching skill if one exists (e.g. Expo skills). Don't write version specific APIs from memory.
2. **Ask** - If any decisions are unclear (scope, visible behavior, data shape, etc.), ASK.
3. **Plan** - Copy `prompts/TEMPLATE.MD` to `prompts/NN-feature-name.md` (next number) and fill it in. The plan must be self contained, so a fresh session can build it from this file plus the plan alone.
4. **IMPORTANT: STOP AND WAIT** - Do not write any code until the user approves the plan.
5. **Build** - Step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning it.
6. **Close out**

- Run the plan's verification and give the report described under Reporting.
- Add a short `## Result` to the plan and set `Status: done`.
- Update this file: put each lasting decisions in the section it belongs to. Replace or remove rules that are no longer true instead of appending. Keep this file under 150 lines.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as keys, dashboard settings, or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start, ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.
