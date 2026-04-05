import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Event } from '../types';
import { getDeviationStatus } from '../utils/calculations';
import { useAppTheme } from '../theme/ThemeProvider';

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
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
    const status = getDeviationStatus(gainLoss, tolerance);
    if (status === 'OK') return colors.success;
    if (status === 'WARNING') return colors.warning;
    return colors.danger;
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
          <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
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
          {drawSegments(calculatedPoints, colors.textSecondary)}
          {drawSegments(accumulatedPoints, colors.accent, true)}

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

      </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  graph: {
    position: 'relative',
    marginHorizontal: 'auto',
    backgroundColor: colors.background,
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
    backgroundColor: colors.border,
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
    backgroundColor: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  diffIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  diffLabel: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginRight: SPACING.sm,
  },
  diffValue: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '700',
  },
});
