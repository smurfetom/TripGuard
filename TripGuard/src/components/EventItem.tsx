import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Event, DeviationStatus } from '../types';

interface EventItemProps {
  event: Event;
  volumeUnit: string;
}

export function EventItem({ event, volumeUnit }: EventItemProps) {
  const getTypeLabel = () => {
    switch (event.type) {
      case 'ADD_STAND':
        return `Stand ${event.standNumber}`;
      case 'SLUG':
        return `Slug +${event.slugVolume?.toFixed(2)}`;
      case 'SURFACE_RESET':
        return 'Surface Reset';
      case 'COMMENT':
        return 'Comment';
      default:
        return event.type;
    }
  };

  const getStatusColor = (diff: number): string => {
    const absDiff = Math.abs(diff);
    if (absDiff <= 0.5) return COLORS.success;
    if (absDiff <= 1) return COLORS.warning;
    return COLORS.danger;
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
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
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  comment: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
