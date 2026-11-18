import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sparkline } from '@/components/sparkline';
import type { AppColors } from '@/constants/theme';
import { money, pct } from '@/lib/format';
import type { WatchEntry } from '@/lib/types';

type Props = {
  entry: WatchEntry;
  c: AppColors;
  width: number;
  price?: number;
  changePct?: number;
  spark?: number[];
  currency?: string;
  loading?: boolean;
  onLongPress?: () => void;
};

export function StockCard({ entry, c, width, price, changePct, spark, currency = 'USD', loading, onLongPress }: Props) {
  const up = (changePct ?? 0) >= 0;
  const lineColor = changePct === undefined ? c.text3 : up ? c.green : c.red;
  const hasData = price !== undefined && changePct !== undefined;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: entry.symbol } })}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: pressed ? c.cardPressed : c.card },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Text numberOfLines={1} style={[styles.symbol, { color: c.text }]}>
            {entry.symbol}
          </Text>
          <Text numberOfLines={1} style={[styles.name, { color: c.text2 }]}>
            {entry.name}
          </Text>
        </View>
        <View style={styles.right}>
          <Text numberOfLines={1} style={[styles.price, { color: c.text }]}>
            {hasData ? money(price, currency) : '—'}
          </Text>
          <View style={[styles.pill, { backgroundColor: hasData ? (up ? c.green : c.red) : c.cardPressed }]}>
            <Text style={[styles.pillText, { color: hasData ? c.pillText : c.text3 }]}>
              {hasData ? pct(changePct) : loading ? '···' : '—'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.chart}>
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} color={lineColor} width={width - 24} height={46} id={entry.symbol} />
        ) : (
          <View style={{ height: 46 }} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: { flex: 1, paddingRight: 8 },
  right: { alignItems: 'flex-end' },
  symbol: { fontSize: 17, fontWeight: '600', letterSpacing: 0.2 },
  name: { fontSize: 12, marginTop: 1 },
  price: { fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  pill: {
    marginTop: 5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    minWidth: 62,
    alignItems: 'center',
  },
  pillText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  chart: { marginTop: 10 },
});
