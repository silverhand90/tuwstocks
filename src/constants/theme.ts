/**
 * App palette — modelled on the Apple Stocks app (system grays, green/red pills).
 */

import { Platform, useColorScheme } from 'react-native';

export const Colors = {
  light: {
    bg: '#F2F2F7',
    card: '#FFFFFF',
    cardPressed: '#E9E9EE',
    text: '#000000',
    text2: '#8A8A8E',
    text3: '#AEAEB2',
    separator: '#E3E3E8',
    green: '#34C759',
    red: '#FF3B30',
    accent: '#007AFF',
    field: '#E9E9EB',
    pillText: '#FFFFFF',
    // legacy aliases kept for the unused template components
    background: '#F2F2F7',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#8A8A8E',
  },
  dark: {
    bg: '#000000',
    card: '#1C1C1E',
    cardPressed: '#2C2C2E',
    text: '#FFFFFF',
    text2: '#8E8E93',
    text3: '#636366',
    separator: '#2C2C2E',
    green: '#30D158',
    red: '#FF453A',
    accent: '#0A84FF',
    field: '#1C1C1E',
    pillText: '#FFFFFF',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#8E8E93',
  },
} as const;

export type AppColors = { [K in keyof (typeof Colors)['light']]: string };
export type ThemeColor = keyof (typeof Colors)['light'];

export function useColors(): { c: AppColors; scheme: 'light' | 'dark' } {
  const s = useColorScheme();
  const scheme = s === 'dark' ? 'dark' : 'light';
  return { c: Colors[scheme], scheme };
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
