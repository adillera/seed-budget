/**
 * Renders the native tab bar icons from Lucide SVGs (lucide-static) to template PNGs.
 * NativeTabs can't draw SVG components, so each tab gets regular + selected strokes at @1x/@2x/@3x.
 * Run with `npm run icons:tabs` after changing a tab icon; the PNGs are committed.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const values = require('../src/theme/values.js');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'assets/images/tabs');
const lucideDir = path.dirname(require.resolve('lucide-static/icons/house.svg'));

/** Keep in sync with src/features/tabs/tabs.ts. */
const TABS = [
  { file: 'home', lucide: 'house' },
  { file: 'entries', lucide: 'list' },
  { file: 'categories', lucide: 'layout-grid' },
  { file: 'forecast', lucide: 'chart-line' },
];
/** iOS tab bar glyph size in points; Android uses the same files. */
const SIZE = 25;
const VARIANTS = [
  { suffix: '', stroke: values.iconStroke.regular },
  { suffix: '-selected', stroke: values.iconStroke.selected },
];
const SCALES = [1, 2, 3];

const browser = await chromium.launch();
let count = 0;
for (const scale of SCALES) {
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: scale });
  for (const tab of TABS) {
    const raw = await readFile(path.join(lucideDir, `${tab.lucide}.svg`), 'utf8');
    for (const variant of VARIANTS) {
      // Template images: only alpha matters, the tab bar supplies the tint.
      const svg = raw
        .replace(/<!--.*?-->/s, '')
        .replace(/width="24"/, `width="${SIZE}"`)
        .replace(/height="24"/, `height="${SIZE}"`)
        .replace(/stroke="currentColor"/, 'stroke="#000"')
        .replace(/stroke-width="[^"]*"/, `stroke-width="${variant.stroke}"`);
      await page.setContent(
        `<html><body style="margin:0;background:transparent">${svg.replace('<svg', '<svg style="display:block"')}</body></html>`,
      );
      const at = scale === 1 ? '' : `@${scale}x`;
      await page.screenshot({
        path: path.join(outDir, `${tab.file}${variant.suffix}${at}.png`),
        omitBackground: true,
        clip: { x: 0, y: 0, width: SIZE, height: SIZE },
      });
      count++;
    }
  }
  await page.close();
}
await browser.close();
console.log(`Wrote ${count} PNGs to ${path.relative(root, outDir)}`);
