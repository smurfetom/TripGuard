import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Event } from '../types';

interface TrendSlopeProps {
  events: Event[];
  totalStands: number;
  tolerance: number;
  currentStand: number;
  style?: ViewStyle;
}

export function TrendSlope({
  events,
  totalStands,
  tolerance,
  currentStand,
  style,
}: TrendSlopeProps) {
  const addStandEvents = events.filter((event) => event.type === 'ADD_STAND');

  if (addStandEvents.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.emptyText}>No logged volumes yet</Text>
      </View>
    );
  }

  const values = addStandEvents.flatMap((event) => [
    event.calculatedCumulativeVolume ?? 0,
    event.actualCumulativeVolume ?? 0,
  ]);
  const maxValue = Math.max(0, ...values);
  const minValue = Math.min(0, ...values);
  const range = maxValue - minValue || 1;
  const graphHeight = 140;
  const graphWidth = 280;
  const paddingX = 12;
  const paddingY = 16;
  const innerWidth = graphWidth - paddingX * 2;
  const innerHeight = graphHeight - paddingY * 2;

  const getStatusColor = (gainLoss: number) => {
    const absDiff = Math.abs(gainLoss);
    if (absDiff <= tolerance) return COLORS.success;
    if (absDiff <= tolerance * 2) return COLORS.warning;
    return COLORS.danger;
  };

  const getX = (progressedStands: number) => paddingX + (progressedStands / Math.max(totalStands, 1)) * innerWidth;
  const getY = (volume: number) => paddingY + innerHeight - ((volume - minValue) / range) * innerHeight;

  const calculatedPoints = addStandEvents.map((event) => ({
    x: getX(event.progressedStands ?? 0),
    y: getY(event.calculatedCumulativeVolume ?? 0),
  }));

  const accumulatedPoints = addStandEvents.map((event) => ({
    x: getX(event.progressedStands ?? 0),
    y: getY(event.actualCumulativeVolume ?? 0),
    gainLoss: event.gainLossVolume ?? 0,
  }));

  const drawSegments = (
    points: Array<{ x: number; y: number; gainLoss?: number }>,
    color: string,
    dynamicColor = false
  ) => points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return (
      <View
        key={`${color}-${index}`}
        style={[
          styles.segment,
          {
            left: point.x,
            top: point.y,
            width: length,
            transform: [{ rotate: `${angle}deg` }],
            backgroundColor: dynamicColor ? getStatusColor(point.gainLoss ?? 0) : color,
          },
        ]}
      />
    );
  });

  const lastGainLoss = addStandEvents[addStandEvents.length - 1]?.gainLossVolume ?? 0;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>CALCULATED VS ACCUMULATED</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.textSecondary }]} />
          <Text style={styles.legendText}>Calculated</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getStatusColor(lastGainLoss) }]} />
          <Text style={styles.legendText}>Accumulated</Text>
        </View>
      </View>

      <View style={[styles.graph, { width: graphWidth, height: graphHeight }]}>
        <View style={[styles.zeroLine, { top: getY(0) }]} />
        <View style={styles.graphArea}>
          {drawSegments(calculatedPoints, COLORS.textSecondary)}
          {drawSegments(accumulatedPoints, COLORS.accent, true)}

          {calculatedPoints.map((point, index) => (
            <View key={`calc-${index}`} style={[styles.calculatedPoint, { left: point.x - 2, top: point.y - 2 }]} />
          ))}

          {accumulatedPoints.map((point, index) => (
            <View
              key={`acc-${index}`}
              style={[
                styles.accumulatedPoint,
                {
                  left: point.x - 3,
                  top: point.y - 3,
                  backgroundColor: getStatusColor(point.gainLoss),
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.axisLabels}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisLabel}>{currentStand}</Text>
          <Text style={styles.axisLabel}>{totalStands}</Text>
        </View>
      </View>

      <View style={styles.diffIndicator}>
        <Text style={styles.diffLabel}>Current Gain / Loss:</Text>
        <Text style={[styles.diffValue, { color: getStatusColor(lastGainLoss) }]}>
          {lastGainLoss > 0 ? '+' : ''}{lastGainLoss.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  graph: {
    position: 'relative',
    marginHorizontal: 'auto',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  graphArea: {
    flex: 1,
    position: 'relative',
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  segment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  calculatedPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
  },
  accumulatedPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  axisLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  diffIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  diffLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  diffValue: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '700',
  },
});
