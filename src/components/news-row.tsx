import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/constants/theme';
import { timeAgo } from '@/lib/format';
import type { NewsItem } from '@/lib/types';

type Props = {
  item: NewsItem;
  c: AppColors;
  onPress?: () => void;
  showThumb?: boolean;
};

export function NewsRow({ item, c, onPress, showThumb = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.cardPressed }]}>
      <View style={styles.body}>
        <Text style={[styles.source, { color: c.text2 }]}>
          {item.publisher}
          {item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ''}
        </Text>
        <Text numberOfLines={3} style={[styles.title, { color: c.text }]}>
          {item.title}
        </Text>
      </View>
      {showThumb && item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumb} contentFit="cover" transition={200} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: { flex: 1, paddingRight: 12 },
  source: { fontSize: 12, marginBottom: 3 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  thumb: { width: 74, height: 74, borderRadius: 10, backgroundColor: '#2C2C2E' },
});
