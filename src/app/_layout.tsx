import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { WatchlistProvider } from '@/lib/watchlist';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WatchlistProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="stock/[symbol]"
            options={{
              headerBackTitle: 'Stocks',
              headerLargeTitle: false,
              title: '',
            }}
          />
          <Stack.Screen name="search" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </WatchlistProvider>
    </ThemeProvider>
  );
}
