# 02 · Onboarding (hold to unlock)

Status: done

## Goal

On first launch the user sees a full-bleed onboarding screen: the "Seed: Budget" lockup, the headline "Small amounts, planted well, grow." and a round seed button. Pressing and holding the button for 3 seconds fills a ring around it while the background crossfades from bare soil to a leafy sprout and the text fades out. At 100% the app opens the budget screen, and onboarding never shows again on that device.

## Decisions

- **Shown on first launch only.** Completion is saved on the device (`onboarded = "1"`). Later launches open `index` directly.
- **Storage:** `expo-sqlite/kv-store` on native, through its sync API (`Storage.getItemSync` / `setItemSync`), so the first render already knows the answer and there's no flash. Web uses `localStorage` in a `.web.ts` file instead, because kv-store on web needs wasm Metro config and COOP/COEP headers. The wrapper is `src/lib/onboarding.ts` / `onboarding.web.ts`.
- **Routing:** `Stack.Protected` in the root layout. `onboarding` has guard `!onboarded`; `index` has guard `onboarded`. When completion flips the guard, Expo Router redirects to `index` and drops onboarding from history (no back to it).
- **Web SSR:** the server can't read `localStorage`, so the hook returns `null` (unknown) on the server and during hydration. The root layout renders nothing until it's known, the same way it already waits for fonts.
- **Images:** 4 Unsplash photos (Unsplash License, free, no attribution required; credited anyway), downloaded once at 1080×2340 crop, JPEG q70, into `assets/images/onboarding/`. They're bundled, so the screen works offline with no load flash.
  1. `01-soil.jpg`: `photo-1613036582025-ba1d4ccb3226`, "Dark brown soil with clods and small stones", Avinash Kumar
  2. `02-breaking.jpg`: `photo-1724893973380-7204358348a6`, "A close up of small green plants growing in dirt", Nora Jane Long
  3. `03-seedling.jpg`: `photo-1712342109846-a8fcb1c883ba`, "a small green plant sprouts from the ground", Fahim mohammed jaseem
  4. `04-sprout.jpg`: `photo-1723740683543-d394ba1d4366`, "A young plant sprouts from the ground", Ksenia Pixelesse
  - Download URL: `https://images.unsplash.com/photo-<id>?fm=jpg&q=70&w=1080&h=2340&fit=crop&crop=entropy`
  - Credits go in `assets/images/onboarding/CREDITS.md` with the photo page links (`https://unsplash.com/photos/<id>`, found by the ID on unsplash.com).
- **Crossfade driven by progress, not time.** One Reanimated shared value `progress` (0 → 1). The images are stacked; layer `i` (1..3) has opacity `interpolate(progress, [(i-1)/3, i/3], [0, 1], clamp)` over layer 0, so at 0 it's bare soil and at 1 it's the leafy sprout. A `blackAlpha.a40` scrim sits over the images so white text stays readable.
- **Hold:** 3 s for a full hold. On press-in, `progress` animates linearly to 1 over `duration.hold × (1 − progress)`. On release before 1 it drains back linearly to 0 over `duration.release × progress` (drain = 800 ms from full), and holding again resumes from where it is.
- **Text fade:** the lockup, headline and subtitle share opacity `interpolate(progress, [0, 1], [1, 0])`, which matches the second screenshot (about half-faded mid-hold). The hold label below the button doesn't fade.
- **Hold label:** "Hold to unlock" at rest, "Keep holding" while pressed. `bodyStrong`, `textWhite`.
- **Button:** a white circle (`size.holdButton` = 88) holding the colored `seed-mark.svg` at 56 wide. At rest the circle has opacity `opacity.rest` (0.7). While pressed it animates to 1 over `duration.button` and scales to `scalePress` through `PressScale`.
- **Ring:** `react-native-svg` circle (`size.holdRing` = 112, stroke `size.holdRingStroke` = 4) around the button. The track is `whiteAlpha.a30` and always visible. The progress arc is `textWhite`, starts at 12 o'clock and runs clockwise. It uses `strokeDashoffset` driven by `progress` through `useAnimatedProps`. The ring sits outside the PressScale, so it doesn't shrink on press.
- **Haptics (expo-haptics):** `impactAsync(Light)` on press-in and `notificationAsync(Success)` at 100%. On web this uses the Vibration API or does nothing.
- **Completion:** when `progress` reaches 1, call back to JS with `scheduleOnRN` (react-native-worklets; check the Reanimated 4.7 docs for the current name). Fire the success haptic and call `completeOnboarding()`, which writes storage and notifies subscribers. The guard flips and the router moves to `index`. `index` uses `animation: 'fade'` so it doesn't slide in.
- **Accessibility:** the button has `accessibilityRole="button"`, label "Hold to unlock" and hint "Press and hold for 3 seconds to open Seed: Budget". It also has `accessibilityActions=[{ name: 'activate' }]`, which completes onboarding at once, so screen-reader users aren't asked to hold.
- **Lockup:** a light version of the mark (`assets/images/logo/seed-mark-light.svg`, all paths white, highlight removed) at 32 wide. Next to it, "Seed:" in `bodyStrong` + " Budget" in `body`, both `textWhite`, as nested `Text`.
- **Type:** the headline is `heroLarge` in `textWhite` (largest heading allowed on phones). The subtitle is `bodyLarge` in `textWhiteSoft`.
- **Status bar:** `light` on this screen (`expo-status-bar`). There's no header (`headerShown: false`).
- **New tokens** in `src/theme/tokens.ts`: `duration.hold: 3000`, `duration.release: 800`, `size.holdButton: 88`, `size.holdRing: 112`, `size.holdRingStroke: 4`, `size.logoMark: 32`, and a new `opacity = { disabled: 0.4, rest: 0.7 }`. PressScale switches to `opacity.disabled`.
- **Screen:** add a `transparent?: boolean` prop to `Screen` (no neutralWarm canvas), so onboarding can layer its content over the photo background and still get the safe area, gutter and max width.

## Out of scope

- A way to replay onboarding from inside the app (for testing, clear the app's storage; see Verification).
- Multi-page onboarding or collecting initial capital. Those are separate features.
- Reduced-motion variants. The animation *is* the progress indicator, so it stays.
- Splash screen and app icon artwork.

## Steps

### 1. Dependencies, tokens, Screen prop

Read first: `https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/` (kv-store section), `.../sdk/haptics/`, `.../sdk/svg/`, `.../sdk/image/` (confirm SVG support on iOS, Android and web) and `https://docs.expo.dev/router/advanced/protected/`.

- `npx expo install expo-sqlite expo-haptics react-native-svg` (the project uses npm).
- If `app.json` plugins need `expo-sqlite`, let `expo install` add it. Don't add web wasm config.
- Add the tokens listed in Decisions to `src/theme/tokens.ts`. Point `PressScale`'s disabled opacity at `opacity.disabled`.
- `Screen`: add `transparent` (background `transparent` instead of `colors.neutralWarm`).

Done when: typecheck and lint pass, and the app still starts on web.

### 2. Images and light mark

- Download the 4 photos with the URL pattern in Decisions into `assets/images/onboarding/01-soil.jpg` … `04-sprout.jpg`, and check each one by eye (it should be portrait, with the sprout roughly centered and lower half, around 150–350 KB). If a download fails or an image has clearly changed, stop and tell the user.
- Write `assets/images/onboarding/CREDITS.md` (photographer, title, Unsplash link, "Unsplash License").
- Create `assets/images/logo/seed-mark-light.svg`: a copy of `seed-mark.svg` with every fill and stroke `#ffffff` and the highlight path removed.

Done when: the 5 files exist and look right.

### 3. Onboarding state

- `src/lib/onboarding.ts` (native): read `Storage.getItemSync('onboarded') === '1'` once at module load into a module variable. Export `useOnboarded(): boolean | null` (built on `useSyncExternalStore` with a tiny listener set) and `completeOnboarding()`, which runs `setItemSync('onboarded', '1')`, updates the variable and notifies listeners.
- `src/lib/onboarding.web.ts`: the same API, using `localStorage` inside try/catch. The server snapshot is `null`. The client snapshot reads `localStorage` lazily on first access.
- `src/app/_layout.tsx`: `const onboarded = useOnboarded()`. Treat `onboarded === null` like fonts not loaded (keep the splash and return null). Inside `<Stack>`, add `<Stack.Protected guard={!onboarded}><Stack.Screen name="onboarding" options={{ headerShown: false }} /></Stack.Protected>` and `<Stack.Protected guard={onboarded}><Stack.Screen name="index" options={{ animation: 'fade' }} /></Stack.Protected>`.
- Add a placeholder `src/app/onboarding.tsx` with a button that calls `completeOnboarding()`.

Done when: a fresh web session (clear localStorage) lands on the placeholder, the button moves to `index`, and a reload stays on `index`.

### 4. HoldToUnlock component

`src/components/ui/hold-to-unlock.tsx`, a named export added to `index.ts`. It's generic, so it knows nothing about images.

- Props: `progress: SharedValue<number>` (owned by the parent, so the parent can drive the background and text from it), `onComplete: () => void`, `label?` (default "Hold to unlock"), `holdingLabel?` (default "Keep holding"), `accessibilityHint?`, and `children` (the button face).
- Layout: a centered column. A `size.holdRing` square holds the SVG ring (absolute) and, centered in it, a `PressScale` with a white `size.holdButton` circle (`radius.circle`) holding `children`. Below it, `space[3]` gap, the label in `bodyStrong` `textWhite`.
- Behavior as in Decisions: press-in → light haptic, `holding` state true, circle opacity to 1, `progress` timing to 1 (linear, remaining time). In the timing callback, if `finished && progress === 1`, `scheduleOnRN(handleComplete)`. Press-out → if not complete, drain back. `handleComplete` fires the success haptic and then `onComplete`. Guard it with a ref so it runs once.
- Ring: `Animated.createAnimatedComponent(Circle)`, `strokeDasharray = C`, `strokeDashoffset = C × (1 − progress)`, `strokeLinecap="round"`, wrapped in a view rotated `-90deg`.
- Accessibility props as in Decisions. `onAccessibilityAction` with `activate` sets `progress` to 1 and completes.

Done when: on the placeholder screen, holding fills the ring in about 3 s and calls `onComplete`, and releasing early drains it back.

### 5. Onboarding screen

`src/app/onboarding.tsx`:

- Root: `View` with flex 1 and `greenHouse` background (the fallback before images paint). Then the absolute-fill image stack: 4 `expo-image` `Image`s with `contentFit="cover"`, the top 3 wrapped in `Animated.View` with the opacity interpolation from Decisions. Then the `blackAlpha.a40` scrim. Then `<Screen transparent edges={['top', 'bottom']}>`.
- In the Screen, an `Animated.View` (text opacity) with the lockup row (light mark via `expo-image` at `size.logoMark`, `space[2]` gap, nested Text), then `space[6]` spacing, then the headline and subtitle (`space[3]` gap). A flex spacer follows, then `HoldToUnlock` with the colored `seed-mark.svg` (56 wide) as children, then bottom padding `space[9]`.
- `const progress = useSharedValue(0)`. `onComplete={completeOnboarding}`. `<StatusBar style="light" />`.
- Copy: headline "Small amounts, planted well, grow." and subtitle "Give every bit of money a place to take root, and watch your savings sprout."

Done when: it matches the two reference screenshots at 390 wide, including the at-rest state and the mid-hold state.

### 6. Close out

Run Verification, add `## Result`, set `Status: done` and apply the AGENTS.md updates.

## Verification

1. `npx tsc --noEmit`, `npx expo lint` and `npx expo-doctor` pass.
2. Web (`npx expo start --web`, 390×844, localStorage cleared): the screen loads with no hydration warnings in the console. Screenshot at rest (compare with reference 1).
3. Hold for about 1.5 s: the ring is about half full, the images have crossfaded past the seedling stage, the text is about half faded and the label reads "Keep holding". Screenshot (compare with reference 2).
4. Release at about 50%: everything drains back to bare soil in under a second. Hold again: it resumes from the current point.
5. Hold to 100%: it fades to `index`. Browser back does not return to onboarding. Reload: still `index`.
6. Clear localStorage and reload: onboarding shows again.
7. iOS simulator or Android emulator (in Expo Go: sqlite, haptics and svg are all bundled) if available. Check the same flow, that the success haptic fires on a real device, and that relaunching skips onboarding. If no simulator is available, record it as unchecked.
8. Screen reader: VoiceOver or TalkBack double-tap on the button completes onboarding. Record it as unchecked if no device is available.

## AGENTS.md updates

- Design system: add `HoldToUnlock` to the component list. Note that `Screen` takes `transparent` for full-bleed photo screens.
- New section `## App state` (after Design system):
  - Small device-local flags go through a wrapper in `src/lib/` that uses `expo-sqlite/kv-store` sync on native and `localStorage` in a `.web.ts` twin (kv-store on web needs wasm/COOP headers). On web, hooks return `null` on the server and the root layout waits.
  - Onboarding is gated with `Stack.Protected` in the root layout on `useOnboarded()`. To see it again, clear app storage.
- Bundled photos live in `assets/images/<feature>/` with a `CREDITS.md`.

## Result

Built as planned. Web (390×844, Playwright) matches both reference screenshots; iOS (Expo Go, iPhone 16 Plus simulator) renders the screen at rest. Deviations:
- **NativeWind:** plan 03 moved the design system to NativeWind while this plan was waiting for approval. The same tokens went into `src/theme/values.js` (`size.holdButton|holdRing|holdRingStroke|holdMark|logoMark`, `duration.hold|release`, `opacity.rest`); the Tailwind `opacity` scale is now generated from `values.opacity`. Static styling uses classes, and expo-image's `Image` is registered in `src/theme/interop.ts`. The photo layers keep `StyleSheet.absoluteFill` on `style` next to their animated opacity, because NativeWind can't style Reanimated views on native.
- **Reduce motion:** the fill and drain timings use `ReduceMotion.Never`. With Reanimated's default (`System`), turning on reduce motion would complete the hold the moment you press.
- **Soil photo** is 828×1794 at q50 (447 KB). At 1080 wide it was 940 KB because the texture compresses poorly. The others are 1080×2340 at q70, center crop; `crop=entropy` framed the breaking sprout badly.
- **Credits** list the CDN photo IDs, not the photo-page links: Unsplash's page slugs aren't derivable from the IDs, and its API needs a key.
- The step 3 placeholder screen was replaced in step 5; HoldToUnlock was checked on the real screen.
- **Not checked:** holding on iOS or Android (the simulator can't be driven to press and hold from the CLI), haptics on a device, and screen-reader `activate`. Web keyboard users can't hold, because react-native-web doesn't support accessibility actions.
