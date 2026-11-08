# 07 · Entries tab

Status: done

## Goal

A new Entries tab, second in the bar, lists everything the user has logged. Recurring bills sit in their own section at the top. Below them, one-off income and expense entries are grouped by month. The user can add an entry from the tab's hero. Tapping a row opens the entry sheet filled in, to edit or delete it.

Reference: the user's mockups (Nov 2026, web at 390 wide):
- The tab bar reads Home · Entries · Categories · Forecast. The Entries icon is a list.
- The hero is a leafy photo under a scrim. It holds the white "Entries" title (`heroLarge`), the subtitle "Every peso in and out, all in one place." (`textWhiteSoft`) and a white "+ Add an entry" pill.
- With nothing logged, one white Card reads "Nothing planted yet. Tap “Add an entry” to record your first expense or income."
- "Add an entry" opens the same sheet as on Home (plan 06), over a dimmed Entries screen.

## Decisions

### Answers from the user

- **Bills get a separate section.** A "Recurring" heading and Card come first, followed by the one-off entries grouped by month.
- **Edit and delete.** Tapping a row opens the plan 06 sheet, filled in. Its title is "Edit entry" and its CTA is "Save changes". A red "Delete entry" button sits below the CTA and asks to confirm first.
- **Grouped by month.** Each month gets a heading ("November 2026", `h2`) and one Card with that month's entries, newest month first. Every entry shows.

### Defaults picked (veto any of these)

- **Currency name.** `CURRENCY` in `src/lib/money.ts` gains `name: 'peso'`. The subtitle reads `Every ${CURRENCY.name} in and out, all in one place.` When the currency setting arrives, it will replace this constant (out of scope).
- **Hero.** The photo is `assets/images/onboarding/04-sprout.jpg` (already credited), under a `bg-black-alpha-50` scrim. It runs full-bleed under the status bar (`Screen`-style `edges={[]}`, a top inset in `style`, light status bar on focus), like Home's.
  - The hero shell (photo + scrim + inset column) moves out of Home's `Hero` into a shared `src/features/home/photo-hero.tsx`, `PhotoHero({ photo, children })`. Both Home and Entries use it.
  - The CTA is `Button variant="inverse" fullWidth icon={icons.plus}` and pushes `/add-entry`.
- **Tab.** It's the second entry in `TABS`: `{ name: 'entries', href: '/entries', label: 'Entries' }`. The icon `icons.entries` is `{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }`, and `sfSelected` is `'list.bullet'` (it has no fill variant).
- **List.** A `FlatList` with one item per section (the Recurring card, then one per month), so long histories are virtualized month by month.
  - The hero is the `ListHeaderComponent`.
  - Content uses the same centered column classes as `Screen` (`w-full max-w-content self-center px-3 md:px-4 lg:px-6`, `gap-4` between sections, `pb-4`).
  - The data reloads in `useFocusEffect`, so it refreshes when the sheet closes.
- **Rows.** These are shared with Home's Recent entries, so the row moves into `src/features/entries/entry-row.tsx`.
  - Each row shows the category name (`bodyStrong`); the detail line (`small` textBlackSoft); and the signed amount (`+₱…` / `−₱…`, `bodyStrong`).
  - In a month card the detail is the note · short date. In the Recurring card it's the name · frequency label · "next Dec 5, 2026" ("due …" for `once`).
  - Each row is a `Pressable` with `active:bg-black-alpha-6`, `rounded-field`, `min-h-tap-target`, `accessibilityRole="button"`, and a label like "Needs, Groceries, Nov 8, 2026, minus ₱250.00. Edit".
  - Rows in Home's Recent entries become tappable too and open the same edit sheet.
- **Recurring card** shows only when there are bills. It's sorted by next due date, then id. Its heading is "Recurring". Under it, a `small` textBlackSoft line reads "Counted per month on Home."
- **Month cards** are built from the transactions, newest first (`date DESC, id DESC`), and grouped by `YYYY-MM` in JS. The heading uses `formatMonthYear`.
- **Empty state.** It shows only when there are no entries and no bills, with the mockup's copy.
- **Edit route.** `src/app/entry/[key].tsx` → `/entry/e-12` (transaction 12) or `/entry/b-3` (bill 3). It uses the same root-Stack sheet options as `add-entry`; those options move into one shared constant in `_layout.tsx`.
  - An unknown or malformed key shows "This entry no longer exists." with a Close button.
- **EntryForm** gains an optional `initial` (the loaded entry plus its key). When `initial` is set, the form:
  - starts with its kind, amount, category, note, Repeats and date
  - titles the sheet "Edit entry" and labels the CTA "Save changes"
  - shows the destructive Delete button
- **Changing Repeats across tables.**
  - One-time ↔ recurring moves the row: delete it from one table and insert it into the other, in one `withTransactionAsync`.
  - Within the same table, it's an `UPDATE`.
  - The `once` bills from onboarding open with Repeats "One-time". Saving them converts them to an entry on their due date. Home's totals are unchanged, because both count only in that month.
- **Starting budget row.** This is the transaction with note `STARTING_BUDGET_NOTE`. It can be edited (amount, category, date) and deleted. In its sheet:
  - the kind chips, Note and Repeats are hidden
  - a `small` line reads "Your starting budget. It's capital, so Home leaves it out of monthly income."
  - This keeps the note intact, since Home's totals rely on it.
- **Delete.** A confirm `Modal` titled "Delete this entry?" shows the row's summary, a `destructive` "Delete" button and an `outline` "Cancel". After deleting, the sheet closes. If it fails, a red message shows and the sheet stays open.
- **Data** (`src/db/entries.ts`, parameterized):
  - `loadEntryList(db)` returns `{ entries, bills }`, both joined to their category name and kind.
  - `loadEntryByKey(db, key)` returns the entry or `null`.
  - `updateEntry(db, key, input)` and `deleteEntry(db, key)`.
  - `parseEntryKey('e-12')` returns `{ type: 'entry', id: 12 }` or `null`.
  - `RecentEntry`'s `key` format (`e-`/`b-`) is the same, so Home links with it directly.

## Out of scope

- The currency setting itself (the `CURRENCY` constant stays).
- Search, filters and totals per month.
- Swipe actions, undo after delete, and bulk delete.
- Editing categories.

## Steps

### 1. Tab and screen shell

- Add `icons.entries` and the `TABS` entry.
- Add `CURRENCY.name`.
- Extract `PhotoHero` from Home's hero.
- Create `src/app/(tabs)/entries.tsx` with the hero and the empty state.
- Done when, on web, the bar shows 4 tabs and Entries matches the empty mockup. Home looks unchanged.

### 2. Data

- Write the `entries.ts` additions (list, by key, update with the cross-table move, delete, key parsing).
- Check the key parsing and month grouping with a throwaway scratchpad script.

### 3. List

- Extract `EntryRow`.
- Build the Recurring card and the month cards in a `FlatList`, refreshing on focus.
- Make Home's recent rows tappable.
- Done when, on web, added entries appear in the right sections.

### 4. Edit and delete

- Add the `entry/[key]` route and share the sheet options.
- Add `initial` to `EntryForm`, with the starting-budget mode and the delete confirm.
- Done when you can edit, convert and delete entries from both Entries and Home.

### 5. Close out

Lint, typecheck, the verification below, `## Result`, and the AGENTS.md updates.

## Verification

1. `npx expo lint` and `npx tsc --noEmit` pass.
2. Web (Playwright, 390 × 844, fresh site data):
   1. Onboard with no starting budget and no bills. The Entries tab is second and matches the empty mockup (screenshot). "Add an entry" opens the sheet over Entries.
   2. Add a ₱250 Groceries expense (today) and a ₱20,000 income entry dated last month. The "November 2026" card holds Groceries, and the "October 2026" card holds the income. There's no Recurring card.
   3. Add a monthly ₱8,000 Rent. The Recurring card appears first with "Rent · Monthly · next …".
   4. Tap Groceries. The sheet reads "Edit entry" with ₱250 / Needs / Groceries / One-time / today. Change it to ₱300 and save. The row shows −₱300.00 and Home's Spent shows ₱300.00.
   5. Edit Groceries to Repeats Weekly. It moves to the Recurring card. Edit it back to One-time, and it returns to the month card.
   6. Delete Rent: Cancel keeps it. Delete removes it, and the Recurring card disappears.
   7. Tap a row in Home's Recent entries. The edit sheet opens for that entry.
   8. Fresh again, with a ₱15,000 starting budget: its sheet hides kind, Note and Repeats and shows the capital line. Editing the amount keeps Home's hero at ₱0.00.
   9. Open `/entry/e-999` directly. It shows "This entry no longer exists."
3. iOS (simulator, if one is available and onboarded): the 4-tab bar shows the list icon, and the edit sheet opens as a form sheet. Otherwise report it as ❌ not checked.

## AGENTS.md updates

- **Navigation & Routing:** the tabs are Home, Entries, Categories, Forecast. The `entry/[key]` edit sheet (`e-<id>` transaction, `b-<id>` bill) shares the sheet options with `add-entry`.
- **App state:** editing across One-time ↔ recurring moves the row between `transactions` and `bills` in one transaction. Never change the starting-budget row's note (its sheet hides it). `CURRENCY.name` feeds copy like "Every peso…".
- **Design system:** photo heroes on tab screens use `PhotoHero` (`src/features/home/photo-hero.tsx`). Entry rows use `EntryRow` (`src/features/entries/`).

## Result

Built as planned. Entries is the second tab. It has a photo hero, a Recurring card for bills and one card per month for entries. Tapping a row on Entries or in Home's Recent entries opens the `entry/[key]` sheet to edit or delete it.

Deviations and findings:
- `FlatList` has no typed `ListHeaderComponentClassName`, so the hero's bottom gap is a wrapper `View`.
- Section headings are `h2` in the default textBlack. The mockup has no populated state to match.
- Delete confirm text: "<category> · <amount> · <note>. This can't be undone."
- The edit sheet renders an empty `SheetFrame` while the row loads, so the native fit-to-contents sheet has a frame from the start.
- Not verified: iOS/Android (no onboarded simulator), including the list tab icon and the edit form sheet.
