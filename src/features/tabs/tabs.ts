import { icons, type IconName } from '@/components/ui';

/**
 * The app's tabs, in bar order. Both tab bars (app-tabs.tsx native, app-tabs.web.tsx web) render
 * this list; a new tab needs a route in src/app/(tabs)/ and an entry here.
 */
export const TABS = [
  { name: 'index', href: '/', label: 'Home', icon: icons.home, sfSelected: 'house.fill' },
  { name: 'entries', href: '/entries', label: 'Entries', icon: icons.entries, sfSelected: 'list.bullet' },
  { name: 'categories', href: '/categories', label: 'Categories', icon: icons.categories, sfSelected: 'square.grid.2x2.fill' },
  { name: 'forecast', href: '/forecast', label: 'Forecast', icon: icons.forecast, sfSelected: 'chart.line.uptrend.xyaxis' },
] as const satisfies readonly { name: string; href: string; label: string; icon: IconName; sfSelected: IconName['ios'] }[];
