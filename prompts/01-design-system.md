# 01 · Design system

Status: done

> Styling engine replaced by NativeWind in `03-nativewind.md`; tokens unchanged (now in `src/theme/values.js`, font classes `font-manrope*`/`font-lora`).

## Goal

The app has one design system, taken from the Café Verde design reference: tokens for color, type, spacing, radius, elevation and motion; bundled Manrope and Lora fonts; and 13 core components. Every new screen and component is built from it. The Expo starter screens are restyled onto it, so the app runs and shows the new look.

## Decisions

- Source: the Café Verde design reference (4 images in the conversation that created this plan). Every value it needs is copied into the **Token reference** below, so the images aren't needed to build this.
- Scope: all tokens and type styles, plus 13 components: Button, FloatButton, Card, Modal, TextField, SelectField, Stepper, Checkbox, Accordion, SubNav, BackLink, FeatureBand, DropdownMenu. Supporting pieces: Text, Screen, Icon, PressScale.
- Left out because they're coffee-shop specific: FeedbackTab, GiftCardTile, TierCard, PartnerCard, ConsentBanner, GlobalNav, SizeSelector, CostPill, DescriptionBand, NutritionTable, StoreSelector, Breadcrumb.
- Light theme only. `app.json` sets `userInterfaceStyle: "light"`. All dark-mode code goes (the `Colors.dark` palette, `useColorScheme` branching, `DarkTheme`).
- Fonts: Manrope (400, 600, 700) and Lora (400) from `@expo-google-fonts/manrope` and `@expo-google-fonts/lora`. They load at runtime through `useFonts` in map form, so the app keeps working in Expo Go and on web. Kalam is dropped.
- Each weight is its own family name (`Manrope_400Regular`, `Manrope_600SemiBold`, `Manrope_700Bold`, `Lora_400Regular`). Type styles set `fontFamily` and never `fontWeight`, because custom fonts don't switch faces through `fontWeight` on Android.
- The splash screen stays up until fonts load, so text never shows in the fallback font.
- Token names keep the reference names in camelCase: `green-brand` becomes `colors.greenBrand`, `space-3` becomes `space[3]`.
- React Native has no `px`/`em`. Line heights become absolute numbers (font size × ratio, rounded). `-0.01em` letter spacing becomes `-0.01 × font size`.
- Shadows use the React Native `boxShadow` style string (supported on the New Architecture in RN 0.88), copied from the reference.
- Icons: `expo-symbols` `SymbolView` with `{ ios, android, web }` names, wrapped in one `Icon` component. No icon library is added.
- Tokens live in `src/theme/`; components live in `src/components/ui/`, one per file, kebab-case file names, named exports.
- Press feedback: every pressable button scales to `scalePress` (0.95) over `durationButton` with Reanimated, through a shared `PressScale` component.
- Phone type scale: `display` and `jumbo` are for widths ≥ 768 only. On phones the largest heading is `heroLarge`.
- Tap targets: Button `md` is at least 48 tall and `sm` is 36 tall with `hitSlop` up to 44. The reference doesn't give heights, so these are my defaults.
- Disabled state: opacity 0.4 and no press scale. The reference doesn't define it, so this is a default.
- Added a `destructive` Button variant (red fill, white label), because the reference reserves red for "destructive actions" and a budget app deletes things.
- Verification uses a temporary `src/app/_dev-design-system.tsx` route that's deleted before close-out. There's no permanent gallery (you chose restyle in place).

## Out of scope

- The 12 left-out components listed above.
- Dark mode.
- App icon, splash image and splash background color (they're still the Expo artwork).
- Embedding fonts with the `expo-font` config plugin. It needs a dev build, so we can move to it later for a faster first launch.
- Any budget features (income, expenses, forecast).

## Token reference

### Colors (`src/theme/colors.ts`)

| Token | Value | Use |
|---|---|---|
| greenBrand | `#006241` | h1 headings, primary section headers, the single brand signal. 7.4:1 on white, 6.5:1 on neutralWarm |
| greenAccent | `#00754a` | Primary CTA fill, outline button text/border, link text, selected ring, focus ring on light. White on it 5.8:1. Never on greenHouse (2.2:1) |
| greenHouse | `#1e3932` | Dark bands (FeatureBand). Pair with textWhite / textWhiteSoft |
| greenUplift | `#2b5148` | Decorative accents and details on dark bands (divider on greenHouse, pressed on dark) |
| greenLight | `#d4e9e2` | Pale mint utility surface |
| gold | `#cba258` | Not used by v1 components (reserved for a future status/achievement callout). As text only on greenHouse (5.3:1); never as text on white (2.4:1) |
| goldLight | `#dfc49d` | Reserved, as above |
| goldLightest | `#faf6ee` | Reserved: cream-gold wash |
| white | `#ffffff` | Card, modal surface; inverse button fill on greenHouse |
| neutralCool | `#f9f9f9` | DropdownMenu, quiet containers |
| neutralWarm | `#f2f0eb` | THE page canvas. Use instead of pure white for screens |
| ceramic | `#edebe9` | Zone separators, soft section washes |
| black | `#000000` | Black filled button only |
| textBlack | `rgba(0, 0, 0, 0.87)` | Primary text on white, neutralWarm, ceramic, neutralCool. Never pure black text |
| textBlackSoft | `rgba(0, 0, 0, 0.58)` | Secondary text and metadata |
| textWhite | `#ffffff` | Primary text on greenHouse, greenAccent, greenBrand |
| textWhiteSoft | `rgba(255, 255, 255, 0.7)` | Secondary text on greenHouse |
| red | `#c82014` | Error and destructive. Always paired with a message, never color alone |
| yellow | `#fbbc05` | Warning fills. Never text on light; pair with textBlack |
| inputBorder | `#d6dbde` | Resting border of SelectField, Stepper, TextField. 1.4:1 on white, so fields also rely on their label and the greenAccent focus border |
| hairline | `#e7e7e7` | 1px row divider |
| validTint | `hsla(160, 32%, 87%, 0.33)` | Valid TextField background |
| invalidTint | `hsla(4, 82%, 43%, 0.05)` | Invalid TextField background |
| focusRing | = greenAccent | 2px focus outline on light grounds; textWhite on greenHouse |

Alpha scales, as objects:
- `blackAlpha` keys `a06 a10 a20 a30 a40 a50 a60 a70 a80 a90` = `rgba(0,0,0,0.06)` … `rgba(0,0,0,0.9)`. For overlays and scrims on light surfaces.
- `whiteAlpha` keys `a10 a20 … a90` = `rgba(255,255,255,0.1)` … `0.9`. For translucent fills on dark green.

Leave out `loyaltyGreen` and `consentGreen` (their components aren't built).

### Typography (`src/theme/typography.ts`)

`fonts = { sans: { regular: 'Manrope_400Regular', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold' }, serif: { regular: 'Lora_400Regular' } }`

| Style | Font | Size / lineHeight | letterSpacing | Notes |
|---|---|---|---|---|
| display | sans semibold | 80 / 96 | -0.16 | One per screen, ≥768 wide only |
| jumbo | sans semibold | 58 / 70 | -0.16 | ≥768 wide only |
| heroLarge | sans semibold | 45 / 54 | -0.16 | Largest heading on phones |
| h1 | sans semibold | 24 / 36 | -0.16 | Primary heading, color greenBrand |
| h2 | sans regular | 24 / 36 | -0.16 | Section title, textBlack. Weight and color carry the hierarchy, not size |
| bandTitle | sans bold | 32 / 38 | -0.16 | Uppercase, textWhite on greenHouse (the reference's product-title) |
| bodyLarge | sans regular | 19 / 33 | -0.16 | Intro copy, FeatureBand body |
| body | sans regular | 16 / 24 | -0.16 | Default copy |
| small | sans regular | 14 / 21 | -0.14 | Metadata, helper text |
| micro | sans regular | 13 / 20 | -0.13 | Captions, active floating label, footnotes |
| buttonLabel | sans semibold | 16 / 19 | -0.16 | Pill labels |
| buttonLabelSm | sans semibold | 14 / 17 | -0.14 | Small buttons |
| fieldLabel | sans bold | 13 / 20 | 0.325 | Uppercase SelectField label |
| editorial | serif regular | 45 / 54 | 0 | Occasional editorial headline (reference: loyalty-headline). Never in data-entry flows |

Export `type` as a `StyleSheet.create` object. `textTransform: 'uppercase'` goes inside `bandTitle` and `fieldLabel`.

### Spacing, radius, elevation, sizes, motion (`src/theme/tokens.ts`)

- `space`: `{1:4, 2:8, 3:16, 4:24, 5:32, 6:40, 7:48, 8:56, 9:64}`. space[3] is the default card padding, phone gutter and sibling gap. space[4] is section inner spacing and modal padding. space[5] is between sections. space[7] is section to section.
- `gutter`: `{ sm: 16, md: 24, lg: 40 }` for widths `<768`, `768–1023` and `≥1024`. Export `useGutter()` built on `useWindowDimensions`.
- `breakpoints`: `{ sm: 480, md: 768, lg: 1024, xl: 1440 }`.
- `radius`: `{ field: 4, card: 12, pill: 50, circle: 9999 }`. Field is for SelectField and TextField. Card is for cards, modals and panels. Pill is for every button, no exceptions. Circle is for FloatButton, Stepper buttons and avatars.
- `shadow`, as boxShadow strings:
  - `card`: `0 0 0.5px 0 rgba(0,0,0,0.14), 0 1px 1px 0 rgba(0,0,0,0.24)`
  - `nav`: `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)`
  - `float`: `0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)`
  - `floatActive`: `0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0)`
- `size`: `{ maxContent: 720, float: 56, floatMini: 40, stepperButton: 32 }`. maxContent is column-lg, the reading width on tablets and web.
- `duration` (ms): `{ button: 200, icon: 200, image: 300, expander: 300, base: 400 }`.
- `easing`: `expander = Easing.bezier(0.25, 0.46, 0.45, 0.94)` and `option = Easing.bezier(0.32, 2.32, 0.61, 0.27)`, from `react-native-reanimated`.
- `scalePress = 0.95`.

`src/theme/index.ts` re-exports everything.

## Steps

### 1. Tokens, fonts and light-only theme

Read: `https://docs.expo.dev/versions/v58.0.0/sdk/font/` and `https://docs.expo.dev/develop/user-interface/fonts/`.

- `npx expo install @expo-google-fonts/manrope @expo-google-fonts/lora` (the project uses npm; there's no bun.lock).
- Create `src/theme/colors.ts`, `typography.ts`, `tokens.ts` and `index.ts` exactly as in the Token reference.
- Create `src/theme/fonts.ts` with `useAppFonts()`. It calls `useFonts({ Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Lora_400Regular })` and returns `[loaded, error]`.
- `src/app/_layout.tsx`: call `useAppFonts()`. Return `null` until fonts load or fail, then call `SplashScreen.hideAsync()` (check `src/components/animated-icon.tsx` first; if the overlay already hides the splash, gate the overlay on `loaded` instead of hiding twice). Replace `DarkTheme`/`DefaultTheme` switching with one navigation theme built from `DefaultTheme`: `background: neutralWarm`, `card: white`, `text: textBlack`, `primary: greenAccent`, `border: hairline`. Its `fonts` map to the Manrope families.
- `app.json`: `userInterfaceStyle` becomes `"light"`.
- Keep `src/constants/theme.ts` for now, so the app still compiles.

Done when: typecheck passes and the app starts on web with no font warnings.

### 2. Primitives, and the starter screens moved onto them

- `src/components/ui/text.tsx`: `Text` with props `variant?: keyof typeof type` (default `body`) and `color?: ColorToken` (default `textBlack`; `h1` defaults to `greenBrand`). It forwards all `TextProps`.
- `src/components/ui/screen.tsx`: `Screen` gives the neutralWarm canvas, safe-area insets (top by default, `edges` prop), the horizontal gutter from `useGutter()`, and content centered at `size.maxContent`. A `scroll` prop wraps the content in a `ScrollView`.
- `src/components/ui/icon.tsx`: `Icon` with props `name: { ios, android, web }`, `size` (default 24) and `color` (default textBlack), wrapping `SymbolView`.
- `src/components/ui/press-scale.tsx`: `PressScale`, a `Pressable` whose content animates to `scalePress` on press-in and back on press-out (`withTiming`, `duration.button`). Props: all Pressable props plus `disabled`, which sets opacity 0.4 and turns off the scale.
- Move `index.tsx`, `explore.tsx`, `app-tabs.tsx`, `app-tabs.web.tsx`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx` and `animated-icon*.tsx` onto `Text` and the tokens. Use the neutralWarm canvas, white cards with `shadow.card`, `h1` greenBrand titles and textBlackSoft secondary text. Native tabs use `backgroundColor: white`, `indicatorColor: greenLight` and selected label greenAccent. Code snippets go on a `ceramic` chip with `radius.field`.
- Delete `src/constants/theme.ts`, `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx` and `src/global.css` (its font variables are replaced). Fix every import.

Done when: typecheck and lint pass, and both tabs render in the new style on web.

### 3. Actions: Button, FloatButton

- `button.tsx`: `Button` with props `children` (label), `variant` (`primary` | `outline` | `black` | `darkOutline` | `inverse` | `outlineInverse` | `destructive`, default `primary`), `size` (`md` | `sm`), `icon?` (Icon name), `fullWidth?`, `disabled?`, `loading?` and `onPress`. Built on PressScale. Pill radius, 1px border, padding horizontal space[4] (md) or space[3] (sm), min height 48 / 36.
  - Variant colors: primary = greenAccent fill, white label. outline = transparent, greenAccent border and label. black = black fill, white label. darkOutline = transparent, textBlack border and label. inverse = white fill, greenAccent label. outlineInverse = transparent, white border and label. destructive = red fill, white label.
  - Rules in JSDoc: inverse and outlineInverse only on greenHouse; never primary on greenHouse; no shadows or square corners on buttons.
  - `accessibilityRole="button"`; `loading` shows an `ActivityIndicator` in the label color.
- `float-button.tsx`: `FloatButton` with props `label` (accessibility label, required), `icon` (default plus), `size` (`md` 56 | `mini` 40), `onPress` and `fixed?`. `fixed` pins it bottom-right, offset by space[3] plus the safe-area inset (plus the tab bar inset when inside tabs). greenAccent fill, white icon, `shadow.float`. On press it scales to 0.95 and switches to `shadow.floatActive`. `hitSlop` 8. Only one per screen.

Done when: all variants render on the temp route (see Verification) and pressing visibly scales.

### 4. Surfaces: Card, Modal, FeatureBand, DropdownMenu

- `card.tsx`: `Card` with `children`, `tight?` (padding space[3] instead of space[4]), `style` and an optional `onPress` (wraps it in PressScale). White, `radius.card`, `shadow.card`. Rule: place cards on neutralWarm with a space[3] gap; separate content with whitespace, not dividers.
- `modal.tsx`: `Modal` with `open`, `onClose`, `title` and `children`. Uses RN `Modal` (`transparent`, `animationType="fade"`), a blackAlpha.a50 scrim (pressing it calls `onClose`), and a white `radius.card` panel with space[4] padding and top padding 88. A close button (Icon `xmark`/`close`, 44 tap target) sits at the top right. The title uses `h1`. Rule: every modal has a title and one primary action.
- `feature-band.tsx`: `FeatureBand` with `title`, `body?`, `actions?` (ReactNode, meant for an inverse + outlineInverse pair) and `media?` (ReactNode). greenHouse background, title in `h1` style with textWhite, body in `bodyLarge` textWhiteSoft, padding space[5]. Below 768 the media stacks first; at 768 and above it's a 60/40 row with the media on the right in a greenUplift slot.
- `dropdown-menu.tsx`: `DropdownMenu` with `items: (string | { label, value?, destructive? })[]` and `onSelect(item, index)`. A neutralCool surface, `radius.card`, no border. Each item is 24px text (`h2` style) in textBlack (red if destructive), with vertical padding space[2] and pressed background blackAlpha.a06.

### 5. Forms: TextField, SelectField, Stepper, Checkbox

- `text-field.tsx`: `TextField` with `label`, `value`/`defaultValue`, `onChangeText`, `state?` (`valid` | `invalid`), `message?`, and all other `TextInputProps` passed through. White fill, 1px inputBorder, `radius.field`, min height 56. The floating label is 16 (`body`) when empty and unfocused. It animates to 13 (`micro`) at the top on focus or when filled, over `duration.button`. Border goes greenAccent 2px on focus. valid uses a validTint fill, greenAccent border and a textBlackSoft message. invalid uses an invalidTint fill, red border and a red message. The message always shows with a state; color never carries the state alone. `accessibilityLabel` = label, `accessibilityHint` = message.
- `stepper.tsx`: `Stepper` with `value`/`defaultValue`, `min`, `max`, `step` (default 1), `onChange` and `label` (appended to button names: "Decrease {label}"). Two 32px circle buttons with a 1px inputBorder and textBlack minus/plus icons, the count between them in `body` semibold. A button is disabled at the bound. `hitSlop` up to 44.
- `select-field.tsx`: `SelectField` with `label`, `options: { label, value }[]`, `value`/`defaultValue`, `onChange` and `stepper?` (Stepper props; when set it replaces the chevron and the row shows `label` text on the left). It's an outlined row: 1px inputBorder, `radius.field`, min height 48. The `fieldLabel` sits on the top border on a white notch. The value is centered with a chevron on the right. Pressing it opens the `Modal` titled with the label, listing the options as a `DropdownMenu`; picking one calls `onChange` and closes. Rule: stack SelectFields with a space[3] gap.
- `checkbox.tsx`: `Checkbox` with `label`, `checked`/`defaultChecked` and `onChange`. A 24px box, 2px textBlack border, 4px radius. Checked fills greenAccent with a white check that springs in (scale 0 → 1, `easing.option`, `duration.button`). The whole row is pressable, with `accessibilityRole="checkbox"` and `accessibilityState={{ checked }}`.

### 6. Navigation and content: SubNav, BackLink, Accordion

- `sub-nav.tsx`: `SubNav` with `items: { label, value }[]`, `value` and `onChange` (controlled; it isn't tied to routes). A horizontal scrolling tab row, height 48. Labels are `small` semibold. The current tab is greenBrand with a 2px greenAccent underline; others are textBlackSoft. A hairline sits along the bottom. `accessibilityRole="tab"`, `accessibilityState={{ selected }}`.
- `back-link.tsx`: `BackLink` with `children` (default "Back"), and `href` or `onPress` (default `router.back()`). A chevron plus the label in greenAccent, 14 bold. Use it instead of breadcrumbs on deep sub-screens.
- `accordion.tsx`: `Accordion` with `items: { title, body: ReactNode }[]` and `defaultOpen?` (index). One panel is open at a time. The header row has the title in `body` semibold and a chevron that rotates over `duration.icon`. The panel animates height over `duration.expander` with `easing.expander`. Rows are separated by a 1px blackAlpha.a10 rule. Replaces `src/components/ui/collapsible.tsx`; delete it and move `explore.tsx` onto Accordion.

### 7. AGENTS.md

Apply the edits in **AGENTS.md updates**, keeping the file under 150 lines.

## Verification

1. `npx tsc --noEmit` and `npx expo lint` pass with no errors.
2. `npx expo-doctor` reports no new problems.
3. Create the temporary `src/app/_dev-design-system.tsx` showing: every color swatch, every type style, and every component in each variant and state (Button × 7 variants × 2 sizes plus disabled and loading; TextField empty, filled, valid, invalid; SelectField with options and with a stepper; Modal open; Accordion; SubNav; FeatureBand; DropdownMenu; Card; FloatButton fixed). Run `npx expo start --web`, open it at a phone width (390) and at 1024, and take screenshots.
4. Check by hand on web: Manrope renders (not system font), buttons scale on press, the TextField label floats on focus, the Checkbox mark springs, the Accordion opens one panel at a time, SelectField opens the modal and updates, Stepper stops at min/max, and the FloatButton clears the tab bar.
5. Start on an iOS simulator or Android emulator if one is available. If not, record it as unchecked.
6. Delete the temp route. End to end: both starter tabs render on the neutralWarm canvas in Manrope with the new components, with no dark mode when the system is dark, and lint and typecheck pass again.

## AGENTS.md updates

Add a new section `## Design system` after `## Navigation & Routing`:

```md
## Design system

All UI uses the design system in `src/theme/` (tokens) and `src/components/ui/` (components). It comes from the Café Verde design reference; the full token table and component rules are in `prompts/01-design-system.md`.

- Never hard-code a color, font, font size, spacing, radius, shadow or duration. Import it from `@/theme`. If a value is missing, add a token first.
- Before building UI, check `src/components/ui/` for an existing component: Text, Screen, Icon, PressScale, Button, FloatButton, Card, Modal, TextField, SelectField, Stepper, Checkbox, Accordion, SubNav, BackLink, FeatureBand, DropdownMenu. Extend one before making a new one; new shared components go there too.
- Light theme only. Screens sit on `neutralWarm` (via `Screen`), content goes in white `Card`s, and dark bands use `greenHouse` with `textWhite`/`textWhiteSoft`.
- Text always goes through `Text` with a `variant`. Fonts are Manrope (400/600/700) and Lora 400, one family name per weight. Set `fontFamily`, never `fontWeight`. On phones the biggest heading is `heroLarge`.
- Text is `textBlack`/`textBlackSoft`, never pure black. `greenAccent` is for actions and links and never goes on `greenHouse`. `red` is for errors and destructive actions, always with a message.
- Every button is a pill that scales to 0.95 on press, with no shadows. One `FloatButton` per screen at most.
- Spacing comes from the `space` scale; `space[3]` (16) is the default padding, phone gutter and gap.
- Icons go through `Icon` (expo-symbols) with ios, android and web names.
```

This replaces nothing in AGENTS.md (there are no styling rules yet).

## Result

Built as planned, with these deviations:
- Before building, `reset-project` had removed the starter tabs and components and moved them to the gitignored `example/`. Step 2's migration therefore covered only `src/app/_layout.tsx` and `src/app/index.tsx`. `example/` is excluded from `tsconfig.json` and `eslint.config.js`.
- Added the `bodyStrong` and `smallStrong` type styles (semibold body/small), so components never use `fontWeight`.
- Added `useWindowWidth()` (built on `useSyncExternalStore`, 0 on the server). `useWindowDimensions` caused web hydration mismatches because `web.output` is `server`.
- Accessibility state uses `aria-*` props, because react-native-web ignores `accessibilityState`.
- Shared values are written with `.set()` to satisfy the React Compiler lint rule.
- FeatureBand has square edges (full-width band, as in the reference).
- The temp check route was `src/app/dev-design-system.tsx`; it was deleted after verification.
- `npx expo lint` added `eslint` and `eslint-config-expo` and created `eslint.config.js` on first run.
