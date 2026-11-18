import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/constants/theme';
import { RANGES, type Range } from '@/lib/types';

type Props = {
  value: Range;
  onChange: (r: Range) => void;
  c: AppColors;
};

export function RangePicker({ value, onChange, c }: Props) {
  return (
    <View style={styles.row}>
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            hitSlop={6}
            style={[styles.pill, active && { backgroundColor: c.cardPressed }]}>
            <Text style={[styles.label, { color: active ? c.text : c.text2, fontWeight: active ? '700' : '600' }]}>
              {r}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
