const SYMBOLS: Record<string, string> = {
  USD: '$',
  SAR: 'SAR ',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AED: 'AED ',
  CAD: 'C$',
  HKD: 'HK$',
  INR: '₹',
  CNY: 'CN¥',
};

export function currencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? `${currency} `;
}

export function money(n: number | undefined | null, currency = 'USD', decimals = 2): string {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}${currencySymbol(currency)}${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function signedMoney(n: number | undefined | null, currency = 'USD', decimals = 2): string {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${sign}${currencySymbol(currency)}${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function pct(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${sign}${Math.abs(n).toFixed(decimals)}%`;
}

export function compact(n: number | undefined | null): string {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(0);
}

export function timeAgo(epochSeconds: number): string {
  const diff = Date.now() / 1000 - epochSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(epochSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function clockLabel(epochSeconds: number, range: string): string {
  const d = new Date(epochSeconds * 1000);
  if (range === '1D' || range === '1W') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function longDate(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
