import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Event } from '../types';
import { getDeviationStatus } from '../utils/calculations';
import { useAppTheme } from '../theme/ThemeProvider';

interface EventItemProps {
  event: Event;
  volumeUnit: string;
  tolerance: number;
}

export function EventItem({ event, volumeUnit, tolerance }: EventItemProps) {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const getTypeLabel = () => {
    switch (event.type) {
      case 'ADD_STAND':
        return `Stand ${event.standNumber}`;
      case 'SLUG':
        return `Slug +${event.slugVolume?.toFixed(2)}`;
      case 'SURFACE_RESET':
        return event.resetType === 'EMPTY_FILL_TT' ? 'Empty / Fill TT' : 'Surface Reset';
      case 'COMMENT':
        return 'Comment';
      default:
        return event.type;
    }
  };

  const getStatusColor = (diff: number): string => {
    const status = getDeviationStatus(diff, tolerance);
    if (status === 'OK') return colors.success;
    if (status === 'WARNING') return colors.warning;
    return colors.danger;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.type}>{getTypeLabel()}</Text>
        <Text style={styles.time}>{formatTime(event.timestamp)}</Text>
      </View>
      
      {(event.type === 'COMMENT' || event.type === 'SURFACE_RESET') && event.comment && (
        <Text style={styles.comment}>{event.comment}</Text>
      )}
      
      <View style={styles.values}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Observed</Text>
          <Text style={styles.value}>{event.observedVolume?.toFixed(2) ?? '--'}</Text>
        </View>

        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Accum.</Text>
          <Text style={styles.value}>{event.actualCumulativeVolume?.toFixed(2) ?? '--'}</Text>
        </View>
        
        {event.type !== 'COMMENT' && (
          <>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Calc.</Text>
              <Text style={styles.value}>{event.calculatedCumulativeVolume?.toFixed(2) ?? '--'}</Text>
            </View>
            
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Gain/Loss</Text>
              <Text style={[styles.value, { color: getStatusColor(event.gainLossVolume ?? 0) }]}> 
                {(event.gainLossVolume ?? 0) > 0 ? '+' : ''}{(event.gainLossVolume ?? 0).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  type: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
  },
  comment: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
