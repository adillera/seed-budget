/**
 * Renders the app icon, Android adaptive icon layers, splash image and web favicon from the logo mark
 * (assets/images/logo/seed-mark.svg and its light twin). Colors come from src/theme/values.js.
 * Run with `npm run icons:app` after changing the logo; the PNGs are committed.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { colors } = require('../src/theme/values.js');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = (name) => path.join(root, 'assets/images', name);
const mark = await readFile(path.join(root, 'assets/images/logo/seed-mark.svg'), 'utf8');
const markLight = await readFile(path.join(root, 'assets/images/logo/seed-mark-light.svg'), 'utf8');

/**
 * `markWidth` is the mark's share of the canvas width. Android adaptive layers keep the mark inside
 * the 66% safe circle; the iOS icon has to fill the square with an opaque background.
 */
const TARGETS = [
  { file: 'icon.png', size: 1024, svg: mark, markWidth: 0.7, background: colors.neutralWarm },
  { file: 'android-icon-foreground.png', size: 1024, svg: mark, markWidth: 0.5 },
  { file: 'android-icon-monochrome.png', size: 1024, svg: markLight, markWidth: 0.5 },
  { file: 'splash-icon.png', size: 1024, svg: mark, markWidth: 1 },
  { file: 'favicon.png', size: 48, svg: mark, markWidth: 0.96 },
];

const browser = await chromium.launch();
for (const t of TARGETS) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  const svg = t.svg.replace(/<!--.*?-->/gs, '');
  await page.setContent(`<html><body style="margin:0;background:${t.background ?? 'transparent'}">
    <div style="width:${t.size}px;height:${t.size}px;display:flex;align-items:center;justify-content:center">
      ${svg.replace('<svg', `<svg style="display:block;width:${t.markWidth * 100}%;height:auto"`)}
    </div></body></html>`);
  await page.screenshot({
    path: out(t.file),
    omitBackground: !t.background,
    clip: { x: 0, y: 0, width: t.size, height: t.size },
  });
  await page.close();
}
await browser.close();
console.log(`Wrote ${TARGETS.length} icons to assets/images/`);
