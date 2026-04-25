import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAppTheme } from '../theme/ThemeProvider';

interface ProgressBarProps {
  current: number;
  total: number;
  gainLoss?: number;
  status?: 'OK' | 'WARNING' | 'ALARM';
  style?: ViewStyle;
}

export function ProgressBar({ current, total, gainLoss, status, style }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  const getStatusColor = () => {
    if (!status) return colors.textPrimary;
    switch (status) {
      case 'OK': return colors.success;
      case 'WARNING': return colors.warning;
      case 'ALARM': return colors.danger;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>PROGRESS</Text>
        <View style={styles.statusRow}>
          {gainLoss !== undefined && (
            <Text style={[styles.gainLoss, { color: getStatusColor() }]}>
              {gainLoss > 0 ? '+' : ''}{gainLoss.toFixed(2)}
            </Text>
          )}
          <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gainLoss: {
    fontSize: FONT_SIZES.caption,
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
