import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAppTheme } from '../theme/ThemeProvider';

interface ProgressBarProps {
  current: number;
  total: number;
  style?: ViewStyle;
}

export function ProgressBar({ current, total, style }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
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
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  percentage: {
    fontSize: FONT_SIZES.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: BORDER_RADIUS.round,
  },
  stands: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
