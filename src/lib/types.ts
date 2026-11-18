export type Range = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y';

export const RANGES: Range[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y'];

export type Candle = {
  t: number; // epoch seconds
  c: number; // close
  o: number | null;
  h: number | null;
  l: number | null;
  v: number | null;
};

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  /** Price including pre/post market when available */
  extendedPrice?: number;
  extendedChange?: number;
  extendedChangePct?: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  volume?: number;
  week52High?: number;
  week52Low?: number;
  currency: string;
  exchange: string;
  marketTime: number;
  spark: number[];
  candles: Candle[];
};

export type ChartSeries = {
  symbol: string;
  range: Range;
  candles: Candle[];
  prevClose: number;
  currency: string;
};

export type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail?: string;
};

export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

export type WatchEntry = {
  symbol: string;
  name: string;
};
