# 08 · Recurring bills post real entries

Status: done

## Goal

A recurring bill becomes real history. On each due date the app posts an entry for it, catching up any dates missed while it was closed, and moves the bill's next date forward. Home counts actual due dates in the month instead of monthly averages. Entries shows the bill's real next date ("next Nov 12"), never a date that has already passed.

Background (from the conversation): today a bill is one `bills` row holding a rule. Nothing ever posts, `next_due_date` is never updated (it's really the start date), and Home averages each bill per month. So there's no history, editing a bill rewrites the past, and deleting it erases the past.

## Decisions

### Answers from the user

- **Option 1, auto-post.** Each occurrence becomes a `transactions` row linked by a new `bill_id`.
- **Post past dates too.** A start date in the past posts every due date up to and including today, at once. Existing bills catch up the same way the first time this version runs (e.g. weekly "Test" from Oct 29 posts Oct 29 and Nov 5, and the next date becomes Nov 12).
- **Home counts actual dates.** This month = transactions this month (posted bills included) + each bill's remaining due dates up to the end of the month.
  - "Spent" = expense transactions this month.
  - "Bills / mo" = expense bill occurrences this month, posted (transactions with `bill_id`) + upcoming.

### Defaults picked (veto any of these)

- **Schema v3** (new `if (version === 2)` step in `migrate.ts`, `DATABASE_VERSION = 3`):
  - `ALTER TABLE transactions ADD COLUMN bill_id INTEGER REFERENCES bills(id)`. It's NULL for one-off entries. Foreign keys aren't enforced, so the code detaches rows itself.
  - `ALTER TABLE bills ADD COLUMN start_date TEXT NOT NULL DEFAULT ''`, then `UPDATE bills SET start_date = next_due_date`.
  - Both go in one `withTransactionAsync`.
  - Meaning:
    - `start_date` is the anchor every occurrence is computed from. It keeps a month-end start on month end: Jan 31 → Feb 28 → Mar 31.
    - `next_due_date` is the first occurrence not yet posted.
  - `schema.ts`: `BillRow.start_date`, `TransactionRow.bill_id: number | null`.
- **Occurrence rules** (`src/lib/recurrence.ts`, pure, local `YYYY-MM-DD` strings). Occurrence k (k = 0, 1, 2…) from `start`:

  | frequency | occurrence k |
  |---|---|
  | once | only k = 0 |
  | daily / weekly / biweekly | start + k × 1 / 7 / 14 days |
  | monthly / bimonthly / quarterly / semiannually / yearly | start + k × 1 / 2 / 3 / 6 / 12 months, the start's day clamped to the month's last day |
  | semimonthly | even k: start + k/2 months (clamped); odd k: that date + 15 days |

  - API: `occurrencesBetween(start, frequency, from, to)` (inclusive) and `nextOccurrenceAfter(start, frequency, date)`.
  - New `src/lib/dates.ts` helpers: `addDays(iso, n)` and `addMonthsClamped(iso, n)`, using local dates only.
- **Posting** (`src/db/recurring.ts`, `postDueBills(db, today)`). In one transaction, for each bill with `next_due_date <= today`:
  - Insert one transaction per occurrence from `next_due_date` to today: same category and amount, `note` = the bill name, `bill_id` = the bill.
  - Then set `next_due_date` to the next occurrence after today.
  - A `once` bill posts its single occurrence and its bills row is deleted (it's done).
  - It's idempotent, because `next_due_date` moves past every posted date.
  - It runs before Home's and Entries' loads on every focus. That covers app start, coming back to a tab, and closing the add or edit sheet. No background task.
- **Saving a bill** (add or edit) sets `start_date = next_due_date = the chosen date`. Editing a bill only affects occurrences that haven't posted yet. If the edited date is today or earlier, the next focus posts from that date. Changing the date doesn't remove anything already posted.
- **Deleting a bill** first runs `UPDATE transactions SET bill_id = NULL WHERE bill_id = ?`, so its posted history stays. Converting a bill to One-time (plan 07's table move) detaches it the same way. Onboarding's reset deletes transactions before bills.
- **Posted entries in lists.** They're normal transactions: they appear in the month cards, and editing or deleting one only affects that occurrence. Their detail line adds "Recurring", e.g. "Test · Nov 5, 2026 · Recurring" (`bill_id IS NOT NULL` goes into the list query as `recurring`). Home's Recent entries does the same.
- **Recurring card.** It shows "<Frequency> · next <next_due_date>". After posting, that date is always after today, so it's never in the past. For a bill that starts in the future, it's the start date.
- **Home math** (`summary.ts`, rewritten; `monthlyCents` and `PER_MONTH` are removed):
  - `loadHomeData` returns per-category transaction sums for the month split into `{ cents, billCents }` (`bill_id` set). It also returns each bill's `start_date`, `frequency` and `next_due_date`.
  - Upcoming = for each bill, `occurrencesBetween(start, freq, max(next_due_date, monthStart), monthEnd).length × amount`, added to its category. After posting, `next_due_date` > today, so nothing is counted twice.
  - Net, gross income, the category bars and the plant use transactions + upcoming. The starting-budget exclusion stays.
  - The footnote changes to "Recurring bills count on their due dates."
- Home's Recent entries keeps merging bills (by created date) with transactions. Posted occurrences now show there as transactions too.

## Out of scope

- Background posting while the app is closed, and notifications.
- Skipping or pausing a single occurrence, or an end date for a bill.
- Forecast beyond this month (`recurrence.ts` is written to serve it later).
- Removing already-posted occurrences when a bill's date is moved earlier or later.

## Steps

### 1. Dates and recurrence

- Add `addDays` and `addMonthsClamped` to `dates.ts`, and create `src/lib/recurrence.ts`.
- Check them with a throwaway scratchpad script (`node` strips types) covering:
  - weekly from Oct 29 → occurrences through Nov 8 = Oct 29, Nov 5; next after Nov 8 = Nov 12
  - monthly from Jan 31 → Feb 28, Mar 31
  - semimonthly from Nov 1 → Nov 1, Nov 16, Dec 1
  - `once` → only its date
  - a start date after the range → nothing

### 2. Migration and posting

- Write migration v3, update `schema.ts`, and write `postDueBills`.
- Update the entry writes: inserts set `start_date`; bill updates set `start_date` and `next_due_date`; deletes and table moves detach `bill_id`; onboarding deletes in the right order.
- Done when, on web, a fresh weekly bill dated 10 days ago shows 2 posted entries and "next" a date after today.

### 3. Home math

- Update `loadHomeData` and rewrite `summarize`.
- Check the math with the scratchpad script: weekly ₱1,000 from Oct 29, today Nov 8, November → posted Nov 5 (₱1,000) + upcoming Nov 12, 19, 26 (₱3,000) = Bills / mo ₱4,000.
- Update the footnote.

### 4. Lists

- Add `recurring` to the list queries, and "Recurring" to the detail line on Entries and Home.

### 5. Close out

Lint, typecheck, the verification below, `## Result`, and the AGENTS.md updates.

## Verification

1. `npx expo lint` and `npx tsc --noEmit` pass.
2. Web (Playwright, 390 × 844, fresh site data, today = Nov 8 2026):
   1. Add a weekly ₱1,000 "Test" (Needs) dated Oct 29.
      - Entries: Recurring shows "Test · Weekly · next Nov 12, 2026".
      - November has "Test · Nov 5, 2026 · Recurring", and October has "Test · Oct 29, 2026 · Recurring".
   2. Home shows Spent ₱1,000.00 and Bills / mo ₱4,000.00, and the hero shows −₱4,000.00.
   3. Leave the tab and come back: there are no duplicate entries.
   4. Edit the posted Nov 5 entry to ₱1,200. Only that row changes, and the bill still shows ₱1,000.
   5. Delete the bill. The Oct 29 and Nov 5 entries stay as plain entries (detached, so no "Recurring" tag). Spent stays ₱1,200.00, and Bills / mo drops to ₱0.00.
   6. Add a monthly ₱8,000 Rent dated Dec 1. Nothing posts, it shows "next Dec 1, 2026", and November's totals don't change.
   7. Add a One-time bill through onboarding dated today. After onboarding it's an entry, not in Recurring.
3. Upgrade path: on the existing dev database (v2, with the user's weekly "Test" from Oct 29), the first load migrates to v3, posts Oct 29 and Nov 5, and shows next Nov 12. Check this on the iOS simulator if possible; otherwise report it as ❌ not checked.

## AGENTS.md updates

- **App state:**
  - Replace the "Monthly totals (Home)" monthly-equivalent rule: Home counts transactions this month + each bill's remaining occurrences this month.
  - Bills are rules (`start_date` anchor, `next_due_date` = first unposted). `postDueBills` (`src/db/recurring.ts`) posts due occurrences as transactions with `bill_id` before Home and Entries load.
  - Deleting a bill or moving it to One-time detaches its posted entries (`bill_id = NULL`).
  - Occurrence math lives only in `src/lib/recurrence.ts`.

## Result

Built as planned. Bills carry a `start_date` anchor. `postDueBills` posts each due occurrence as a transaction with `bill_id`, then moves `next_due_date` past today. It runs before Home and Entries load. Home counts transactions + remaining occurrences this month. Entries shows the real next date and tags posted rows "Recurring".

Deviations and findings:
- `deleteEntry` wraps a new non-transactional `deleteRow`, because expo-sqlite can't nest `withTransactionAsync` (`updateEntry`'s table move already runs in one).
- A `once` bill's posted entry is detached too (`bill_id = NULL`), so it reads as a plain entry, not "Recurring".
- The Recurring card's note changed from "Counted per month on Home." to "Each due date is posted as an entry below."
- Behaviour change against plan 07: a bill dated today or earlier posts at once. Converting an entry to Weekly now shows it in Recurring (next date) and posts today's occurrence in the month card.
- Not verified: the v2 → v3 upgrade on an existing database (the user's simulator). Web always starts fresh at v3.
