# 12 · Settings

Status: done

## Goal

A fifth tab, Settings, where the user picks the app's currency from every active ISO 4217 currency (with a live "Amounts will look like" preview) and exports all their data as one CSV file.

## Decisions

- Mockup: the two screenshots shared with this plan (photo hero "Settings / Tune how Seed shows your money.", a Currency card and an Export card). Tab order: Home, Entries, Categories, Forecast, Settings.
- Currency list: every active ISO 4217 currency (~155; historic/fund/metal codes like XAU, XDR, USN, BOV left out), committed as a static table in `src/lib/currencies.ts` (code, English name, symbol, decimals, unit word). Generated once by `scripts/build-currencies.mjs` from Node's `Intl` (`supportedValuesOf('currency')`, `DisplayNames`, `narrowSymbol`, fraction digits) plus an exclusion list; not read from `Intl` at runtime because Hermes' `Intl` data differs by platform.
- Decimals follow each currency: 0-decimal currencies (JPY, KRW, VND…) show and accept whole amounts only; 3-decimal ones (KWD, BHD, OMR, JOD, TND, LYD, IQD) are capped at 2. Storage stays integer hundredths for every currency, so no migration. Old fractional amounts shown in a 0-decimal currency are rounded for display only.
- Switching currency relabels only: ₱1,500 becomes $1,500. No conversion (offline, no rates). The card says so under the preview.
- Formatting is ours, not `Intl` currency style: sign + symbol + number grouped as `1,234.50` (`Intl.NumberFormat('en-US')` decimal/compact, fraction digits from the table). A symbol that is just the code is followed by a space (`KWD 1,234.50`). Same output on iOS, Android and web.
- Picker label: `₱ Philippine peso (PHP)`; when the symbol is the code, `Kuwaiti dinar (KWD)`. Default currency stays PHP.
- Storage: device-local kv value `currency` (the onboarding-flag pattern: `expo-sqlite/kv-store` sync on native, `localStorage` in a `.web.ts` twin). An unknown stored code falls back to PHP. The root layout already renders nothing until web storage is known.
- Reactivity: components get money helpers from a `useMoney()` hook (subscribed with `useSyncExternalStore`), so every amount re-renders on a switch. `money.ts` becomes pure functions that take a currency. `CURRENCY` is removed.
- Copy word: each currency has a `unit` ("peso", "dollar", "euro", "yen"), the last word of its name lowercased with a small override table. Feeds "Every peso in and out".
- Date formatting stops borrowing the currency locale: `dates.ts` gets its own `DATE_LOCALE = 'en-PH'` (same output as today).
- Save currency: `Button` primary, disabled until the selection differs from the saved one; saving updates the store and the button goes back to disabled. Preview (₱1,234.50 in `greenAccent`) follows the current selection before saving.
- Picker: `SelectField` gains `searchable`: the modal gets a search `TextField` (matches code or name, case-insensitive) and a scrolling list capped by a new `picker` max-height token, selected row with a check. Search needs no new component.
- Export: one CSV, one header row, one row per record. Columns: `record,date,category,kind,amount,currency,repeats,start_date,next_due_date,note,description`. `record` is `category`, `starting_budget`, `bill` or `entry`. Amount is a plain decimal (`1500.50`, digits per currency, no symbol); `repeats` is the frequency label. RFC 4180 quoting (quote fields with `,`, `"`, CR/LF; double inner quotes), CRLF line ends, UTF-8 BOM so Excel reads ₱. Order: categories (sort order), starting budget, bills (next due), entries (date, then id). File name `seed-export-YYYY-MM-DD.csv`.
- Counts tile: Entries = transactions minus the starting budget, Bills, Categories. Loaded on focus.
- Native save: `expo-file-system` (`new File(Paths.cache, name)`, `create({ overwrite: true })`, `write`) then `expo-sharing` `shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle })` — the share sheet offers Save to Files / Drive. Both ship in Expo Go. Web: `save-file.web.ts` downloads a `Blob` via a temporary `<a download>` (expo-sharing can't share local files on web).
- Tab icon: Lucide `Settings`; Save as CSV icon: Lucide `Download`. Hero photo: `assets/images/onboarding/04-sprout.jpg` (reuse, already credited).

## Out of scope

- Asking for currency during onboarding.
- Exchange-rate conversion, multiple currencies at once, per-locale number grouping (`1.234,50`).
- CSV import, JSON export, other settings (reset data, re-run onboarding).

## Steps

### 1. Currency table and money helpers

- Add `scripts/build-currencies.mjs` (Node, no deps): build the list from `Intl` with the exclusion list and unit overrides, write `src/lib/currencies.ts` exporting `type Currency = { code; name; symbol; digits: 0 | 1 | 2; unit }`, `CURRENCIES` (sorted by name), `DEFAULT_CURRENCY_CODE = 'PHP'`, `findCurrency(code)`. Clamp digits to 2. Force PHP's symbol to `₱`. Add `"currencies": "node scripts/build-currencies.mjs"` to package.json scripts. Run it and commit the output.
- Rewrite `src/lib/money.ts` as pure functions: `formatMoney(cents, currency)`, `formatMoneyCompact(cents, currency)`, `parseMoney(text, currency)` (strips the currency's symbol/code; rejects any fraction for 0-digit currencies, more than 2 decimals otherwise; same MAX_CENTS), `formatAmountPlain(cents, currency)` for CSV. Cache `Intl.NumberFormat` instances per digits.
- Add `src/lib/currency.ts` + `currency.web.ts` (copy the shape of `onboarding.ts`/`.web.ts`): `getCurrency()`, `setCurrencyCode(code)`, `useCurrency()`, and `useMoney()` returning `{ currency, format, formatCompact, parse }`. Web server snapshot = default currency (formatting needs a value; the root layout already waits for hydration).
- `dates.ts`: own `DATE_LOCALE`.
- Done: tsc passes once callers are moved (step 2).

### 2. Move callers to `useMoney()`

Replace `CURRENCY`/`formatMoney`/`parseMoney` imports in: `src/app/(tabs)/entries.tsx` (`currency.unit`), `src/app/onboarding/plough.tsx`, `src/features/entry/entry-form.tsx` (prefix = `currency.symbol`), `src/features/entries/entry-row.tsx`, `src/features/home/hero.tsx`, `src/features/home/category-breakdown.tsx`, `src/features/forecast/{balance-chart,date-range-card,summary-card}.tsx`. `src/db/onboarding.ts` takes `parseMoney(text, getCurrency())`. Amount inputs for 0-digit currencies use `keyboardType="number-pad"` instead of decimal. Done: lint + tsc clean, app looks identical with PHP.

### 3. Settings tab shell

- `src/app/(tabs)/settings.tsx` laid out like `forecast.tsx`: `HintScrollView` + `PhotoHero` (title `heroLarge` "Settings", subtitle "Tune how Seed shows your money."), centered column with `gap-4`, light status bar on focus.
- `tabs.ts` entry (`settings`, `/settings`, `icons.settings`); add `settings: Settings` and `download: Download` to `icons`; add `{ file: 'settings', lucide: 'settings' }` to `scripts/build-tab-icons.mjs` and run `npm run icons:tabs`.
- Done: five tabs on web and native, Settings shows the hero.

### 4. Currency card

- `SelectField` `searchable` prop: search `TextField` (`hideLabel`, placeholder "Search currencies") above a `HintScrollView` with `max-h-picker` (add `picker: 360` to sizes in `values.js`), rows from `DropdownMenu` with a check `Icon` on the selected value, "No currency matches" when empty, search cleared on close.
- `src/features/settings/currency-card.tsx`: `Card` with `h2`-style title "Currency" in `greenAccent` like the mockup, `SelectField labelPosition="above" label="Default currency" searchable`, preview box (`bg-ceramic rounded-field p-3`, "Amounts will look like" `textBlackSoft` + `format(123450)` in `greenAccent`), note "Switching changes the symbol only; your amounts keep their numbers." (`caption`, `textBlackSoft`), `Button` "Save currency" disabled until changed.
- Done: picking JPY previews `¥1,235`, KWD previews `KWD 1,234.50`; saving updates Home/Entries/Forecast amounts and the add-entry prefix without a reload.

### 5. Export card

- `src/db/export.ts`: `loadExportCounts(db)` and `loadExportRows(db)` (categories, transactions joined with category, bills joined with category; parameterized, starting budget = the `STARTING_BUDGET_NOTE` row). Run `postDueBills` before loading so the file matches what Home shows.
- `src/features/settings/csv.ts` (pure): `buildCsv(rows, currency)` with the columns, order and quoting above.
- `src/features/settings/save-file.ts` (native: file-system + sharing; `isAvailableAsync` false → throw) and `save-file.web.ts` (Blob download). Install with `npx expo install expo-file-system expo-sharing`.
- `src/features/settings/export-card.tsx`: title "Export your data", body copy from the mockup, three count tiles on a `bg-ceramic rounded-field` row (number `h2` `greenHouse`, label caption), `Button` "Save as CSV" with the download icon, loading state while saving, red error text on failure, nothing on success other than the share sheet/download.
- Done: tapping saves a file whose rows match the counts.

## Verification

- `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor`.
- Unit-ish checks with a throwaway Node/tsx script in the scratchpad: `parseMoney` (PHP "1,500.50" → 150050; JPY "1500" → 150000, "1500.5" → null; KWD "1.234" → null), `formatMoney` (PHP, USD, JPY rounding, KWD code spacing, negatives), `buildCsv` quoting (a note with a comma, a quote and a newline).
- Playwright on the web build, 390 px wide: screenshot Settings and compare to the mockup; open the picker, search "yen", pick JPY, check the preview, save, then screenshot Home and Entries showing ¥; the add-entry prefix shows ¥ and rejects `12.5`; switch back to PHP.
- Export on web: click Save as CSV, capture the download, check the header, row counts vs the tiles, and that the file opens with the BOM.
- End to end: fresh onboarding (clear site data) → add a one-time entry and a monthly bill → Settings shows 1 / 1 / N → export → switch to USD → every tab shows $ with the same numbers → reload keeps USD.
- Not checkable here: the native share sheet (iOS simulator manual check listed in the report).

## AGENTS.md updates

- App state: replace the `CURRENCY.name` bullet with: currency is a device-local kv setting (`src/lib/currency.ts` + `.web.ts`); components format money only through `useMoney()`; `money.ts` functions take a `Currency`; the list is `src/lib/currencies.ts`, generated by `npm run currencies`; decimals follow the currency (0 → whole only, 3 capped to 2), storage stays hundredths; switching relabels, never converts.
- App state: replace "Money is integer cents, PHP (₱), parsed and formatted only by `src/lib/money.ts`" with "Money is integer hundredths in the chosen currency…".
- Navigation: tabs now Home, Entries, Categories, Forecast, Settings.
- Design system: `SelectField` `searchable` for long option lists.
- App state: export = one CSV (`src/features/settings/csv.ts`), saved by `save-file.ts` (file-system + sharing) / `.web.ts` (Blob download).

## Result

Built as planned: a Settings tab with a searchable picker of 154 currencies, a live preview and a Save button, plus a CSV export (web download, native share sheet). Every amount in the app now goes through `useMoney()`.

Changes from the plan, found while verifying:
- AFN's symbol (؋) is a right-to-left character and flipped its picker row, so the generator falls back to the code for right-to-left symbols.
- Amount placeholders (`0` vs `0.00`) and validation messages ("the Japanese yen has no decimals") follow the currency's decimals.
- The hero reuses `04-sprout.jpg`, which Entries already uses. Every onboarding photo is now used by some tab.
