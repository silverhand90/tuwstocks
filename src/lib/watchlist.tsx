import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { WatchEntry } from './types';

const STORAGE_KEY = 'tuwstocks.watchlist.v1';

export const DEFAULT_WATCHLIST: WatchEntry[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: '2222.SR', name: 'Saudi Arabian Oil Co.' },
  { symbol: '^TASI.SR', name: 'Tadawul All Shares Index' },
];

type Ctx = {
  entries: WatchEntry[];
  ready: boolean;
  has: (symbol: string) => boolean;
  add: (entry: WatchEntry) => void;
  remove: (symbol: string) => void;
  toggle: (entry: WatchEntry) => void;
};

const WatchlistContext = createContext<Ctx | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WatchEntry[]>(DEFAULT_WATCHLIST);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) setEntries(parsed);
        }
      } catch {
        // keep defaults
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: WatchEntry[]) => {
    setEntries(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback(
    (entry: WatchEntry) => {
      setEntries((cur) => {
        if (cur.some((e) => e.symbol === entry.symbol)) return cur;
        const next = [...cur, entry];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const remove = useCallback((symbol: string) => {
    setEntries((cur) => {
      const next = cur.filter((e) => e.symbol !== symbol);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggle = useCallback(
    (entry: WatchEntry) => {
      setEntries((cur) => {
        const exists = cur.some((e) => e.symbol === entry.symbol);
        const next = exists ? cur.filter((e) => e.symbol !== entry.symbol) : [...cur, entry];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const has = useCallback((symbol: string) => entries.some((e) => e.symbol === symbol), [entries]);

  const value = useMemo<Ctx>(
    () => ({ entries, ready, has, add, remove, toggle }),
    [entries, ready, has, add, remove, toggle],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): Ctx {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
