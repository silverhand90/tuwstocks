import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/theme';
import type { SearchResult } from '@/lib/types';
import { useWatchlist } from '@/lib/watchlist';
import { searchSymbols } from '@/lib/yahoo';

export default function SearchScreen() {
  const { c } = useColors();
  const insets = useSafeAreaInsets();
  const { add, has } = useWatchlist();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let alive = true;
    const t = setTimeout(() => {
      searchSymbols(q)
        .then((r) => {
          if (!alive) return;
          setResults(r);
          setError(null);
        })
        .catch(() => {
          if (!alive) return;
          setResults([]);
          setError('Search failed — check your connection.');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 280);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={styles.headerRow}>
        <View style={[styles.field, { backgroundColor: c.field }]}>
          <SymbolView name="magnifyingglass" size={16} tintColor={c.text2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search symbols or companies"
            placeholderTextColor={c.text2}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: c.text }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <SymbolView name="xmark.circle.fill" size={16} tintColor={c.text3} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.cancel}>
          <Text style={{ color: c.accent, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.text2} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.center}>
          <Text style={{ color: c.text2, fontSize: 14 }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.symbol}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: c.separator, marginLeft: 16 }]} />
        )}
        ListEmptyComponent={
          !loading && query.trim() && !error ? (
            <View style={styles.center}>
              <Text style={{ color: c.text2, fontSize: 14 }}>No matches</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const inList = has(item.symbol);
          return (
            <Pressable
              onPress={() => {
                if (!inList) add({ symbol: item.symbol, name: item.name });
                router.replace({ pathname: '/stock/[symbol]', params: { symbol: item.symbol } });
              }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.cardPressed }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.symbol, { color: c.text }]}>{item.symbol}</Text>
                <Text numberOfLines={1} style={[styles.name, { color: c.text2 }]}>
                  {item.name}
                </Text>
              </View>
              <Text style={[styles.exchange, { color: c.text2 }]}>{item.exchange}</Text>
              <SymbolView
                name={inList ? 'checkmark.circle.fill' : 'plus.circle'}
                size={20}
                tintColor={inList ? c.green : c.accent}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  cancel: { paddingVertical: 4 },
  center: { paddingVertical: 40, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  symbol: { fontSize: 17, fontWeight: '600' },
  name: { fontSize: 13, marginTop: 2 },
  exchange: { fontSize: 12 },
  sep: { height: StyleSheet.hairlineWidth },
});
