# 13 · Reset (Start over)

Status: done

## Goal

A "Start over" card at the bottom of Settings that, after a confirm step, erases everything (starting budget, bills, categories, entries and settings) and takes the user back to the start of onboarding.

## Decisions

- Mockup: the "iOS settings" screenshot shared with this plan. A third card below Export: title "Start over" in `red` (`h1`), body copy "Resetting clears your starting budget, recurring bills, categories, entries and settings, then takes you back to the beginning of onboarding." (`small`, `textBlackSoft`), and a full-width red outline pill "Reset Seed: Budget".
- New `Button` variant `destructiveOutline` (transparent fill, `border-red`, `red` label) for the button in the mockup. It starts the reset flow; it doesn't delete on its own.
- Confirm step: the existing `Modal` like `DeleteCategoryDialog`, titled "Reset Seed: Budget?", body "This deletes your starting budget, N entries, N recurring bills and N categories, and sets the currency back to PHP. It can't be undone. Save a CSV first if you want a copy." (counts from the Export card's `ExportCounts`), and a solid `destructive` "Reset everything" button. Closing it or tapping the scrim cancels.
- "Settings" means the currency: reset removes the stored value, so it goes back to PHP. The onboarded flag is cleared too.
- Order: delete `transactions`, `bills`, `categories` in one `withTransactionAsync` (children first, as in `saveOnboarding`), then clear the currency, then clear the onboarded flag last. If the database step fails, nothing else is cleared and the dialog shows a red error.
- Navigation: clearing the flag notifies `useOnboarded()`, and `(tabs)/_layout` already `<Redirect>`s to `/onboarding`. The onboarding draft provider mounts fresh with the onboarding layout, so the form starts empty. No manual `router` call (plan 04: manual `replace` next to the guard loops).
- The flag and currency wrappers each get a clear function: `resetOnboarding()` in `onboarding.ts`/`.web.ts` (`removeItemSync` / `localStorage.removeItem`) and `resetCurrency()` in `currency.ts` (through `clearCurrencyCode()` in `currency-storage.ts`/`.web.ts`). Both notify subscribers.
- The onboarding hold screen keeps working on a second run: it already remounts `HoldToUnlock` on focus.

## Out of scope

- Undo, or an automatic backup before reset.
- Deleting the `seed.db` file itself or resetting the schema version (rows are cleared, migrations stay).
- Partial resets (only entries, only bills).

## Steps

### 1. Clear functions

- `src/db/reset.ts`: `resetAllData(db)` deletes from `transactions`, `bills`, `categories` in one transaction (parameterless statements via `runAsync`).
- `src/lib/onboarding.ts` + `.web.ts`: `resetOnboarding()` removes the `onboarded` key, sets the in-memory value to `false`, notifies listeners.
- `src/lib/currency-storage.ts` + `.web.ts`: `clearCurrencyCode()`. `src/lib/currency.ts`: `resetCurrency()` clears it, sets `current` to the default, notifies listeners.
- Done: lint + tsc clean.

### 2. Button variant

- `src/components/ui/button.tsx`: add `destructiveOutline: { container: 'bg-transparent border-red', label: 'red' }` with a doc line ("starts a destructive flow that confirms next, e.g. Reset").
- Done: tsc clean; other variants unchanged.

### 3. Start over card and confirm dialog

- `src/features/settings/reset-card.tsx`: the card from the mockup. It owns `open` state and renders `ResetDialog`.
- `src/features/settings/reset-dialog.tsx`: `Modal` + body built from `counts` (pluralized with `countLabel` from `src/features/categories/counts.ts`; a missing starting budget isn't mentioned) + `Button variant="destructive"` with `loading`; on press: `resetAllData` → `resetCurrency()` → `resetOnboarding()`. On error: `console.error` + "Couldn’t reset. Try again." in `red`, nothing else cleared.
- `src/app/(tabs)/settings.tsx`: render `<ResetCard counts={counts} />` after `ExportCard`.
- Done: tapping Reset everything lands on the onboarding hold screen with an empty draft.

## Verification

- `npx expo lint`, `npx tsc --noEmit`.
- Playwright on web, 390 wide: onboard with a starting budget, add an entry and a monthly bill, switch currency to USD. On Settings, screenshot the Start over card and compare to the mockup. Open the dialog (screenshot; counts in the copy), cancel with the close button (nothing changes), open again and confirm. Expected: URL `/onboarding`, the hold screen shows; `localStorage` has no `onboarded` or `currency`. Finish onboarding again with the default categories (no UNIQUE error), then Settings shows PHP and counts 0 / 0 / 5.
- Not checkable here: native (iOS sim) run.

## AGENTS.md updates

- App state, onboarding bullet: replace "To see onboarding again, clear the flag (…)" with: Settings → Start over resets (`resetAllData` + `resetCurrency()` + `resetOnboarding()`, flag cleared last; the tabs layout redirect does the navigation).
- Design system: `Button variant="destructiveOutline"` opens a destructive flow; the confirm step stays solid `destructive`.

## Result

Built as planned. The one change: `ExportCounts` gained `startingBudgets`, so the confirm copy only mentions the starting budget when there is one. Verified on web: cancelling changes nothing, and confirming lands on `/onboarding` with `onboarded` and `currency` cleared. A second onboarding with the default categories succeeds, and Settings then shows PHP with 0 / 0 / 5.
