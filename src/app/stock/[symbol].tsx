import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewsRow } from '@/components/news-row';
import { PriceChart } from '@/components/price-chart';
import { RangePicker } from '@/components/range-picker';
import { useColors } from '@/constants/theme';
import { compact, money, pct, signedMoney, timeAgo } from '@/lib/format';
import type { ChartSeries, NewsItem, Quote, Range } from '@/lib/types';
import { useWatchlist } from '@/lib/watchlist';
import { fetchChart, fetchNews, fetchQuote } from '@/lib/yahoo';

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const sym = String(symbol ?? '');
  const { c } = useColors();
  const insets = useSafeAreaInsets();
  const { has, toggle } = useWatchlist();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [range, setRange] = useState<Range>('1D');
  const [series, setSeries] = useState<ChartSeries | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetchQuote(sym)
      .then((q) => {
        if (alive) setQuote(q);
      })
      .catch(() => {
        if (alive) setError('Could not load this symbol.');
      });
    fetchNews(sym, 8)
      .then((n) => {
        if (alive) setNews(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sym]);

  useEffect(() => {
    let alive = true;
    setLoadingChart(true);
    fetchChart(sym, range)
      .then((s) => {
        if (alive) setSeries(s);
      })
      .catch(() => {
        if (alive) setSeries(null);
      })
      .finally(() => {
        if (alive) setLoadingChart(false);
      });
    return () => {
      alive = false;
    };
  }, [sym, range]);

  const inList = has(sym);
  const up = (quote?.changePct ?? 0) >= 0;
  const chartColor = !series?.candles?.length
    ? c.text2
    : (series.candles[series.candles.length - 1]?.c ?? 0) >= series.prevClose
      ? c.green
      : c.red;

  const stats: { label: string; value: string }[] = quote
    ? [
        { label: 'Open', value: money(quote.open, quote.currency) },
        { label: 'Prev Close', value: money(quote.prevClose, quote.currency) },
        { label: 'Day Range', value: `${money(quote.dayLow, quote.currency)} – ${money(quote.dayHigh, quote.currency)}` },
        {
          label: '52-Week Range',
          value: `${money(quote.week52Low, quote.currency)} – ${money(quote.week52High, quote.currency)}`,
        },
        { label: 'Volume', value: compact(quote.volume) },
        { label: 'Exchange', value: quote.exchange || '—' },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: sym,
          headerBackTitle: 'Stocks',
          headerRight: () => (
            <Pressable
              onPress={() => toggle({ symbol: sym, name: quote?.name ?? sym })}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.5 }}>
              <SymbolView
                name={inList ? 'star.fill' : 'star'}
                size={20}
                tintColor={inList ? c.accent : c.text2}
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.headerBlock}>
          <Text numberOfLines={1} style={[styles.name, { color: c.text }]}>
            {quote?.name ?? sym}
          </Text>
          <Text style={[styles.sub, { color: c.text2 }]}>
            {sym}
            {quote?.exchange ? ` · ${quote.exchange}` : ''}
          </Text>

          <Text style={[styles.price, { color: c.text }]}>
            {quote ? money(quote.price, quote.currency) : '—'}
          </Text>
          <View style={styles.changeRow}>
            <Text style={[styles.change, { color: up ? c.green : c.red }]}>
              {quote ? `${signedMoney(quote.change, quote.currency)} (${pct(quote.changePct)})` : '—'}
            </Text>
            {quote ? (
              <Text style={[styles.asOf, { color: c.text3 }]}>
                {timeAgo(quote.marketTime)}
              </Text>
            ) : null}
          </View>

          {quote?.extendedPrice !== undefined ? (
            <Text style={[styles.extended, { color: c.text2 }]}>
              After-hours {money(quote.extendedPrice, quote.currency)}{' '}
              <Text style={{ color: (quote.extendedChangePct ?? 0) >= 0 ? c.green : c.red }}>
                {pct(quote.extendedChangePct)}
              </Text>
            </Text>
          ) : null}
        </View>

        {loadingChart && !series ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.text2} />
          </View>
        ) : series ? (
          <PriceChart
            candles={series.candles}
            prevClose={series.prevClose}
            color={chartColor}
            currency={series.currency}
            range={range}
            c={c}
          />
        ) : (
          <View style={styles.center}>
            <Text style={{ color: c.text2, fontSize: 13 }}>
              {error ?? 'Chart unavailable'}
            </Text>
          </View>
        )}

        <RangePicker value={range} onChange={setRange} c={c} />

        {stats.length ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Key Statistics</Text>
            <View style={[styles.card, { backgroundColor: c.card }]}>
              {stats.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.statRow,
                    i < stats.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator },
                  ]}>
                  <Text style={[styles.statLabel, { color: c.text2 }]}>{row.label}</Text>
                  <Text style={[styles.statValue, { color: c.text }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {news.length ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>News</Text>
            <View style={[styles.card, { backgroundColor: c.card, paddingVertical: 4 }]}>
              {news.map((item, i) => (
                <View key={item.id}>
                  <NewsRow
                    item={item}
                    c={c}
                    onPress={() => {
                      if (item.link) Linking.openURL(item.link).catch(() => {});
                    }}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  name: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 36, fontWeight: '600', marginTop: 10, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  changeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  change: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  asOf: { fontSize: 12 },
  extended: { fontSize: 13, marginTop: 6 },
  center: { paddingVertical: 40, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, paddingTop: 26, paddingBottom: 10 },
  card: { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
