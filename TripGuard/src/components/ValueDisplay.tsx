import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { DeviationStatus } from '../types';

interface ValueDisplayProps {
  label: string;
  value: number;
  unit: string;
  status?: DeviationStatus;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export function ValueDisplay({
  label,
  value,
  unit,
  status,
  size = 'small',
  style,
}: ValueDisplayProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'OK':
        return COLORS.success;
      case 'WARNING':
        return COLORS.warning;
      case 'ALARM':
        return COLORS.danger;
      default:
        return COLORS.textPrimary;
    }
  };

  const valueStyle = size === 'large' ? styles.valueLarge : styles.value;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={[valueStyle, { color: status ? getStatusColor() : COLORS.textPrimary }]}>
          {value.toFixed(2)}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
  },
  valueLarge: {
    fontSize: FONT_SIZES.value,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  unit: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});
