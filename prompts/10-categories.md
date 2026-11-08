# 10 · Categories tab

Status: done

## Goal

The Categories tab (third in the bar, today a placeholder) lists the user's income and expense categories. The user can add a category, edit one in place, and delete one along with everything logged under it.

Reference: the user's mockup (Nov 2026, web at 390 wide):
- Leafy photo hero under a scrim: white "Categories" (`heroLarge`) and the subtitle "1 category coming in, 4 categories going out." (`textWhiteSoft`). No button in the hero.
- A white Card "Add a category" (`h2`, greenAccent-style card title like Home's cards): NAME (placeholder "e.g. Groceries"), DESCRIPTION (optional) (placeholder "e.g. Rice, veggies, weekly market run"), TYPE with Expense / Income stretch pills, then a full-width "Add category" button, faded while the name is empty.
- An "Income" section (`h2` on the left, "1 category" `small` soft on the right), then a Card per category: name (`bodyStrong`), description (`small`, soft), and a pencil and trash icon on the right.
- An "Expenses" section the same way ("4 categories").
- The "Scroll for more" chip over the bottom while content is hidden.

## Decisions

### Answers from the user

- **Delete removes everything.** Trashing a category deletes its transactions and bills too, after a confirm dialog that says how many.
- **Edit inline.** The pencil turns that row into fields in place (Name, Description, Type, Cancel / Save). No sheet.
- **Type locks once used.** Expense ↔ Income can change only while the category has no transactions and no bills. Otherwise the Type chips are replaced by a note.

### Defaults picked (veto any of these)

- **Photo.** `assets/images/onboarding/05-field.jpg` (already credited; Home uses 03, Entries 04), through the shared `PhotoHero`, light status bar while focused (as Entries).
- **Subtitle.** `${n} ${n === 1 ? 'category' : 'categories'} coming in, ${m} … going out.` With no categories at all: "No categories yet. Add one below."
- **One card per category**, as in the mockup (not one Card per section like Entries). Rows sit in a `gap-2` column.
- **Order.** `sort_order, id`, as everywhere else. A new category gets `MAX(sort_order) + 1`, so it lands at the end of its section. No reordering.
- **Name rules.** Trimmed, required, `maxLength={40}`. Names are unique ignoring case (the column is `UNIQUE COLLATE NOCASE`): checked with a SELECT before writing, shown under the Name field as "You already have a category called “Needs”." Description is trimmed; empty saves `NULL`.
- **After adding**, the Name and Description clear and Type stays, so several of one type go in quickly. The new row appears in its section.
- **One row edits at a time.** Opening another row's pencil drops the first row's unsaved changes. While a row edits, its pencil and trash are hidden. Save is disabled while the name is empty; Cancel restores the row. Changing Type moves the row to the other section on save.
- **Locked type note.** "Type can’t change once it has entries." (`small`, soft) where the chips would be.
- **Delete dialog.** `Modal` titled "Delete “Needs”?". Body: "Its 12 entries and 2 recurring bills will be deleted too. This can’t be undone." (counts pluralized, parts dropped when 0; with neither: "This can’t be undone."). If it holds the starting-budget transaction, add "That includes your starting budget." Then a `destructive` "Delete category" button. Deleting runs in one transaction: transactions, bills, then the category.
- **The last category of a type can be deleted.** The entry sheet already handles none ("No expense categories yet").
- **Empty section.** A Card with "No income categories yet." / "No expense categories yet." (soft).
- **Errors.** Load failure: a Card "Couldn’t load your categories. Leave this tab and come back to try again." (red), like Entries. Add/save/delete failures: a red `small` message under that form's button ("Couldn’t save. Try again.").
- **Icons.** Add `pencil: Pencil` and `trash: Trash2` to `icons`. The icon buttons are `size-tap-target` Pressables with `active:bg-black-alpha-6 rounded-circle`, labelled "Edit Needs" / "Delete Needs".
- **Keyboard.** The scroll view gets `keyboardShouldPersistTaps="handled"` and `automaticallyAdjustKeyboardInsets` (iOS) so an inline edit near the bottom stays visible; Android is checked on device in verification (check the SDK 58 ScrollView docs before relying on it).
- **Reloads on focus** (`useFocusEffect`), like Entries, and after every write. Home and Entries already reload on focus, so renames and deletes show there.

## Out of scope

- Reordering categories, icons or colors per category, budgets/limits per category.
- Moving entries to another category on delete (the user chose delete-everything).
- Archiving instead of deleting.

## Steps

### 1. Data layer: `src/db/categories.ts`

New file, parameterized queries only (`runAsync`/`getAllAsync` with `?`).

- `ListedCategory = CategoryRow-ish { id, name, description, kind, entryCount, billCount, hasStartingBudget }`. `loadCategoryList(db)`: one SELECT with correlated subqueries counting `transactions` and `bills` per category, plus `EXISTS (… note = STARTING_BUDGET_NOTE)`, ordered `sort_order, id`.
- `CategoryInput = { name: string; description: string | null; kind: CategoryKind }`.
- `addCategory(db, input)`: throws `DuplicateCategoryNameError` if a row with that name exists (`SELECT id FROM categories WHERE name = ?`, NOCASE from the column), else inserts with `COALESCE(MAX(sort_order), -1) + 1`.
- `updateCategory(db, id, input)`: same duplicate check excluding `id`; in one transaction re-reads the counts and throws if `kind` changes while used (the UI hides it, this guards it); updates name, description, kind.
- `deleteCategory(db, id)`: `withTransactionAsync` → `DELETE FROM transactions WHERE category_id = ?`, `DELETE FROM bills WHERE category_id = ?`, `DELETE FROM categories WHERE id = ?`. Delete transactions by `category_id` (covers posted bill occurrences, since a bill's entries share its category).

Done when: typecheck passes.

### 2. Icons

Add `pencil` and `trash` to `icons` in `src/components/ui/icon.tsx`.

### 3. Screen shell: hero, add card, sections

Replace `src/app/(tabs)/categories.tsx`. Non-route parts go in `src/features/categories/`:
- `categories-hero.tsx`: `PhotoHero` with title and the count subtitle.
- `add-category-card.tsx`: Card with the `h2` title, `TextField labelPosition="above"` for Name and Description (`optionalHint="(optional)"`), a `fieldLabel` "Type" above `ChoiceChips layout="stretch"` (Expense / Income), and `Button fullWidth` "Add category" (`disabled` while the trimmed name is empty, `loading` while saving). Calls `addCategory`, shows the duplicate/failed message, calls `onChanged()`.
- `category-section.tsx`: header row (`h2` + count `small`) and the rows or the empty Card.

The screen: `View flex-1 bg-neutral-warm` → `HintScrollView className="flex-1"` (content container `pb-4`) → `PhotoHero`, then the centered column (`w-full max-w-content self-center px-3 md:px-4 lg:px-6 gap-4 pt-4`) with the add card, Income section, Expenses section. `useFocusEffect` sets the light status bar and loads `loadCategoryList`; a `reload()` is passed down. Loading shows nothing below the hero.

Done when: the screen matches the mockup on web at 390 wide with the onboarding defaults, and adding a category shows it in its section.

### 4. Category row with inline edit

`src/features/categories/category-row.tsx`: a `Card` (tight). At rest: name + description on the left (`flex-1`; name `numberOfLines={1}`, description `numberOfLines={2}`), pencil and trash on the right. Editing (`editing` prop from the screen, which holds `editingId`): Name and Description `TextField`s (`labelPosition="above"`, prefilled), Type chips or the locked note, then a row of `Button variant="outline"` "Cancel" and `Button` "Save" (each `flex-1`). Save calls `updateCategory`, then `onChanged()` and closes; duplicate and failure messages as in the add card.

Done when: renaming, editing the description and switching type (on an unused category) all save and persist across a reload; the type chips are replaced by the note on a used category.

### 5. Delete

The trash opens a `Modal` (state in the screen: the category to delete) with the copy from Decisions and a `destructive` `fullWidth` "Delete category" (`loading` while deleting). On success: close, `reload()`. On failure: red message in the dialog.

Done when: deleting a category with entries and bills removes them from Entries and Home as well.

## Verification

- `bunx expo lint` and `bunx tsc --noEmit` pass.
- Web (Playwright, 390 × 844), after onboarding with defaults: screenshot matches the mockup layout (hero, add card, both sections, scroll chip).
- Add "Groceries" (expense) → appears last under Expenses, count and subtitle update, fields clear. Add "groceries" again → duplicate message, nothing saved. Add button faded with an empty name.
- Edit: rename a category and give it a description → saved; Cancel restores; opening a second row's pencil closes the first. On a new unused category, switch Expense → Income → it moves sections. On a used one, the note shows instead of the chips.
- Delete an unused category → dialog says "This can’t be undone.", row goes. Add an entry and a recurring bill under a category, delete it → dialog counts both; afterwards Entries and Home no longer show them. Delete the category holding the starting budget → dialog mentions it.
- Delete every expense category → Expenses shows the empty Card; Add an entry on Expense shows "No expense categories yet".
- iOS simulator (Expo Go): same flows; inline edit on the last row stays above the keyboard; status bar light on this tab.

## AGENTS.md updates

- Navigation & Routing: no change (the tab already exists).
- App state: "Categories (`src/db/categories.ts`): names unique ignoring case, checked before writing; new ones go last (`MAX(sort_order) + 1`). Kind can't change once a category has transactions or bills. Deleting a category deletes its transactions and bills in one transaction (including the starting budget, if it's there)." Edited inline on the Categories tab (`src/features/categories/`).
- Design system: `icons` gains `pencil` and `trash` (mentioned only if the icon list is ever enumerated; currently it isn't).

## Result

Built as planned. `src/db/categories.ts` holds the list, add, update and delete queries. `src/features/categories/` holds the shared fields, the add card, the row with inline edit, the section, the delete dialog and a count helper. Pencil and trash icons were added to `icons`. Checked on web at 390 × 844: adding, the duplicate check (it shows the stored name), rename, Cancel, one edit at a time, switching type on an unused category, the type lock on a used one, and deleting with counts. After a delete, its entry and bill are gone from Entries. Not checked: iOS/Android (keyboard insets), and the starting-budget line in the dialog.
