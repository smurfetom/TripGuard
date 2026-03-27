import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Event, Section } from '../types';

interface TrendSlopeProps {
  events: Event[];
  totalStands: number;
  initialTT: number;
  tolerance: number;
  sections: Section[];
  mode: 'RIH' | 'POOH';
  currentStand: number;
  style?: ViewStyle;
}

export function TrendSlope({
  events,
  totalStands,
  initialTT,
  tolerance,
  currentStand,
  style,
}: TrendSlopeProps) {
  const addStandEvents = events.filter(e => e.type === 'ADD_STAND');
  
  if (addStandEvents.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const getStatusColor = (diff: number): string => {
    const absDiff = Math.abs(diff);
    if (absDiff <= tolerance) return COLORS.success;
    if (absDiff <= tolerance * 2) return COLORS.warning;
    return COLORS.danger;
  };

  const maxVolume = Math.max(
    initialTT,
    ...addStandEvents.map(e => Math.max(e.actualTT, e.expectedTT))
  );
  const minVolume = Math.min(
    initialTT,
    ...addStandEvents.map(e => Math.min(e.actualTT, e.expectedTT))
  );
  const volumeRange = maxVolume - minVolume || 1;

  const graphHeight = 120;
  const graphWidth = 280;
  const paddingX = 10;
  const paddingY = 10;
  const innerWidth = graphWidth - paddingX * 2;
  const innerHeight = graphHeight - paddingY * 2;

  const getX = (stand: number) => {
    return paddingX + (stand / totalStands) * innerWidth;
  };

  const getY = (volume: number) => {
    return paddingY + innerHeight - ((volume - minVolume) / volumeRange) * innerHeight;
  };

  const points = addStandEvents.map(e => ({
    x: getX(e.standNumber),
    y: getY(e.actualTT),
    expectedY: getY(e.expectedTT),
    diff: e.diff,
  }));

  const lastPoint = points[points.length - 1];
  const lastDiff = lastPoint?.diff || 0;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>TREND</Text>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.textSecondary }]} />
          <Text style={styles.legendText}>Expected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getStatusColor(lastDiff) }]} />
          <Text style={styles.legendText}>Actual</Text>
        </View>
      </View>

      <View style={[styles.graph, { width: graphWidth, height: graphHeight }]}>
        <View style={styles.graphArea}>
          {points.map((point, i) => (
            <View key={i}>
              <View
                style={[
                  styles.expectedPoint,
                  {
                    left: point.x - 2,
                    top: point.expectedY - 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.actualPoint,
                  {
                    left: point.x - 3,
                    top: point.y - 3,
                    backgroundColor: getStatusColor(point.diff),
                  },
                ]}
              />
            </View>
          ))}
          
          {points.length > 1 && (
            <View style={styles.trendLine}>
              {points.slice(0, -1).map((point, i) => {
                const nextPoint = points[i + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                return (
                  <View
                    key={i}
                    style={[
                      styles.lineSegment,
                      {
                        left: point.x,
                        top: point.y,
                        width: length,
                        transform: [{ rotate: `${angle}deg` }],
                        backgroundColor: getStatusColor(point.diff),
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
          
          <View style={[styles.origin, { left: getX(0) - 3, top: getY(initialTT) - 3 }]} />
        </View>
        
        <View style={styles.axisLabels}>
          <Text style={styles.axisLabel}>0</Text>
          <Text style={styles.axisLabel}>{totalStands}</Text>
        </View>
      </View>

      <View style={styles.diffIndicator}>
        <Text style={styles.diffLabel}>Deviation:</Text>
        <Text
          style={[
            styles.diffValue,
            { color: getStatusColor(lastDiff) },
          ]}
        >
          {lastDiff > 0 ? '+' : ''}{lastDiff.toFixed(2)}
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
  },
  graphArea: {
    flex: 1,
    position: 'relative',
  },
  origin: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
  },
  expectedPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  actualPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: 'left center',
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
