# 04 · Onboarding setup: fields, starting budget and bills

Status: done

## Goal

After the hold-to-unlock screen, the user sets up their budget in two steps.

1. **"Let's tend the fields."** Review the starting categories: the four Kakeibo categories plus Income. Remove any of them or add their own.
2. **"Plough the field."** Enter a starting budget and the recurring bills.

"Plant the seeds" saves everything to an on-device SQLite database and finishes onboarding. Onboarding never shows again, and the app opens `index`, which stays a placeholder home (the home page is a later feature).

## Decisions

### Flow and routing

- **Routes.** `src/app/onboarding.tsx` becomes a folder:
  - `src/app/onboarding/_layout.tsx` is a `Stack` with `headerShown: false` and holds the draft provider.
  - `onboarding/index.tsx` is the hold screen, moved as is.
  - `onboarding/fields.tsx` is step 1 (screenshot 3).
  - `onboarding/plough.tsx` is step 2 (screenshots 1–2).

  The root `Stack.Protected guard={!onboarded}` keeps wrapping `name="onboarding"`, so it guards the whole folder.
- **Hold → fields.** `HoldToUnlock`'s `onComplete` no longer finishes onboarding. It calls `router.push('/onboarding/fields')`. `completeOnboarding()` now only runs after "Plant the seeds" saves.
- **Back.** The round back button on both steps calls `router.back()`. Fields goes back to the hold screen. The hold screen resets when it regains focus (`useFocusEffect`: `progress.set(0)` and a new `key` on `HoldToUnlock`, so its "completed" ref resets too).
- **Draft.** Nothing is written until "Plant the seeds". The draft (categories, starting amount, bills) lives in React state in an `OnboardingDraftProvider` in `onboarding/_layout.tsx`, shared by both steps. If the app is killed mid-flow, the next launch starts at the hold screen with the default categories again.
- **Completion.** "Plant the seeds" does three things:
  1. It shows `loading`.
  2. In one `withTransactionAsync`, it inserts the categories in order, the starting budget transaction (if more than 0) and the bills.
  3. It calls `completeOnboarding()`. The guard flips and the router opens `index` with its fade.

  If the save throws, the button stops loading and a red message shows above it: "Couldn't save your budget. Try again." Nothing is marked complete.

### Default categories (Kakeibo + Income)

| Name | Description | Type |
|---|---|---|
| Income | Salary, side work, allowances | income |
| Needs | Rent, food, bills, transport | expense |
| Wants | Eating out, shopping, hobbies | expense |
| Culture | Books, courses, music, museums | expense |
| Unexpected | Repairs, medical, gifts | expense |

### Fields step (screenshot 3)

- **Title and copy.** "Let's tend the fields." Body: "Let's start with the basics. We've already prepared the field for you. Keep it as it is, or change it to suit you."
- **"Your fields" card.**
  - Header: `h1` title, with "N categories" (`small`, textBlackSoft) on the right.
  - The list sits in a nested scroll area with max height `size.fieldList` (232), so about 3.5 rows show and the "Scroll for more" hint overlays its bottom.
  - Each row: `bg-neutral-warm rounded-card p-3`. Name in `bodyStrong`, description in `small` textBlackSoft, the type ("Income"/"Expense") in `small` textBlackSoft, and a remove ✕ (`Icon close`, 44 tap target, label "Remove {name}").
- **New category form** (in the same card):
  - "NEW CATEGORY" label with a TextField (placeholder "e.g. Groceries").
  - An "Add" `Button` (primary) on the same row, disabled while the name is empty.
  - A second TextField with no label (placeholder "Short description (optional)").
  - "TYPE" label with two `ChoiceChips`, **Expense** (default) and **Income**.
  - Add appends to the end of the list and clears the form.
  - Names are trimmed, at most 30 characters, and unique ignoring case. A duplicate shows the field as invalid with "You already have a field called {name}." Descriptions are at most 60 characters.
- **Remove** is immediate. The exception is a category that has draft bills (after going back from step 2): a `Modal` asks "Remove {name}?", explains "Its N bills will be removed too.", and offers a destructive "Remove" and an outline "Keep".
- **Rule.** At least one income and one expense category are needed. When that's missing, the card shows the message "Keep at least one Income and one Expense field." (`small`, red) and "Start ploughing the field" is disabled.
- **CTA.** "Start ploughing the field" pushes `/onboarding/plough`.

### Plough step (screenshots 1–2)

- **Title and copy.** "Plough the field." Body: "Start with what you have, then add the bills that keep coming back."
- **"Starting budget" card.**
  - Header: `h1`, with a `Badge` on the right showing the income category it's filed under. That's the first income category in list order.
  - An AMOUNT field: label above, `₱` prefix, placeholder "0.00", `inputSize="lg"` (`h2` text), `keyboardType="decimal-pad"`.
  - Helper text: "The money you have to plant right now. We'll file it under {category}."
  - Empty counts as ₱0.00, and nothing is saved for 0.
  - Invalid input (not a number, negative, more than 2 decimals) shows invalid with "Enter an amount like 1500 or 1500.50."
- **"Recurring bills" card.**
  - Header: `h1`, with "N bills" on the right.
  - Empty state: a `bg-neutral-warm rounded-card p-3` box with "No bills yet. Add rent, electricity, water or anything else that repeats." (`body`, textBlackSoft).
  - Each added bill is a row in the same style as the category rows:
    - Title: the bill name, or the category name if the bill has no name.
    - Detail line: "₱1,200.00 · Monthly · Next Dec 5, 2026".
    - A remove ✕.
- **Bill form** (in the same card, below the list):
  - CATEGORY: a `SelectField` with the label above, listing expense categories only. It defaults to the first one.
  - BILL NAME (optional): placeholder "e.g. Electricity, rent, water", at most 40 characters.
  - AMOUNT: `₱` prefix, required, more than 0.
  - HOW OFTEN: a `SelectField` with Weekly, Every 2 weeks, Monthly (default) and Yearly.
  - NEXT DUE DATE: a `DateField` that defaults to today and allows nothing before today.
  - "Add bill" (`Button` outline, full width) is disabled until the amount is valid. Pressing it appends the bill and resets name, amount and date (category and how often stay).
- **CTA.** "Plant the seeds" (see Completion).

### Shared screen chrome (both steps)

- **Background.** The photo is `assets/images/onboarding/05-field.jpg`: Unsplash `photo-1560493676-04071c5f467b`, "rows of green crops in field at sunset" by Dan Meyers, 1080×2340 at q70 with a center crop. A `bg-black-alpha-50` scrim sits on top. It gets added to `CREDITS.md`.
- **Layout.** `Screen transparent edges={['top','bottom']}`:
  - The back button at top left.
  - The title (`heroLarge` textWhite) and body (`bodyLarge` textWhiteSoft).
  - A `ScrollView` (flex 1) with the cards (`gap-3`), clipped above the CTA.
  - The fixed CTA: `Button variant="inverse" fullWidth`, with `pt-3 pb-3`.

  The inverse button is the right one on a dark photo scrim, the same as on greenHouse.
- **Back button.** `BackLink` gets `variant="circle"`: a `size-tap-target rounded-circle bg-white-alpha-30` circle with a white chevron and accessibility label "Back". The existing look stays as `variant="link"`.
- **Scroll hint.** A new `ScrollHint` component: a `bg-green-house rounded-pill` chip with a chevron-down icon and "Scroll for more" (`smallStrong` textWhite), centered over the bottom of a scroll area.
  - It shows while content overflows and the user hasn't scrolled yet.
  - It fades out (`duration.button`) on the first scroll of 16 or more, or when the end is in view. Screenshot 2 is the same view after that.
  - Tapping it scrolls down by 80% of the viewport.
  - It's used on the page scroll in Plough and on the field list in Fields.
- **Keyboard.**
  - iOS: the page `ScrollView` uses `automaticallyAdjustKeyboardInsets` and `keyboardShouldPersistTaps="handled"`.
  - Android: the default `softwareKeyboardLayoutMode: resize` shrinks the view.
  - No keyboard library (react-native-keyboard-controller isn't in Expo Go).

### Components (extend before adding, per AGENTS.md)

- **`TextField`.** New props:
  - `labelPosition?: 'floating' | 'above'` (default `floating`, today's behavior).
  - `optionalHint?: string`, which renders e.g. "(optional)" after an above-label in `micro`, not uppercase.
  - `prefix?: string` (e.g. "₱"), drawn inside the input on the left in the input's text style, textBlackSoft.
  - `inputSize?: 'md' | 'lg'` (`lg` = `h2` text for amounts).
  - `placeholder` (allowed only with `above`).
  - `hideLabel?: boolean`, which keeps the label for accessibility only.

  The above layout: the label in `fieldLabel`, a `gap-1`, then a box with `min-h-field`, a 1px inputBorder, `rounded-field`, white fill and `px-3`. Focus, valid and invalid states work the same as now.
- **`SelectField`.** New `labelPosition?: 'notch' | 'above'` (default `notch`). Above uses the same label and box as TextField's, with the value left-aligned and the chevron on the right. Picking still opens the `Modal` + `DropdownMenu`.
- **`BackLink`.** `variant="circle"` (above).
- **New `ChoiceChips`.** A row of pill options (`Button sm` look): selected is primary, others are outline. It has `accessibilityRole="radiogroup"`, each option `role="radio"` with `aria-checked`, and props `label`, `options`, `value`, `onChange`. The label is `fieldLabel`, inline on the left.
- **New `Badge`.** A small pill: `bg-green-light rounded-pill px-3 py-1`, label `smallStrong` greenBrand.
- **New `ScrollHint`** (above).
- **New `DateField`** (`date-field.tsx` + `date-field.web.tsx`). It has the label above, value `Date`, `onChange`, `minimumDate` and an above-style box showing the formatted date with a calendar icon.
  - iOS: `@expo/ui/community/datetime-picker` with `display="compact"` inside the box.
  - Android: tapping the box mounts the same picker (dialog presentation) and unmounts it after set or dismiss.
  - Web: a DOM `<input type="date">` styled to the box (`min` = today).

  `@expo/ui` is already installed and included in Expo Go. Check the docs page before building.
- **`icons`.** Add `chevronDown` (already there), `calendar` (`calendar` / `calendar_today`) and `arrowDown` if needed.

### Data (SQLite)

- **Database.** `expo-sqlite` (already installed), with one database `seed.db` opened by `SQLiteProvider` in the root layout around the `Stack`. Its `onInit` is `migrate(db)` in `src/db/migrate.ts`, using `PRAGMA user_version` steps like the docs example. The onboarding flag stays in kv-store/localStorage (plan 02).
- **Schema v1:**

  ```sql
  PRAGMA journal_mode = WAL;
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE bills (
    id INTEGER PRIMARY KEY NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
    next_due_date TEXT NOT NULL,          -- local date, YYYY-MM-DD
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE transactions (
    id INTEGER PRIMARY KEY NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount_cents INTEGER NOT NULL,        -- positive; kind comes from the category
    date TEXT NOT NULL,                   -- YYYY-MM-DD
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  ```

  The starting budget is one `transactions` row: the first income category, today's date and the note "Starting budget".
- **Data access.** `src/db/` holds `schema.ts` (row types), `migrate.ts` and `onboarding.ts`. `saveOnboarding(db, draft)` runs in one transaction with parameterized `runAsync` only (never `execAsync` with user input). Screens get `db` from `useSQLiteContext()`.
- **Web.** SQLite on web needs `SharedArrayBuffer`:
  - Add `wasm` to `resolver.assetExts` in `metro.config.js` (it isn't in the default config; checked).
  - Set `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` through the `expo-router` plugin's `headers` option in `app.json` (it's in the plugin schema).
  - Step 1 checks that `window.crossOriginIsolated === true` on the dev server. If the plugin headers don't apply under `npx expo start`, add them in `metro.config.js` with `server.enhanceMiddleware` as well.
- **Money.** `src/lib/money.ts`:
  - `CURRENCY = { code: 'PHP', symbol: '₱', locale: 'en-PH' }`.
  - `parseMoney(text)` returns cents or `null`. It accepts `1500`, `1,500.50` and `.5`. It rejects negatives, more than 2 decimals and anything that isn't a number.
  - `formatMoney(cents)` returns "₱1,500.50" via `Intl.NumberFormat`.

  All amounts are integer cents.
- **Dates.** `src/lib/dates.ts` has `toLocalISODate(date)` (YYYY-MM-DD, local, not UTC) and `formatShortDate` ("Dec 5, 2026").

### New tokens (`src/theme/values.js`)

- `size.fieldList: 232` (field list max height).
- `size.scrollHint: 36` (hint chip height).

The back circle reuses `size.tapTarget`, and the hint offset uses `space[3]`.

## Out of scope

- The home page and anything that reads the saved data (it's checked in verification only).
- Editing categories or bills after onboarding.
- Saving the draft across app restarts.
- Currency choice or locale-based currency.
- Recurring income (only bills, which are expenses).
- A "replay onboarding" control. Reset as in AGENTS.md, plus deleting `seed.db`.

## Steps

### 1. Database and web isolation

Read first: `https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/`.

- `metro.config.js`: `config.resolver.assetExts.push('wasm')` before `withNativeWind`.
- `app.json`: turn the `"expo-router"` plugin entry into `["expo-router", { "headers": { "Cross-Origin-Embedder-Policy": "credentialless", "Cross-Origin-Opener-Policy": "same-origin" } }]`.
- `src/db/schema.ts`, `src/db/migrate.ts` (schema v1 above).
- Root layout: wrap `<Stack>` in `<SQLiteProvider databaseName="seed.db" onInit={migrate}>`.
- Temporarily log `crossOriginIsolated` and `SELECT count(*) FROM categories` on web.

Done when, on web and the iOS simulator, the app starts, the migration runs once (`user_version` = 1) and the hold screen still works. If `crossOriginIsolated` is false on web, add the `enhanceMiddleware` headers. If it's still false, stop and report.

### 2. Money, dates, draft model

- `src/lib/money.ts` and `src/lib/dates.ts` as above.
- `src/features/onboarding/draft.tsx`:
  - Types: `DraftCategory { key: string; name; description?; kind }` and `DraftBill { key; categoryKey; name?; amountCents; frequency; nextDueDate: string }`.
  - `DEFAULT_CATEGORIES`.
  - `OnboardingDraftProvider` / `useOnboardingDraft()`, with `useReducer` actions: `addCategory`, `removeCategory` (also removes its bills), `setStartingAmount`, `addBill`, `removeBill`.
  - Keys come from a counter, not `Math.random`, so server and client render the same.
- `src/db/onboarding.ts`: `saveOnboarding(db, draft)` maps draft keys to inserted ids inside the transaction.
- Quick checks: call `parseMoney` on the edge cases above in a temp script and confirm the results.

### 3. Components

Build the component changes from **Components**: TextField, SelectField and BackLink variants, plus ChoiceChips, Badge, ScrollHint and DateField. Export the new ones from `index.ts`. Add `size.fieldList` and `size.scrollHint` to `values.js`.

Done when a temporary `src/app/dev-onboarding-parts.tsx` renders each new prop and state on web (390 wide) and iOS. Delete the route before close-out.

### 4. Routes and Fields step

- Move `src/app/onboarding.tsx` to `src/app/onboarding/index.tsx`. Point the image `require`s at `@/assets/...` (unchanged). Change `onComplete` to push `/onboarding/fields` and add the focus reset.
- `src/app/onboarding/_layout.tsx` is a `Stack` (`headerShown: false`) wrapped in `OnboardingDraftProvider`.
- A shared `src/features/onboarding/setup-screen.tsx` holds the background, scrim, back circle, title, body, scroll area and fixed CTA slot. Both steps use it.
- `src/app/onboarding/fields.tsx` follows **Fields step**.

Done when hold → Fields works, the list matches screenshot 3, add/remove/validation work, and back returns to a reset hold screen.

### 5. Plough step and save

`src/app/onboarding/plough.tsx` follows **Plough step**. "Plant the seeds" calls `saveOnboarding` and then `completeOnboarding()`.

Done when it matches screenshots 1 and 2, bills add and remove, and a save lands on `index`.

### 6. Close out

Run Verification, delete the temp route, add `## Result`, set `Status: done` and apply the AGENTS.md updates.

## Verification

1. `npx tsc --noEmit`, `npx expo lint` and `npx expo-doctor` pass.
2. Web at 390×844 (Playwright), with storage cleared and `seed.db` gone (clear site data):
   - Hold → Fields. Screenshot and compare with ref 3: 5 categories, scroll hint over the list.
   - Add "Groceries" (Expense). A duplicate "needs" shows the invalid message.
   - Remove both Income and Groceries' siblings until there's no income: the rule message shows and the CTA is disabled. Add an income one back.
   - Back → the hold screen is reset → hold again → Fields keeps the draft.
3. Plough. Screenshot and compare with refs 1 and 2 (the hint shows, then hides after scrolling):
   - Amount `abc` → invalid message. `15000` → valid.
   - Add 2 bills (one with no name). Rows show the formatted amount, frequency and date.
   - Go back to Fields and remove the category of a bill → the confirm modal → Remove. The bill is gone in Plough.
4. "Plant the seeds" → `index` with no console errors. Then query `seed.db` (in the page through a temporary debug log, or in the simulator with `sqlite3` on the app container file):
   - The categories in order.
   - One transaction of 1500000 cents under the first income category.
   - The bills with the right `category_id`, `frequency` and `next_due_date`.
5. Reload: still `index`. A second launch does not re-run the migration.
6. iOS simulator (Expo Go): the same flow by hand where it can be driven. Check the DateField compact picker, that the keyboard doesn't cover the focused field, and the scroll hint. Android emulator if available, otherwise record it as unchecked.
7. Screen reader: the back circle, remove buttons, chips (radio) and hint have labels. Check on web through the accessibility tree; VoiceOver if available.

## AGENTS.md updates

- **Design system:** add ChoiceChips, Badge, ScrollHint and DateField to the component list. TextField and SelectField take `labelPosition="above"` (the mockup form style: uppercase label above a boxed input). BackLink takes `variant="circle"` on photo and dark screens. On photo screens the CTA is `Button variant="inverse"` over a `bg-black-alpha-50` scrim.
- **App state:**
  - App data lives in SQLite (`seed.db`, `SQLiteProvider` in the root layout, migrations in `src/db/migrate.ts` by `PRAGMA user_version`; never edit an old step, add a new one). Queries are parameterized.
  - Money is integer cents, formatted by `src/lib/money.ts` (PHP, ₱). Dates are local `YYYY-MM-DD` strings (`src/lib/dates.ts`).
  - Web SQLite needs `wasm` in Metro `assetExts` and COOP/COEP headers (set in `app.json`; record whether the dev server needed `enhanceMiddleware`).
  - Onboarding is `src/app/onboarding/` (hold → fields → plough). It completes only after the data is saved. Reset: clear the onboarding flag and delete `seed.db`.
- **Rules:** `src/features/<feature>/` holds feature-specific non-route code (draft state, shared screen chrome).

## Result

Built as planned. On web (390×844, Playwright), Fields matches screenshot 3 and Plough matches screenshots 1–2. The whole flow saves the right rows to `seed.db`. On iOS (Expo Go, iPhone 16 Plus simulator), all three screens render correctly. Deviations:

- **Routing (approved change):** `Stack.Protected` was dropped for onboarding and `index`. In SDK 58 a guard flip didn't move off a nested onboarding screen: the save finished but the app stayed on Plough with the button spinning, and Back could still reach Fields. Adding `router.replace('/')` on top made the router loop between `/` and `/onboarding`. Now `index` renders `<Redirect href="/onboarding">` until onboarded, and `onboarding/_layout.tsx` renders `<Redirect href="/">` once onboarded. Plant needs no navigation call of its own.
- **Web isolation:** the `expo-router` plugin `headers` apply on the dev server too (`crossOriginIsolated === true`), so no `enhanceMiddleware` was needed.
- **ScrollHint → `HintScrollView`:** a single component that wraps the ScrollView. A hook that returned a ref broke the React Compiler lint rule ("Cannot access refs during render"). The chip also shows only when more than `space[4]` is hidden; otherwise bottom padding alone triggered it and it covered the Type chips.
- **Layout to match the mockup:** the body copy is `body`, not `bodyLarge`. The cards are `tight`. `size.fieldList` is 176 (about 2.5 rows), not 232. The Add button is wrapped in a `min-h-field` view because Button aligns itself to the start. `maxHeight` was added to the Tailwind size scales.
- **Inputs:** both TextField styles gained `outline-none`, because web drew the browser focus ring inside the box.
- **Hold screen reset:** it resets on `transitionEnd` (closing) with a focus fallback, not with `useFocusEffect`. That avoids the sprout flashing back to soil while Fields slides in.
- **Not built:** the temporary component gallery route. The components were checked on the real screens instead.
- **Not checked:** holding, typing, the DateField compact picker and keyboard insets on iOS and Android (the simulator can't be driven from the CLI), and VoiceOver. Roles and labels were checked through Playwright's accessibility queries on web.
