import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { size, whiteAlpha } from '@/theme';

import type { GrowthStage } from './summary';

/**
 * Monochrome LCD-style sprites (think Casio pocket game): chunky pixels in two tones of
 * translucent white over the hero photo. `#` lit, `+` dim (texture), `.` off.
 * Every sprite is 14 × 10; drawn at size.growthAvatarWidth × growthAvatarHeight (7 per pixel).
 */
const TONES = { '#': whiteAlpha.a60, '+': whiteAlpha.a30 } as const;

/** The mound every stage grows out of (bottom four rows, as in the design mockup). */
const MOUND = [
  '.....####.....',
  '....##+###....',
  '..###+###+##..',
  '###+###+###+##',
];

/** The six rows above the mound, per stage. */
const PLANTS: Record<GrowthStage, string[]> = {
  0: [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  1: [
    '..............',
    '..............',
    '..............',
    '.....#...#....',
    '......#.#.....',
    '.......#......',
  ],
  2: [
    '..............',
    '.......##.....',
    '....##.#......',
    '.....+##......',
    '.......#.##...',
    '.......##+....',
  ],
  // Sapling and tree: trunks in the dim tone so wood reads apart from leaves and soil.
  3: [
    '..............',
    '......##......',
    '.....####.....',
    '.....#+##.....',
    '......++......',
    '......++......',
  ],
  4: [
    '.....####.....',
    '...###+####...',
    '..##+####+##..',
    '...####+###...',
    '......++......',
    '......++......',
  ],
};

const SPRITE_W = MOUND[0].length;
const SPRITE_H = PLANTS[0].length + MOUND.length;

type Run = { x: number; y: number; w: number; fill: string };

/** One rect per horizontal run of same-tone pixels. */
function toRuns(rows: string[]): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch === '#' || ch === '+') runs.push({ x, y, w: end - x, fill: TONES[ch] });
      x = end;
    }
  });
  return runs;
}

const SPRITES = Object.fromEntries(
  ([0, 1, 2, 3, 4] as const).map((s) => [s, toRuns([...PLANTS[s], ...MOUND])]),
) as Record<GrowthStage, Run[]>;

const STAGE_NAMES: Record<GrowthStage, string> = {
  0: 'a mound of soil',
  1: 'a sprout',
  2: 'a seedling',
  3: 'a sapling',
  4: 'a tree',
};

export type GrowthAvatarProps = {
  stage: GrowthStage;
  /** Whole percent of this month's income left, for the accessibility label. */
  keptPercent: number;
};

/** LCD-style plant that grows from a mound to a tree with the share of income kept. */
export function GrowthAvatar({ stage, keptPercent }: GrowthAvatarProps) {
  const label =
    stage === 0
      ? 'Your seed is a mound of soil: nothing left from this month’s income yet'
      : `Your seed is ${STAGE_NAMES[stage]}: you kept ${keptPercent}% of this month’s income`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg
        width={size.growthAvatarWidth}
        height={size.growthAvatarHeight}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}>
        {SPRITES[stage].map((r, i) => (
          <Rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
      </Svg>
    </View>
  );
}
