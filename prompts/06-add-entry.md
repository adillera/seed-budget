# 06 · Add an entry

Status: done

## Goal

Pressing "Add an entry" on Home opens a bottom sheet where the user logs an expense or income: amount, category, optional note, how often it repeats, and a date. Saving closes the sheet. Home then shows the new numbers, and the entry appears under Recent entries.

Reference: the user's mockup (Nov 2026, web at 390 wide):
- Home stays visible and dimmed behind a white sheet with a grabber.
- "Add an entry" `h1` (greenBrand), with a round ✕ close button on a `ceramic` circle.
- Two equal-width pills, "Expense" (filled when selected) and "Income" (outlined).
- AMOUNT is a big boxed "₱ 0.00".
- CATEGORY (select) and NOTE ("e.g. Groceries") sit side by side.
- REPEATS select, defaulting to "One-time".
- DATE defaults to today.
- A full-width primary "Save expense" / "Save income" button.

## Decisions

### Answers from the user

- **One-time saves an entry. Anything else saves a bill.**
  - One-time inserts a `transactions` row: date = the chosen date, note = the note, or NULL if blank.
  - Any other Repeats value inserts a `bills` row: `next_due_date` = the chosen date, `name` = the note or NULL, `frequency` = the choice.
  - No transaction is logged for a bill, so Home doesn't count it twice.
  - The `once` bill frequency isn't offered here. "One-time" means an entry.
- **Bills show in Recent entries.** The list merges the latest transactions and bills: 5 rows in all.
  - Transactions sort by `date`; bills sort by `created_at`'s local date.
  - A bill row shows the category name, then the name (if any) · the frequency label (e.g. "Monthly") · "next Dec 5, 2026".
  - The amount uses the same +/− sign as a transaction.
  - The starting-budget row still shows. Onboarding bills show too.

### Defaults picked (veto any of these)

- **Presentation is a route**, `src/app/add-entry.tsx`, on the root Stack:
  - Native: `presentation: 'formSheet'`, `sheetGrabberVisible: true`, `sheetAllowedDetents: 'fitToContents'` (if 'fitToContents' isn't in SDK 58's types, use `[0.85]`), `headerShown: false`, and a white `contentStyle`.
  - Web: Expo Router renders form sheets as plain routes on web (docs: router/advanced/web-modals), so use `Platform.select({ web: 'transparentModal' })` with `animation: 'none'`. A `.web.tsx` twin draws the sheet.
  - The `(tabs)` route is the stack's anchor (`unstable_settings = { anchor: '(tabs)' }`), so a deep link to `/add-entry` still has Home under it.
- **Sheet chrome**: `src/features/entry/sheet-frame.tsx` (native) and `sheet-frame.web.tsx`.
  - Native returns its children in a padded white column. The system draws the grabber.
  - Web:
    - a `bg-black-alpha-50` scrim that closes on press
    - a white panel pinned to the bottom with top corners `rounded-t-card`, capped at `max-w-content` and centered
    - a grabber bar: new size token `grabber: { w: 40, h: 4 }` → `w-grabber h-grabber`, `bg-input-border`, `rounded-pill`
    - Escape closes the sheet
  - Close = `router.back()` when `router.canGoBack()`, else `router.replace('/')`.
- **Header**: the title as `Text variant="h1"` (greenBrand by default), then the close button: `size-tap-target rounded-circle bg-ceramic active:bg-black-alpha-6`, `icons.close`, `accessibilityLabel="Close"`.
- **Kind toggle**: extend `ChoiceChips` with `layout?: 'inline' | 'stretch'`.
  - `stretch` hides the visible label (it stays the a11y label) and gives each option `flex-1 min-h-button`.
  - It defaults to Expense.
  - Switching kind resets the category to the first category of that kind (in `sort_order`) and changes the CTA label.
- **Fields** (boxed `labelPosition="above"` style):
  - AMOUNT: `TextField prefix="₱" inputSize="lg" placeholder="0.00" keyboardType="decimal-pad"`, focused on open.
  - CATEGORY: `SelectField` with that kind's categories.
  - NOTE: `TextField placeholder="e.g. Groceries"`, max 60 characters, trimmed.
  - CATEGORY and NOTE share a row (`flex-row gap-3`, each `flex-1`) at every width, as in the mockup.
  - REPEATS: `SelectField` with `FREQUENCY_OPTIONS`. The options move from `features/onboarding/draft.tsx` to `src/lib/frequency.ts`, together with `frequencyLabel`, and onboarding imports them from there.
  - DATE: `DateField`, default today, any date allowed (past or future).
- **Validation**: on Save, `parseMoney` must return a value > 0. Otherwise the amount shows `state="invalid"` with the message "Enter an amount above ₱0.00" and nothing saves. The message clears on the next edit.
  - If the chosen kind has no categories, the select shows "No income categories yet". The CTA is disabled, and the hint "Add one in Categories" appears.
- **Saving**: the CTA shows `loading` while it saves, and a second press is ignored.
  - On success the sheet closes, and Home's `useFocusEffect` reloads.
  - On error, a red message "Couldn't save. Try again." shows above the CTA and the sheet stays open. The error is logged.
- **Keyboard**: the form is a `ScrollView` with `keyboardShouldPersistTaps="handled"` and `automaticallyAdjustKeyboardInsets`, so the CTA stays reachable.
- **Hero button**: "Add an entry" gets `onPress={() => router.push('/add-entry')}`.

### Code layout

- `src/db/entries.ts`: `addEntry(db, input)`, where `input = { categoryId, amountCents, note, frequency: 'once' | Exclude<BillFrequency,'once'>, date }`. It runs one parameterized `runAsync` insert into `transactions` or `bills`. It also has `loadEntryCategories(db)`.
- `src/db/home.ts`: `recent` becomes a union `RecentEntry = { type: 'entry', … } | { type: 'bill', frequency, next_due_date, … }`. It's loaded with two `LIMIT 5` queries (transactions; bills ordered by `created_at DESC, id DESC`), merged by sort date in JS, and cut to 5. A bill's sort date = `date(created_at, 'localtime')`. Keys are prefixed (`e-1`, `b-1`).
- `src/features/home/recent-entries.tsx` renders both shapes.
- `src/features/entry/`: `entry-form.tsx` (state, validation, save) and the `sheet-frame` twins.
- `src/app/add-entry.tsx` composes `SheetFrame` + `EntryForm`.

## Out of scope

- Editing or deleting entries and bills (tapping a row in Recent entries still does nothing).
- Creating categories from the sheet.
- Auto-logging bills as transactions when they come due.
- Sheet drag-to-dismiss on web (the scrim, ✕ and Escape close it).

## Steps

### 1. Shared bits

- Move `FREQUENCY_OPTIONS`/`frequencyLabel` to `src/lib/frequency.ts` and update the onboarding imports.
- Add the `grabber` size token to `values.js` (check how `tailwind.config.js` maps nested sizes; use flat `grabberW`/`grabberH` if needed).
- Add `layout="stretch"` to `ChoiceChips`.
- Done when lint and typecheck pass and onboarding's bill picker still works.

### 2. Data

- Write `src/db/entries.ts` and extend `loadHomeData`'s recent query and type as described.
- Update `RecentEntries` for bill rows.
- Done when Home on web still renders, and onboarding bills now appear under Recent entries.

### 3. Route and sheet

- Add `add-entry` to the root Stack with the options above and the `(tabs)` anchor.
- Build the `SheetFrame` twins and a placeholder body.
- Wire the hero button.
- Done when, on web, the sheet opens over a dimmed Home, and the ✕, the scrim and Escape all close it.

### 4. Form

- Build `EntryForm` per the decisions and match the mockup at 390 wide.
- Done when saving an expense, an income and a monthly bill each update Home.

### 5. Close out

Lint, typecheck, the verification below, `## Result`, and the AGENTS.md updates.

## Verification

1. `bunx expo lint` and `bunx tsc --noEmit` pass.
2. Web (Playwright, 390 × 844, fresh site data, onboard with Needs/Wants + Income categories and no bills):
   1. Tap "Add an entry". The sheet matches the mockup: Expense selected, category Needs, One-time, today's date. Take a screenshot.
   2. Save with an empty amount. The red message shows and nothing is saved.
   3. Save ₱250 Expense, Needs, note "Groceries", One-time. The sheet closes. Spent shows ₱250.00, the hero shows −₱250.00, the Needs bar is full, and Recent entries shows "Needs · Groceries · Nov 8, 2026 −₱250.00".
   4. Switch to Income: the category changes to the first income category and the CTA reads "Save income". Save ₱20,000. The hero goes up and the plant grows.
   5. Add ₱8,000 Expense, Needs, Monthly, note "Rent". Bills / mo shows ₱8,000.00, Spent is unchanged, and Recent entries shows "Rent · Monthly · next …".
   6. The ✕, the scrim and Escape close the sheet without saving.
   7. At 1024 wide, the sheet is capped at 720 and centered.
3. iOS (simulator, if one is available and onboarded): the form sheet opens with a grabber, the keyboard doesn't cover the CTA, saving closes it and Home refreshes. Otherwise report it as ❌ not checked.

## AGENTS.md updates

- **Navigation & Routing**: sheets are root-Stack routes. On native they use `formSheet`. On web they use `transparentModal` + `animation: 'none'`, with chrome from the `SheetFrame` web twin in `src/features/entry/` (it moves to `components/ui` if a second sheet needs it). The root Stack anchors on `(tabs)`.
- **App state**: "Add an entry" with One-time writes a transaction, and any other Repeats value writes a bill (next due = the date, name = the note). Recent entries merges transactions and bills (bills by local created date), 5 in all. Frequency labels live in `src/lib/frequency.ts`.
- **Design system**: `ChoiceChips` gains `layout="stretch"` (equal-width, label visually hidden).

## Result

Built as planned. "Add an entry" opens the `add-entry` sheet route: a native form sheet on iOS/Android, a transparent-modal overlay drawn by `SheetFrame`'s web twin. One-time saves a transaction, anything else saves a bill. Home's Recent entries merges both.

Deviations and findings:
- The native sheet uses `sheetAllowedDetents: 'fitToContents'` with a plain column, not a ScrollView. A flex ScrollView inside a fit-to-contents sheet has no height to measure, and the system sheet already avoids the keyboard. Only the web panel scrolls (`shrink` panel, `grow-0` ScrollView).
- The sheet header (title + round ✕) and `closeSheet()` live in `src/features/entry/sheet-header.tsx`, shared by both frames.
- Web: the root Stack's `neutralWarm` `contentStyle` painted over the screen below, so the web `add-entry` options set `contentStyle` to transparent.
- Web: a focused TextInput kept the Escape key, so the listener uses the capture phase.
- `PressScale` puts `className` on its inner scaling view, so stretch chips get `flex-1` through `containerClassName`.
- The boxed `SelectField` (`labelPosition="above"`) now has the same geometry as `TextField` (border, `p-px`, a `py-3` row). The two were 4px apart in height side by side.
- The grabber size tokens are flat (`grabberWidth`/`grabberHeight` → `w-grabber-width h-grabber-height`), like `growthAvatar*`.
- Not verified: iOS/Android (no onboarded simulator), including the form sheet sizing, the grabber and the keyboard.
