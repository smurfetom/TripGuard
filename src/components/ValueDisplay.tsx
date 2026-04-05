import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants/theme';
import { DeviationStatus } from '../types';
import { useAppTheme } from '../theme/ThemeProvider';

interface ValueDisplayProps {
  label: string;
  value: number;
  unit: string;
  status?: DeviationStatus;
  size?: 'small' | 'large';
  style?: ViewStyle;
  valueColor?: string;
}

export function ValueDisplay({
  label,
  value,
  unit,
  status,
  size = 'small',
  style,
  valueColor,
}: ValueDisplayProps) {
  const { colors } = useAppTheme();
  const getStatusColor = () => {
    switch (status) {
      case 'OK':
        return colors.success;
      case 'WARNING':
        return colors.warning;
      case 'ALARM':
        return colors.danger;
      default:
        return colors.textPrimary;
    }
  };

  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const valueStyle = size === 'large' ? styles.valueLarge : styles.value;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={[valueStyle, { color: valueColor || (status ? getStatusColor() : colors.success) }]}>
          {value.toFixed(2)}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  valueLarge: {
    fontSize: FONT_SIZES.value,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  unit: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
    marginLeft: SPACING.xs,
  },
});
