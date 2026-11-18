import type { Candle, ChartSeries, NewsItem, Quote, Range, SearchResult } from './types';

const HOSTS = ['https://query2.finance.yahoo.com', 'https://query1.finance.yahoo.com'];

const RANGE_PARAMS: Record<Range, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '2Y': { range: '2y', interval: '1d' },
};

async function yGet(path: string): Promise<any> {
  let lastError: unknown = null;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        lastError = new Error(`Yahoo returned ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network error');
}

function parseCandles(result: any): Candle[] {
  const ts: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0] ?? {};
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i];
    if (typeof c !== 'number' || !isFinite(c)) continue;
    out.push({
      t: ts[i],
      c,
      o: typeof q.open?.[i] === 'number' ? q.open[i] : null,
      h: typeof q.high?.[i] === 'number' ? q.high[i] : null,
      l: typeof q.low?.[i] === 'number' ? q.low[i] : null,
      v: typeof q.volume?.[i] === 'number' ? q.volume[i] : null,
    });
  }
  return out;
}

/** Keep only points inside the current regular session (falls back to all points). */
function regularSessionOnly(candles: Candle[], meta: any): Candle[] {
  const start = meta?.currentTradingPeriod?.regular?.start;
  const end = meta?.currentTradingPeriod?.regular?.end;
  if (typeof start !== 'number' || typeof end !== 'number') return candles;
  const filtered = candles.filter((k) => k.t >= start && k.t <= end);
  return filtered.length > 1 ? filtered : candles;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const p = RANGE_PARAMS['1D'];
  const json = await yGet(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${p.range}&interval=${p.interval}&includePrePost=true`,
  );
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(json?.chart?.error?.description ?? `No quote for ${symbol}`);
  }
  const m = result.meta ?? {};
  const candles = parseCandles(result);
  const prevClose: number = m.chartPreviousClose ?? m.previousClose ?? candles[0]?.c ?? 0;
  const price: number = m.regularMarketPrice ?? candles[candles.length - 1]?.c ?? 0;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  const dayCandles = regularSessionOnly(candles, m);
  const dayHigh =
    m.regularMarketDayHigh ?? (dayCandles.length ? Math.max(...dayCandles.map((k) => k.c)) : undefined);
  const dayLow =
    m.regularMarketDayLow ?? (dayCandles.length ? Math.min(...dayCandles.map((k) => k.c)) : undefined);

  const extendedPrice: number | undefined =
    typeof m.fulldayPrice === 'number' && Math.abs(m.fulldayPrice - price) > 0.0001
      ? m.fulldayPrice
      : undefined;

  return {
    symbol: m.symbol ?? symbol,
    name: m.shortName ?? m.longName ?? symbol,
    price,
    change,
    changePct,
    prevClose,
    extendedPrice,
    extendedChange: extendedPrice !== undefined ? m.fulldayChange : undefined,
    extendedChangePct: extendedPrice !== undefined ? m.fulldayChangePercent : undefined,
    dayHigh,
    dayLow,
    open: dayCandles[0]?.o ?? dayCandles[0]?.c,
    volume: m.regularMarketVolume,
    week52High: m.fiftyTwoWeekHigh,
    week52Low: m.fiftyTwoWeekLow,
    currency: m.currency ?? 'USD',
    exchange: m.fullExchangeName ?? m.exchangeName ?? '',
    marketTime: m.regularMarketTime ?? Math.floor(Date.now() / 1000),
    spark: dayCandles.map((k) => k.c),
    candles,
  };
}

export async function fetchChart(symbol: string, range: Range): Promise<ChartSeries> {
  const p = RANGE_PARAMS[range];
  const json = await yGet(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${p.range}&interval=${p.interval}`,
  );
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(json?.chart?.error?.description ?? `No chart for ${symbol}`);
  const m = result.meta ?? {};
  const candles = parseCandles(result);
  return {
    symbol: m.symbol ?? symbol,
    range,
    candles,
    prevClose: m.chartPreviousClose ?? candles[0]?.c ?? 0,
    currency: m.currency ?? 'USD',
  };
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const json = await yGet(
    `/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false`,
  );
  const quotes: any[] = json?.quotes ?? [];
  const allowed = new Set(['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND', 'CRYPTOCURRENCY', 'CURRENCY', 'FUTURE']);
  return quotes
    .filter((r) => allowed.has(r.quoteType))
    .map((r) => ({
      symbol: r.symbol,
      name: r.shortname ?? r.longname ?? r.symbol,
      exchange: r.exchDisp ?? r.exchange ?? '',
      type: r.typeDisp ?? r.quoteType ?? '',
    }));
}

function mapNews(items: any[]): NewsItem[] {
  return items
    .filter((n) => n?.title && n?.link)
    .map((n) => {
      const thumbs = n.thumbnail?.resolutions ?? [];
      const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : undefined;
      return {
        id: String(n.uuid ?? n.link),
        title: String(n.title),
        publisher: String(n.publisher ?? ''),
        link: String(n.link),
        publishedAt: Number(n.providerPublishTime ?? 0),
        thumbnail: thumb,
      };
    });
}

export async function fetchNews(symbol: string, count = 8): Promise<NewsItem[]> {
  const json = await yGet(
    `/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=${count}&listsCount=0`,
  );
  return mapNews(json?.news ?? []);
}

export async function fetchMarketNews(count = 12): Promise<NewsItem[]> {
  const json = await yGet(
    `/v1/finance/search?q=${encodeURIComponent('stock market')}&quotesCount=0&newsCount=${count}&listsCount=0`,
  );
  return mapNews(json?.news ?? []);
}

/** Small concurrency-limited map so a 15-symbol refresh doesn't fire 15 requests at once. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}
