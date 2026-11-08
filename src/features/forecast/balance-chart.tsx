import { useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, Path, Rect } from 'react-native-svg';

import { Card, Text } from '@/components/ui';
import { formatShortDate } from '@/lib/dates';
import { useMoney } from '@/lib/currency';
import { colors, size } from '@/theme';

import type { ForecastPoint } from './forecast';

const HEIGHT = size.chartHeight;
/** Room above the top and below the bottom value, so their axis labels center on them. */
const PAD_Y = 10;
/** Room left and right for the selected dot. */
const PAD_X = size.chartDotSelected / 2 + 2;
/** Draw every node's dot only when they're at least this far apart. */
const MIN_DOT_GAP = size.chartDot;

export type BalanceChartProps = { points: ForecastPoint[]; days: number };

/** Scales for the plot: x by index, y by balance, always including 0. */
function scales(points: ForecastPoint[], width: number) {
  const values = points.map((p) => p.balanceCents);
  const min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (max === min) max = min + 100;
  const step = points.length > 1 ? (width - PAD_X * 2) / (points.length - 1) : 0;
  const x = (i: number) => (points.length > 1 ? PAD_X + i * step : width / 2);
  const y = (cents: number) => PAD_Y + ((max - cents) / (max - min)) * (HEIGHT - PAD_Y * 2);
  return { x, y, min, max, step };
}

/** Index of the node nearest to `px` (chart-local x). */
function nearestIndex(px: number, count: number, step: number) {
  if (count <= 1 || step <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round((px - PAD_X) / step)));
}

const toneOf = (cents: number) => (cents < 0 ? colors.red : colors.greenAccent);

/**
 * "Balance over time": a line of the running balance, red below the dashed zero line, with a
 * readout of the selected node. Tap or drag anywhere on the plot to select the nearest node.
 * Remount (key) when the points change, so the selection resets to the last node.
 */
export function BalanceChart({ points, days }: BalanceChartProps) {
  const { format: formatMoney, formatCompact: formatMoneyCompact } = useMoney();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(points.length - 1);
  const point = points[selected] ?? points[points.length - 1];

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { x, y, min, max, step } = scales(points, width);
  const zeroY = y(0);
  const select = (e: GestureResponderEvent) => setSelected(nearestIndex(e.nativeEvent.locationX, points.length, step));
  const stepBy = (n: number) => setSelected((i) => Math.min(points.length - 1, Math.max(0, i + n)));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(p.balanceCents)}`).join(' ');
  const showAllDots = step >= MIN_DOT_GAP;
  const readout = point ? `${point.label}, ${formatMoney(point.balanceCents)}` : '';

  return (
    <Card>
      <View className="border-b border-b-hairline pb-2">
        <Text variant="h1" accessibilityRole="header">
          Balance over time
        </Text>
      </View>

      {point && (
        <View className="flex-row items-center gap-2" accessibilityLiveRegion="polite">
          <View className="flex-1">
            <Text variant="small" color="textBlackSoft">
              {point.label}
            </Text>
            <Text variant="h2">{formatMoney(point.balanceCents)}</Text>
          </View>
          <Text variant="small" color={point.balanceCents < 0 ? 'red' : 'greenBrand'}>
            {point.balanceCents < 0 ? 'Below zero' : 'In the green'}
          </Text>
        </View>
      )}

      <View className="flex-row gap-2">
        <View
          className="flex-1 h-chart-height"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Balance over time, ${days} ${days === 1 ? 'day' : 'days'}, ends at ${formatMoney(points[points.length - 1]?.balanceCents ?? 0)}`}
          accessibilityValue={{ text: readout }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
          {width > 0 && (
            <Svg width={width} height={HEIGHT} pointerEvents="none">
              <Defs>
                <ClipPath id="forecast-above">
                  <Rect x={0} y={0} width={width} height={zeroY} />
                </ClipPath>
                <ClipPath id="forecast-below">
                  <Rect x={0} y={zeroY} width={width} height={HEIGHT - zeroY} />
                </ClipPath>
              </Defs>
              <Line
                x1={0}
                x2={width}
                y1={zeroY}
                y2={zeroY}
                stroke={colors.inputBorder}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {point && (
                <Line
                  x1={x(selected)}
                  x2={x(selected)}
                  y1={0}
                  y2={HEIGHT}
                  stroke={colors.hairline}
                  strokeWidth={1}
                />
              )}
              <Path
                d={path}
                stroke={colors.greenAccent}
                strokeWidth={size.chartLine}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
                clipPath="url(#forecast-above)"
              />
              <Path
                d={path}
                stroke={colors.red}
                strokeWidth={size.chartLine}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
                clipPath="url(#forecast-below)"
              />
              {showAllDots &&
                points.map((p, i) => (
                  <Circle
                    key={p.date}
                    cx={x(i)}
                    cy={y(p.balanceCents)}
                    r={size.chartDot / 2}
                    fill={toneOf(p.balanceCents)}
                  />
                ))}
              {point && (
                <Circle
                  cx={x(selected)}
                  cy={y(point.balanceCents)}
                  r={size.chartDotSelected / 2}
                  fill={toneOf(point.balanceCents)}
                  stroke={colors.white}
                  strokeWidth={2}
                />
              )}
            </Svg>
          )}
          {/* Touch layer on top, so locationX is always relative to the whole plot. */}
          <View
            className="absolute inset-0"
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={select}
            onResponderMove={select}
            onResponderTerminationRequest={() => true}
          />
        </View>
        <View className="h-chart-height justify-between items-end" pointerEvents="none">
          <Text variant="micro" color="textBlackSoft">
            {formatMoneyCompact(max)}
          </Text>
          <Text variant="micro" color="textBlackSoft">
            {formatMoneyCompact(min)}
          </Text>
        </View>
      </View>

      {points.length > 0 && (
        <View className="flex-row justify-between" pointerEvents="none">
          <Text variant="micro" color="textBlackSoft">
            {formatShortDate(points[0].date)}
          </Text>
          <Text variant="micro" color="textBlackSoft">
            {formatShortDate(points[points.length - 1].date)}
          </Text>
        </View>
      )}
    </Card>
  );
}
