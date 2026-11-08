# 11 · Forecast tab

Status: done

## Goal

The Forecast tab (fourth in the bar, today a placeholder) shows the user's balance from day one to a date they pick. It shows the totals coming in and going out, the balance on the end date, and a balance-over-time chart. Tapping or dragging on the chart shows the date and balance of the nearest node.

Reference: the user's mockup (Nov 2026, web at 390 wide):
- Leafy photo hero under a scrim: white "Forecast" (`heroLarge`) and "See where your money lands, day by day." (`textWhiteSoft`).
- Card "Date range" (`h2`, greenBrand like the other card titles): FROM (locked, a grey `ceramic` box) and TO (a normal DateField) side by side, then a `ceramic` note: "The forecast always starts on the day you planted your **₱0.00** starting budget (today). Pick how far ahead to look with the To date." The amount is in greenAccent bold.
- Card "Summary" with "31 days" (`small`, soft) on the right. Two `ceramic` tiles, "Coming in +₱0.00" and "Going out −₱0.00". Below them a `greenLight` tile: "IN THE GREEN" (`smallBold`, greenBrand), "Balance on Dec 8, 2026" (`small`), and the balance on the right (`h1`-size, greenBrand).
- Card "Balance over time" with a hairline under the title, then the chart.
- The "Scroll for more" chip while content is hidden.

## Decisions

### Answers from the user

- **The chart plots the running balance**: starting budget + all income − all expenses up to each node. A dashed zero line marks where it would go negative.
- **Green / red**: a node with a balance ≥ 0 is green (`greenAccent`), below 0 is red (`red`). The line is also drawn red below the zero line.
- **Granularity**: one node per day when the range is 3 months or less (To ≤ day one + 3 months). For longer ranges, one node per month.
- **Day one is locked**: the forecast starts at the first entry (the starting budget, or the earliest entry if one is dated before it). The From field can't be edited.
- **Node picking** (left to me): tap or drag anywhere on the chart and the nearest node is selected. A readout above the chart shows its date and balance. The whole range always fits the card width, so 1, 2, 3 months and monthly views all behave the same and there's no sideways scrolling.

### Defaults picked (veto any of these)

- **Day one** = `MIN(date)` over all transactions, capped at today (an entry dated in the future doesn't move day one forward). With no transactions at all, day one is today.
- **Hint copy** under the dates:
  - If the starting budget row's date is day one: "The forecast always starts on the day you planted your **₱X** starting budget (today | Nov 8, 2026). Pick how far ahead to look with the To date."
  - If an earlier entry exists: "The forecast starts on your first entry (Oct 2, 2026). Pick how far ahead to look with the To date."
  - With no entries: "The forecast starts today. Pick how far ahead to look with the To date."
- **To date**: defaults to today + 1 month (clamped to month end). The minimum is day one + 1 day and the maximum is today + 10 years. It's kept in screen state for the session, not saved, and it resets when the app restarts.
- **What counts**: every transaction from day one to To (past entries included), plus each bill's occurrences from its `next_due_date` to To (`occurrencesBetween`, after `postDueBills`, so nothing counts twice; the same rule Home uses).
- **Coming in / Going out** = income / expense in the range, **without the starting budget** (it's capital, as on Home; it's matched by `note IS NOT STARTING_BUDGET_NOTE`, Home's convention). Balance = starting budget + coming in − going out.
- **Days** = inclusive count (Nov 8 → Dec 8 = "31 days"; "1 day" singular).
- **Balance tile**: ≥ 0 → `greenLight` fill, "IN THE GREEN" (greenBrand) and an amount in greenBrand. Below 0 → `invalidTint` fill, "IN THE RED" in `red` and an amount in `red`, with the "Balance on …" line serving as its message.
- **Monthly nodes** sit at each month's last day. The final node is the To date itself, even mid-month. The readout says "November 2026" for a full month node and "Dec 8, 2026" for the final To node. Daily nodes say "Dec 8, 2026".
- **Readout**: before any touch it shows the last node (the To date) so it's never empty. Format: date (`small`, soft) above the balance (`h2`, green or red).
- **Chart drawing** (react-native-svg, already installed; Hold-to-unlock and GrowthAvatar use it): about 180 tall. Width comes from `onLayout` (never `useWindowDimensions`). The Y range always includes 0 with a little padding. The line is 2px `greenAccent`, drawn a second time in `red` and clipped to below the zero line (`ClipPath`). The zero line is dashed `inputBorder`. The selected node gets a vertical `hairline` guide and a larger dot. Dots for every node are drawn only when they are ≥ 8px apart; otherwise only the selected node's dot shows. Axis text: the max and min balance at the left (`small`, soft); the first and last date under the chart.
- **Touch**: the React Native responder system on the chart View (`onStartShouldSetResponder`, `onResponderGrant/Move` → `locationX` → nearest index). This needs no gesture-handler root (the app has no `GestureHandlerRootView`) and works on web. If the user starts a vertical swipe on the chart, the outer ScrollView takes over and the page scrolls.
- **Accessibility**: the chart is `accessibilityRole="adjustable"` with increment and decrement actions that step the selected node, and an `accessibilityLabel` like "Balance over time, 31 days, ends at ₱1,200.00". The readout is `accessibilityLiveRegion="polite"`.
- **Photo**: `assets/images/onboarding/02-breaking.jpg` (already credited; Home 03, Entries 04, Categories 05), through `PhotoHero`, with a light status bar while focused.
- **Reload on focus**, like Home: `postDueBills` → load → compute. Loading renders an empty `Screen`; an error shows Home's red message card.
- **Chart colors and marks** follow the `dataviz` skill (loaded before writing the chart), mapped onto our tokens. No new colors are added.

## Out of scope

- Saving the To date, preset range chips (1M / 3M / 1Y), changing From.
- Per-category breakdowns, income vs expense series, bar charts.
- Pinch zoom or a scrollable chart.
- Currency settings.

## Steps

### 1. Forecast data and math

- `src/db/forecast.ts`: `loadForecastData(db)` returns:
  - `firstDate: string | null`: `SELECT MIN(date) FROM transactions`.
  - `starting: { cents: number; date: string } | null`: the `STARTING_BUDGET_NOTE` row.
  - `dailySums: { date; incomeCents; expenseCents }[]`: transactions grouped by date, starting budget left out.
  - `bills`: the same shape as `HomeBill`: `category_id, kind, amount_cents, frequency, start_date, next_due_date`.

  All queries are parameterized.
- `src/features/forecast/forecast.ts` (pure, no React): `dayOne(data, today)`, `defaultTo(today)`, and `buildForecast(data, dayOne, to)`. `buildForecast` returns `{ days, granularity: 'day' | 'month', startingCents, incomeCents, expenseCents, endBalanceCents, points: { date, label, balanceCents }[] }`. It builds a per-date delta map from `dailySums` (only dates in [dayOne, to]) and from bill occurrences in [max(next_due_date, dayOne), to], then walks each day from dayOne to To. The starting budget is added on its date. Daily mode emits a point per day; monthly mode emits a point at each month end plus To. Dates use `src/lib/dates.ts` only. Add `daysBetweenInclusive` there if needed, and add `formatMonthYear` reuse for labels.
- Done when a scratch script (in the scratchpad, run with `bun`) checks these cases: no data; starting budget only; a monthly expense bill crossing zero; a 3-month range (daily, 92 points) vs a 3-month + 1-day range (monthly); and a past backdated entry moving day one.

### 2. DateField: locked and max date

- `src/components/ui/date-field.tsx` and `.web.tsx`: add `disabled?: boolean` and `maximumDate?: Date`.
- When disabled, the box is `bg-ceramic` with the date as soft text and no picker, matching the mockup's FROM. It is non-interactive and has `aria-disabled`.
- Pass `maximumDate` to the iOS/Android picker and set `max` on the web input.
- Done: lint and typecheck pass, and existing uses (add-entry, onboarding) are unchanged.

### 3. Forecast screen: hero, date range, summary

- `src/app/(tabs)/forecast.tsx` replaces the placeholder. It has `useFocusEffect` load, light status bar and loading/error states as on Home, and `Screen scroll edges={[]} header={<ForecastHero/>}`. The To date lives in `useState`, so changing it only re-runs `buildForecast` (`useMemo`), without hitting the db.
- `src/features/forecast/`: `forecast-hero.tsx`, `date-range-card.tsx` (two `DateField`s in a `flex-row gap-3`, each `flex-1`; the hint in a `rounded-field bg-ceramic p-3` box with the amount as nested `Text` in greenAccent semibold), and `summary-card.tsx` (the tiles and the balance tile described in Decisions).
- Done: web at 390 wide matches the mockup's first two cards.

### 4. Balance chart

- Load the `dataviz` skill first.
- `src/features/forecast/balance-chart.tsx`: the Card "Balance over time" with a `border-b border-b-hairline` under the title, the readout, the SVG chart and the axis labels, as described in Decisions. It handles selection state, the responder handlers and the accessibility actions. Pixel math (scales, nearest index) goes in small pure helpers in the same file. Any new size (chart height, dot radii) goes into `values.js` first.
- Done: tapping and dragging select nodes on web, and the colors flip at zero.

### 5. Close out

- Remove `placeholder-screen.tsx` if nothing else uses it.
- Run the verification below, update AGENTS.md, add `## Result`, set `Status: done`.

## Verification

- `npx expo lint`, `npx tsc --noEmit`.
- The scratch-script math cases from step 1.
- Playwright on web (390 wide), after fresh onboarding with a ₱10,000 starting budget, monthly ₱8,000 rent, and ₱3,000 biweekly income:
  1. Default range: From is locked to today, To is +1 month, "31 days", and the totals add up by hand.
  2. Set To to +3 months: daily nodes. Set it to +4 months: monthly nodes.
  3. Add rent large enough to go negative: the tile turns "IN THE RED", the line goes red below the dashed zero line, and nodes below zero are red.
  4. Tap the chart's left edge, middle and right edge: the readout shows the matching date and balance. Drag across it and the readout follows.
  5. Add an entry dated last month: From moves to that date and the hint switches to "first entry".
  6. Screenshots of each.
- On the iOS simulator if available: the From box is locked, the To picker opens, a tap on the chart selects a node, and a vertical swipe on the chart still scrolls the page.

## AGENTS.md updates

- App state: the Forecast rules (day one = earliest transaction, capped at today; balance = all transactions + bill occurrences from `next_due_date`; starting budget left out of in/out; daily ≤ 3 months, else monthly; math in `src/features/forecast/forecast.ts`).
- Design system: `DateField` gains `disabled` / `maximumDate`. Charts are react-native-svg sized by `onLayout`, and touch uses the responder system (no gesture-handler root).
- Navigation: drop "placeholder" mentions if any.

## Result

Built as planned. `src/db/forecast.ts` loads the rows. `src/features/forecast/forecast.ts` holds day one, the default and max To, and `buildForecast`. `src/features/forecast/` also holds the date range card, the summary card and the balance chart. `DateField` gained `disabled` (rendered by `date-field-locked.tsx`, shared by both twins) and `maximumDate`. `daysBetween` was added to `dates.ts` and `formatMoneyCompact` to `money.ts` (axis labels). Chart sizes were added to `values.js`. The placeholder screen was removed.

Changes from the plan: the readout shows its amount in `textBlack`, with a green "In the green" or red "Below zero" label beside it (the dataviz rule: text wears text tokens). Axis amounts are compact (₱10K) so the plot keeps its width.

Checked: the math cases in a scratch script, and on web at 390 × 844 the default range, 3-month daily, 4-month and 10-month monthly, going negative, tap and drag selection, and a backdated entry moving day one. Totals match hand counts.

Not checked: iOS and Android (no simulator was running), including the locked box on native, the To picker limits and vertical scrolling over the chart. On web at half width, the browser date input squeezes out the calendar icon in the To box, as in the mockup.
