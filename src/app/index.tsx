import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewsRow } from '@/components/news-row';
import { StockCard } from '@/components/stock-card';
import { useColors } from '@/constants/theme';
import type { NewsItem, Quote } from '@/lib/types';
import { useWatchlist } from '@/lib/watchlist';
import { fetchMarketNews, fetchQuote, mapLimit } from '@/lib/yahoo';

const REFRESH_MS = 60_000;

export default function WatchlistScreen() {
  const { c } = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { entries, remove, ready } = useWatchlist();

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const symbolKey = useMemo(() => entries.map((e) => e.symbol).join(','), [entries]);
  const alive = useRef(true);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current || !symbolKey) return;
    inFlight.current = true;
    const list = symbolKey.split(',');
    try {
      const results = await mapLimit(list, 4, async (symbol) => {
        try {
          return await fetchQuote(symbol);
        } catch {
          return null;
        }
      });
      if (!alive.current) return;
      const next: Record<string, Quote> = {};
      let ok = 0;
      for (const q of results) {
        if (q) {
          next[q.symbol] = q;
          ok++;
        }
      }
      setQuotes((prev) => ({ ...prev, ...next }));
      setFailed(ok === 0);
      setUpdatedAt(Math.floor(Date.now() / 1000));
    } finally {
      inFlight.current = false;
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [symbolKey]);

  useEffect(() => {
    alive.current = true;
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [load]);

  const loadNews = useCallback(() => {
    fetchMarketNews(12)
      .then((items) => {
        if (alive.current) setNews(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    loadNews();
  }, [load, loadNews]);

  const cardWidth = Math.floor((width - 16 * 2 - 12) / 2);

  const confirmRemove = (symbol: string) => {
    Alert.alert('Remove from Watchlist', `Remove ${symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(symbol) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.text2} />}>
        <View style={styles.titleRow}>
          <Text style={[styles.largeTitle, { color: c.text }]}>Stocks</Text>
          <Pressable
            onPress={() => router.push('/search')}
            hitSlop={10}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.5 }]}>
            <SymbolView name="plus" size={22} tintColor={c.accent} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/search')}
          style={({ pressed }) => [styles.search, { backgroundColor: c.field, opacity: pressed ? 0.7 : 1 }]}>
          <SymbolView name="magnifyingglass" size={16} tintColor={c.text2} />
          <Text style={[styles.searchText, { color: c.text2 }]}>Search</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Watchlist</Text>
          {updatedAt ? (
            <Text style={[styles.updated, { color: c.text3 }]}>
              {new Date(updatedAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>

        {loading && Object.keys(quotes).length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.text2} />
          </View>
        ) : null}

        {failed ? (
          <View style={[styles.banner, { backgroundColor: c.card }]}>
            <Text style={[styles.bannerTitle, { color: c.text }]}>Can’t reach market data</Text>
            <Text style={[styles.bannerBody, { color: c.text2 }]}>
              Check your connection, then pull to refresh.
            </Text>
          </View>
        ) : null}

        {ready && entries.length === 0 ? (
          <View style={[styles.banner, { backgroundColor: c.card }]}>
            <Text style={[styles.bannerTitle, { color: c.text }]}>No symbols yet</Text>
            <Text style={[styles.bannerBody, { color: c.text2 }]}>Tap + to add a stock, ETF or index.</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {entries.map((entry) => {
            const q = quotes[entry.symbol];
            return (
              <StockCard
                key={entry.symbol}
                entry={entry}
                c={c}
                width={cardWidth}
                price={q?.price}
                changePct={q?.changePct}
                spark={q?.spark}
                currency={q?.currency}
                loading={loading}
                onLongPress={() => confirmRemove(entry.symbol)}
              />
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Business News</Text>
        </View>

        {news.map((item) => (
          <NewsRow
            key={item.id}
            item={item}
            c={c}
            onPress={() => {
              if (item.link) Linking.openURL(item.link).catch(() => {});
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { padding: 4 },
  search: {
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
  },
  searchText: { fontSize: 16, marginLeft: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  updated: { fontSize: 12, paddingBottom: 3 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  center: { paddingVertical: 40, alignItems: 'center' },
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
  },
  bannerTitle: { fontSize: 15, fontWeight: '600' },
  bannerBody: { fontSize: 13, marginTop: 3 },
});
