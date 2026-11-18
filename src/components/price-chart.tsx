import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import type { AppColors } from '@/constants/theme';
import { clockLabel, money, pct } from '@/lib/format';
import type { Candle, Range } from '@/lib/types';

type Props = {
  candles: Candle[];
  prevClose: number;
  color: string;
  currency: string;
  range: Range;
  c: AppColors;
};

const HEIGHT = 200;
const PAD_X = 0;
const PAD_Y = 10;

function downsample(data: Candle[], target: number): Candle[] {
  if (data.length <= target) return data;
  const step = data.length / target;
  const out: Candle[] = [];
  for (let i = 0; i < target; i++) {
    const idx = Math.min(data.length - 1, Math.floor(i * step));
    out.push(data[idx]);
  }
  out[out.length - 1] = data[data.length - 1];
  return out;
}

export function PriceChart({ candles, prevClose, color, currency, range, c }: Props) {
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const widthRef = useRef(0);

  const data = useMemo(() => downsample(candles, 320), [candles]);

  const geom = useMemo(() => {
    if (!width || data.length < 2) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const k of data) {
      if (k.c < min) min = k.c;
      if (k.c > max) max = k.c;
    }
    if (prevClose > 0 && range === '1D') {
      min = Math.min(min, prevClose);
      max = Math.max(max, prevClose);
    }
    const span = max - min || Math.max(Math.abs(max) * 0.01, 1);
    const innerW = width - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;
    const step = innerW / (data.length - 1);
    const x = (i: number) => PAD_X + i * step;
    const y = (v: number) => PAD_Y + innerH * (1 - (v - min) / span);

    let line = '';
    data.forEach((k, i) => {
      line += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(k.c).toFixed(2)} `;
    });
    const area = `${line.trim()} L${x(data.length - 1).toFixed(2)},${HEIGHT} L${PAD_X.toFixed(2)},${HEIGHT} Z`;
    return { line: line.trim(), area, y, step, min, max };
  }, [data, width, prevClose, range]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const idx = Math.round((evt.nativeEvent.locationX - PAD_X) / (geom?.step || 1));
          setScrub(Math.max(0, Math.min(data.length - 1, idx)));
        },
        onPanResponderMove: (evt) => {
          const idx = Math.round((evt.nativeEvent.locationX - PAD_X) / (geom?.step || 1));
          setScrub(Math.max(0, Math.min(data.length - 1, idx)));
        },
        onPanResponderRelease: () => setScrub(null),
        onPanResponderTerminate: () => setScrub(null),
      }),
    [geom?.step, data.length],
  );

  const scrubPoint = scrub !== null && geom ? data[scrub] : null;

  const xLabels = useMemo(() => {
    if (!data.length) return [];
    const idxs = [0, Math.floor((data.length - 1) / 2), data.length - 1];
    return idxs.map((i) => clockLabel(data[i].t, range));
  }, [data, range]);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...panResponder.panHandlers}>
      {scrubPoint ? (
        <View style={styles.scrubHeader} pointerEvents="none">
          <Text style={[styles.scrubPrice, { color: c.text }]}>{money(scrubPoint.c, currency)}</Text>
          <Text style={[styles.scrubTime, { color: c.text2 }]}>
            {new Date(scrubPoint.t * 1000).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      ) : (
        <View style={styles.scrubHeader} pointerEvents="none">
          <Text style={[styles.scrubTime, { color: c.text2 }]}>
            {range === '1D' ? 'Today' : `${range} performance`}
          </Text>
        </View>
      )}

      {geom ? (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.22} />
              <Stop offset="1" stopColor={color} stopOpacity={0.01} />
            </LinearGradient>
          </Defs>

          {range === '1D' && prevClose > 0 ? (
            <Line
              x1={0}
              y1={geom.y(prevClose)}
              x2={width}
              y2={geom.y(prevClose)}
              stroke={c.text3}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ) : null}

          <Path d={geom.area} fill="url(#chartFill)" />
          <Path
            d={geom.line}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {scrub !== null ? (
            <>
              <Line
                x1={PAD_X + scrub * geom.step}
                y1={0}
                x2={PAD_X + scrub * geom.step}
                y2={HEIGHT}
                stroke={c.text3}
                strokeWidth={1}
              />
              <Line
                x1={0}
                y1={geom.y(data[scrub].c)}
                x2={width}
                y2={geom.y(data[scrub].c)}
                stroke={c.text3}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            </>
          ) : null}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}

      <View style={styles.axis}>
        {xLabels.map((l, i) => (
          <Text key={`${l}-${i}`} style={[styles.axisText, { color: c.text2 }]}>
            {l}
          </Text>
        ))}
      </View>

      {range === '1D' && prevClose > 0 ? (
        <Text style={[styles.prevClose, { color: c.text2 }]}>
          Prev close {money(prevClose, currency)} ({pct(((data[data.length - 1]?.c ?? 0) - prevClose) / (prevClose || 1) * 100)})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  scrubHeader: { paddingHorizontal: 16, paddingBottom: 6, minHeight: 22 },
  scrubPrice: { fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  scrubTime: { fontSize: 12, marginTop: 1 },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  axisText: { fontSize: 11 },
  prevClose: { fontSize: 11, paddingHorizontal: 16, marginTop: 6 },
});
