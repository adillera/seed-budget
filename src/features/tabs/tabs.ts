import type { ImageSourcePropType } from 'react-native';

import { icons, type IconName } from '@/components/ui';

type TabImage = { default: ImageSourcePropType; selected: ImageSourcePropType };

/**
 * The app's tabs, in bar order. Both tab bars (app-tabs.tsx native, app-tabs.web.tsx web) render
 * this list; a new tab needs a route in src/app/(tabs)/, an entry here, and its icon in
 * scripts/build-tab-icons.mjs (`npm run icons:tabs`). `icon` is the Lucide component (web bar);
 * `image` is the same icon pre-rendered to template PNGs (the native bar can't draw SVG).
 */
export const TABS = [
  {
    name: 'index',
    href: '/',
    label: 'Home',
    icon: icons.home,
    image: { default: require('@/assets/images/tabs/home.png'), selected: require('@/assets/images/tabs/home-selected.png') },
  },
  {
    name: 'entries',
    href: '/entries',
    label: 'Entries',
    icon: icons.entries,
    image: { default: require('@/assets/images/tabs/entries.png'), selected: require('@/assets/images/tabs/entries-selected.png') },
  },
  {
    name: 'categories',
    href: '/categories',
    label: 'Categories',
    icon: icons.categories,
    image: {
      default: require('@/assets/images/tabs/categories.png'),
      selected: require('@/assets/images/tabs/categories-selected.png'),
    },
  },
  {
    name: 'forecast',
    href: '/forecast',
    label: 'Forecast',
    icon: icons.forecast,
    image: {
      default: require('@/assets/images/tabs/forecast.png'),
      selected: require('@/assets/images/tabs/forecast-selected.png'),
    },
  },
] as const satisfies readonly { name: string; href: string; label: string; icon: IconName; image: TabImage }[];
