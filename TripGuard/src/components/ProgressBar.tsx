import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface ProgressBarProps {
  current: number;
  total: number;
  style?: ViewStyle;
}

export function ProgressBar({ current, total, style }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>PROGRESS</Text>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>
      <Text style={styles.stands}>
        {current} / {total} stands
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  percentage: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.accent,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.round,
  },
  stands: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
