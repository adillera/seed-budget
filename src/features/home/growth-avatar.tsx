import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { pixel, size, type PixelColor } from '@/theme';

import type { GrowthStage } from './summary';

/**
 * Sprite grid in pixels; drawn at size.growthAvatarWidth × growthAvatarHeight, a whole 3 units per
 * pixel, so rect edges land on device pixels and stay crisp.
 */
const GRID = { w: 32, h: 20 };

/** [x, y, width, height, color] on the sprite grid. Later rects paint over earlier ones. */
type Block = [number, number, number, number, PixelColor];

/** The soil mound every stage grows out of (rows 15–19). */
const MOUND: Block[] = [
  [11, 15, 10, 1, 'soilLight'],
  [8, 16, 16, 1, 'soil'],
  [9, 16, 4, 1, 'soilLight'],
  [6, 17, 20, 1, 'soil'],
  [7, 17, 2, 1, 'soilLight'],
  [23, 17, 3, 1, 'soilDark'],
  [4, 18, 24, 1, 'soil'],
  [22, 18, 6, 1, 'soilDark'],
  [2, 19, 28, 1, 'soilDark'],
];

const PLANTS: Record<GrowthStage, Block[]> = {
  // Mound only.
  0: [],
  // Sprout: a short stem with two leaves.
  1: [
    [15, 12, 1, 3, 'stem'],
    [13, 12, 2, 1, 'leaf'],
    [12, 11, 2, 1, 'leaf'],
    [16, 12, 2, 1, 'leafLight'],
    [17, 11, 2, 1, 'leafLight'],
  ],
  // Seedling: taller stem, two pairs of leaves and a bud.
  2: [
    [15, 6, 1, 9, 'stem'],
    [11, 11, 4, 1, 'leaf'],
    [10, 10, 3, 1, 'leaf'],
    [12, 12, 3, 1, 'leafDark'],
    [16, 9, 4, 1, 'leafLight'],
    [18, 8, 3, 1, 'leafLight'],
    [16, 10, 3, 1, 'leaf'],
    [14, 5, 3, 2, 'leaf'],
    [15, 4, 1, 1, 'leafLight'],
  ],
  // Sapling: woody stem and a small crown.
  3: [
    [15, 6, 2, 9, 'trunk'],
    [17, 10, 2, 1, 'trunk'],
    [19, 9, 2, 1, 'leafLight'],
    [12, 11, 3, 1, 'leafDark'],
    [11, 2, 10, 4, 'leaf'],
    [12, 1, 8, 1, 'leaf'],
    [13, 0, 6, 1, 'leafLight'],
    [12, 2, 4, 1, 'leafLight'],
    [11, 5, 10, 1, 'leafDark'],
    [18, 4, 3, 1, 'leafDark'],
  ],
  // Tree: thick trunk with roots and a full crown.
  4: [
    [14, 8, 4, 7, 'trunk'],
    [13, 14, 1, 1, 'trunk'],
    [18, 14, 1, 1, 'trunk'],
    [17, 9, 1, 6, 'soilDark'],
    [10, 0, 12, 1, 'leaf'],
    [8, 1, 16, 2, 'leaf'],
    [6, 3, 20, 5, 'leaf'],
    [7, 8, 18, 1, 'leafDark'],
    [9, 9, 14, 1, 'leafDark'],
    [10, 1, 6, 2, 'leafLight'],
    [8, 3, 4, 2, 'leafLight'],
    [14, 4, 3, 1, 'leafLight'],
    [20, 5, 6, 3, 'leafDark'],
    [6, 6, 3, 2, 'leafDark'],
  ],
};

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

/** 16-bit style plant that grows from a mound to a tree with the share of income kept. */
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
        viewBox={`0 0 ${GRID.w} ${GRID.h}`}>
        {[...MOUND, ...PLANTS[stage]].map(([x, y, w, h, c], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} fill={pixel[c]} />
        ))}
      </Svg>
    </View>
  );
}
