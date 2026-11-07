# 05 · Home landing page

Status: done

## Goal

After onboarding, the app opens a Home tab. Its photo hero shows what's left this month, a stat tile for "Spent" and one for "Bills / mo", and a pixel-art plant that grows with what's left. Below the hero, "Where it's going" breaks this month down by expense category, and "Recent entries" lists the latest entries. A bottom tab bar switches between Home, Categories and Forecast. Categories and Forecast are placeholders for now. Buttons and links are drawn but do nothing yet.

Reference: the user's mockup (Nov 2026) — photo hero with "Seed: Budget" lockup + month, "Income this month ₱0.00", Spent / Bills·mo tiles, pixel mound bottom-right, white "+ Add an entry" pill; then "Where it's going" / "Edit categories" card with Needs/Wants/Culture/Unexpected bars and the footnote; then "Recent entries" with the empty state; tab bar Home / Categories / Forecast.

## Decisions

### Answers from the user

- **Hero number = net.** "Income this month" = (income entries this month + income bills per month) − (expense entries this month + expense bills per month). It can go negative ("−₱1,200.00").
- **Growth = share of income kept.** `kept = net ÷ gross income`. The stage comes only from that ratio.
- **Tab bar = NativeTabs** (`expo-router/native-tabs`, SDK 58 import path), tinted with `greenAccent`. On web there's no system tab bar, so a `.web.tsx` twin uses headless tabs from `expo-router/ui`, styled like the mockup (white bar, hairline top border, green active icon and label).

### Defaults picked (veto any of these)

- **The starting budget is not income.** Onboarding saves it as an income transaction with the note `STARTING_BUDGET_NOTE` ("Starting budget"). The monthly totals leave out that one row (`note IS NOT ?` with that constant). Otherwise the month you onboard would always show a big tree. It still shows under Recent entries.
- **Growth stages** (`kept` = net ÷ gross):

  | Stage | When |
  |---|---|
  | 0 · Mound | net ≤ 0, or gross = 0 |
  | 1 · Sprout | 0 < kept < 10% |
  | 2 · Seedling | 10% ≤ kept < 25% |
  | 3 · Sapling | 25% ≤ kept < 50% |
  | 4 · Tree | kept ≥ 50% |

- **Per month.** Each bill counts at its monthly equivalent, matching the card footnote "Recurring bills and entries are counted per month."

  | Frequency | Per month |
  |---|---|
  | daily | × 365 / 12 |
  | weekly | × 52 / 12 |
  | biweekly | × 26 / 12 |
  | semimonthly | × 2 |
  | monthly | × 1 |
  | bimonthly | ÷ 2 |
  | quarterly | ÷ 3 |
  | semiannually | ÷ 6 |
  | yearly | ÷ 12 |
  | once | its full amount, only if `next_due_date` falls in this month |

  Each bill is rounded to whole cents with `Math.round` before summing.
- **Month** is the local calendar month of today. The `[start, end]` YYYY-MM-DD bounds come from new helpers in `src/lib/dates.ts`, and the label "NOVEMBER 2026" comes from `formatMonthYear`. Entries match with `date BETWEEN ? AND ?`.
- **Stat tiles.** "Spent" = expense entries this month. "Bills / mo" = expense bills per month. Income bills only feed the hero number and gross income.
- **Where it's going.** Expense categories only, in `sort_order`. Each row shows the name (`bodyStrong`), the description (`small` textBlackSoft, one line, truncated) and the amount (`small` textBlackSoft, right) = entries this month + bills per month. The bar is that amount's share of all expense this month. Every bar is empty when the total is 0. Track `bg-ceramic rounded-pill`, fill `bg-green-accent`, height from a new size token `progressBar: 6`. The fill width is a percentage `style` (a computed layout value, not a class).
- **Recent entries.** The latest 5 transactions (`ORDER BY date DESC, id DESC`), all kinds, in one Card separated by whitespace. Each row shows the category name (`bodyStrong`), then the note or nothing plus a `formatShortDate` date (`small` textBlackSoft), and the amount on the right: "+₱…" for income, "−₱…" for expense, both in `bodyStrong` textBlack (no green: greenAccent is for actions). With no entries, the empty state copy from the mockup shows: "Nothing planted yet. Add your first expense or income to see it here."
- **Refresh.** Home reloads its data in `useFocusEffect`, so entries added by later features show up when you come back to the tab.
- **Hero photo.** `assets/images/onboarding/03-seedling.jpg` (already bundled and credited) under a `bg-black-alpha-50` scrim, full-bleed and extending under the status bar (`StatusBar style="light"`).
- **No-op controls.** "Add an entry" (`Button variant="inverse" fullWidth icon={icons.plus}`) and "Edit categories" (a `Pressable` with `bodyStrong` greenAccent text, `hitSlop` to 44, `active:opacity-pressed`) get no `onPress`. They're visible and pressable with no effect.
- **Pixel plant** (`GrowthAvatar`). A `react-native-svg` grid where each sprite is an array of strings (one character per pixel, `.` = empty) mapped to a small palette. Every stage shares the same mound base, so the plant grows out of it. `shapeRendering="crispEdges"`. Sprite size 32 × 20 pixels at 3 units per pixel = 96 × 60 (new size token `growthAvatar`). Each stage has an `accessibilityLabel`, e.g. "Your seed is a sapling: you kept 30% of this month's income". Static, no animation.
- **Palette tokens.** The pixel colors are new `pixel` entries in `values.js`. They're JS-only (exported from `@/theme`, not added to Tailwind) because the sprite needs raw values: soil dark, soil, soil light, stem, leaf dark, leaf, leaf light, trunk. They're picked to sit on the dark scrim, like the mockup's grey/green tones.
- **Brand lockup.** The "Seed: Budget" mark + text in onboarding's hold screen is repeated here, so it moves into a shared `BrandLockup` UI component (`src/components/ui/brand-lockup.tsx`), and the hold screen uses it.

### Routing

```
src/app/
  _layout.tsx            Stack: onboarding, (tabs)   (index screen removed)
  (tabs)/_layout.tsx     redirect → /onboarding until onboarded; renders <AppTabs />
  (tabs)/index.tsx       Home
  (tabs)/categories.tsx  placeholder
  (tabs)/forecast.tsx    placeholder
src/features/tabs/app-tabs.tsx      NativeTabs (iOS/Android)
src/features/tabs/app-tabs.web.tsx  headless expo-router/ui tabs
```

- The onboarding redirect moves from `index.tsx` to `(tabs)/_layout.tsx`. `onboarding/_layout`'s `<Redirect href="/" />` still resolves, because `(tabs)/index` is `/`. Root: `<Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />`.
- Tab icons (`sf` / `md`):
  - Home: `house` / `house.fill`, `home`
  - Categories: `square.grid.2x2` / `.fill`, `grid_view`
  - Forecast: `chart.line.uptrend.xyaxis`, `show_chart`

  `labelStyle` uses Manrope SemiBold, `tintColor` and the selected color are `greenAccent`, and the unselected color is `textBlackSoft`. On iOS 26 the Liquid Glass bar ignores the background color, which is expected. The web twin reuses `Icon` with `{ ios, android, web }` names (added to `icons`).
- Placeholders use `Screen` with an `h1` title and a `Card` saying "Coming soon."

### Screen layout

Home is a single `ScrollView`. **Extend `Screen`** with an optional `header?: ReactNode` prop, rendered full-bleed above the centered column inside the scroll view. The hero goes there.
- The hero's inner column uses the same classes as Screen's column (`w-full max-w-content self-center px-3 md:px-4 lg:px-6`).
- Its top padding is `insets.top + space[3]`, a safe-area offset in `style`.
- Home uses `edges={[]}` so the photo runs under the status bar.

**Risk to check on iOS:** NativeTabs turns on automatic content insets for the first ScrollView, which may push the hero below the status bar. If it does, set `disableAutomaticContentInsets` on the Home trigger and add bottom padding for the tab bar by hand. Stop and report if neither works.

### Code layout

- `src/db/home.ts`: `loadHomeData(db, monthStart, monthEnd)`. Parameterized `getAllAsync` queries return the raw rows it needs:
  - expense categories
  - every bill joined to its category's kind
  - per-category entry sums for the month, excluding the starting-budget row
  - the latest 5 entries joined to their category name and kind
- `src/features/home/summary.ts`: pure functions with no db, including `monthlyCents(bill, monthStart, monthEnd)`.
  - `summarize(rows)` returns `{ netCents, grossIncomeCents, spentCents, billsMonthlyCents, categories: [{ id, name, description, cents, share }] }`.
  - `growthStage(net, gross)` returns `0..4`.
- `src/features/home/growth-avatar.tsx` holds the sprites and the `GrowthAvatar` component (feature-specific, not shared UI).
- `src/features/home/` also holds `hero.tsx`, `category-breakdown.tsx` and `recent-entries.tsx`. `(tabs)/index.tsx` loads the data and composes them.

## Out of scope

- Behaviour for "Add an entry", "Edit categories" and tapping a recent entry.
- Real Categories and Forecast screens.
- Animating the plant between stages.
- Picking a different month.
- Paging through more entries.

## Steps

### 1. Tokens, dates, money sign

- `values.js`: add `size.progressBar: 6`, `size.growthAvatar: { w: 96, h: 60 }` (or two flat keys `growthAvatarW`/`H` if Tailwind's size map needs flat numbers; check `tailwind.config.js`), and a `pixel` palette object exported through `@/theme` (typed) but not added to Tailwind.
- `src/lib/dates.ts`: add `monthBounds(date) → { start, end }` (YYYY-MM-DD) and `formatMonthYear(date)` ("November 2026"; the hero uppercases it via a text transform class or `toUpperCase()`).
- Done when typecheck and lint pass.

### 2. Routing and tabs

- Create `(tabs)/` with the layout, Home (temporarily the old placeholder content) and the two placeholders.
- Create `src/features/tabs/app-tabs.tsx` and `app-tabs.web.tsx`, add the icons to `icons`, update the root layout, and delete `src/app/index.tsx`.
- Done when, on web, a fresh user still lands in onboarding, finishing onboarding lands on Home with the tab bar, and all three tabs switch.

### 3. Data and summary

- Write `src/db/home.ts` and `src/features/home/summary.ts` as described.
- Check the summary math with a throwaway `bun -e` script in the scratchpad (not committed) that imports `summary.ts` and asserts:
  - weekly ₱100 → ₱433.33/mo
  - "once" in and out of the month
  - stages at 0%, 5%, 10%, 30%, 60% and at net < 0

### 4. Growth avatar

- Draw the five sprites and build `GrowthAvatar({ stage, keptPercent })`.
- To check them visually, temporarily render all five on the Home placeholder, screenshot at 3× on web with Playwright, then remove them.

### 5. Home UI

- Extract `BrandLockup` and use it in the onboarding hold screen.
- Add `header` to `Screen`.
- Build the hero, the category breakdown and recent entries, and wire them in `(tabs)/index.tsx` with `useSQLiteContext` + `useFocusEffect`.
- Match the mockup at 390 wide.

### 6. Close out

Lint, typecheck, verification, the `## Result` section, and the AGENTS.md updates.

## Verification

1. `bunx expo lint` and `bunx tsc --noEmit` pass.
2. Web (Playwright, 390 × 844, fresh site data):
   1. Complete onboarding with no starting budget and no bills. Home shows ₱0.00, both tiles at ₱0.00, the mound, empty bars and the empty "Recent entries". Screenshot it and compare with the mockup.
   2. Fresh again: set a starting budget of ₱15,000 and add a monthly "Rent" bill of ₱8,000 under Needs.
      - Home shows −₱8,000.00, Bills / mo ₱8,000.00 and the mound.
      - Needs shows a full bar with ₱8,000.00.
      - "Starting budget" shows under Recent entries as +₱15,000.00.
   3. Fresh again: add a monthly ₱20,000 bill under Income and a monthly ₱8,000 Rent bill. Net is ₱12,000, kept = 60%, so it shows the Tree.
   4. Tabs: Categories and Forecast show placeholders, and Home comes back with the same data.
   5. Pressing "Add an entry" and "Edit categories" does nothing and throws no errors (check the console).
   6. At 1024 wide, the content is centered at 720 and the hero photo still runs full width.
3. iOS (Expo Go or a dev build), if a simulator is available: the hero sits under the status bar, the native tab bar is tinted green, and the last card scrolls clear of the tab bar. Otherwise report it as ❌ not checked.

## AGENTS.md updates

- **Navigation & Routing.** The app's main screens are tabs in `src/app/(tabs)/`, using `NativeTabs` from `expo-router/native-tabs` via `src/features/tabs/app-tabs.tsx`, with a `.web.tsx` twin built on headless `expo-router/ui` tabs styled like the mockup. A new tab needs a trigger in both files.
- **App state.** The onboarding gate's `index → /onboarding` redirect now lives in `(tabs)/_layout.tsx` (it replaces the "`index` → `/onboarding`" wording). Monthly totals:
  - count bills at their monthly equivalent (`src/features/home/summary.ts`, `monthlyCents`)
  - leave out the `STARTING_BUDGET_NOTE` transaction
  - the hero number is net (income − expenses)
  - the plant's stage is net ÷ gross income
- **Design system.** Add `BrandLockup` to the component list. `Screen` gains a `header` prop for full-bleed heroes.

## Result

Built as planned. Home: photo hero (net this month, Spent and Bills / mo tiles, pixel `GrowthAvatar`, no-op "Add an entry"), "Where it's going" for expense categories (no-op "Edit categories"), and the latest 5 entries. Tabs: NativeTabs on native, a headless `expo-router/ui` bar on web; Categories and Forecast are placeholders.

Deviations and findings:
- `shapeRendering` isn't in react-native-svg's types, so it was dropped. The sprites stay crisp because every rect sits on whole pixels (3 per sprite pixel).
- Web: `TabSlot` defaults to `flexShrink: 0`, so a tall Home grew the page and pushed the tab bar off-screen. `TabSlot` is now registered in `interop.ts` and gets `flex-1`. Its `TabTrigger` style also forced a row layout, so the tab button lays out on an inner View.
- The tab list lives in `src/features/tabs/tabs.ts`, shared by both bars.
- Negative amounts use Intl's hyphen ("-₱8,000.00"), not "−".
- Not verified: Home on iOS/Android (the simulator wasn't onboarded and can't be driven with a press-and-hold), including the iOS automatic-content-inset risk.
- Web tab bar spans the full width at ≥768; the tabs aren't capped to 720.
