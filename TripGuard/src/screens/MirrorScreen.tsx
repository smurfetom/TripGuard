import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { ValueDisplay, ProgressBar, TrendSlope, EventItem, Button } from '../components';
import { useTripStore } from '../store/tripStore';

type MirrorScreenProps = {
  onClose: () => void;
  onGoToSetup?: () => void;
};

export function MirrorScreen({ onClose, onGoToSetup }: MirrorScreenProps) {
  const {
    session,
    currentExpectedTT,
    currentActualTT,
    currentDiff,
    deviationStatus,
    currentSection,
  } = useTripStore();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [currentActualTT]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Waiting for data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allEvents = session.segments.flatMap(s => s.events).slice(-10).reverse();
  const addStandEvents = allEvents.filter(e => e.type === 'ADD_STAND');

  const getStatusColor = () => {
    switch (deviationStatus) {
      case 'OK': return COLORS.success;
      case 'WARNING': return COLORS.warning;
      case 'ALARM': return COLORS.danger;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.title}>Mirror View</Text>
        <Text style={styles.updateTime}>Updated: {formatTime(lastUpdate)}</Text>
        <View style={styles.headerButtons}>
          <Button title="Close" variant="secondary" onPress={onClose} style={styles.closeButton} />
          {onGoToSetup ? (
            <Button title="Setup" variant="secondary" onPress={onGoToSetup} style={styles.closeButton} />
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.infoBar}>
          <View style={[
            styles.modeBadge,
            { backgroundColor: session.mode === 'RIH' ? COLORS.accent : COLORS.warning }
          ]}>
            <Text style={styles.modeText}>{session.mode}</Text>
          </View>
          {currentSection && (
            <Text style={styles.sectionName}>{currentSection.name}</Text>
          )}
        </View>

        <ProgressBar 
          current={session.currentStand} 
          total={session.totalStands}
          style={styles.progress}
        />

        <View style={styles.valuesRow}>
          <ValueDisplay
            label="Expected"
            value={currentExpectedTT}
            unit={session.volumeUnit}
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Actual"
            value={currentActualTT}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
          <View style={styles.diffContainer}>
            <Text style={styles.diffLabel}>DIFF</Text>
            <Text style={[styles.diffValue, { color: getStatusColor() }]}>
              {currentDiff > 0 ? '+' : ''}{currentDiff.toFixed(2)}
            </Text>
          </View>
        </View>

        {addStandEvents.length > 1 && (
          <TrendSlope
            events={allEvents}
            totalStands={session.totalStands}
            initialTT={session.initialTT}
            tolerance={session.tolerance}
            sections={session.sections}
            mode={session.mode}
            currentStand={session.currentStand}
            style={styles.trend}
          />
        )}

        <View style={styles.eventLog}>
          <Text style={styles.logTitle}>EVENT LOG</Text>
          {allEvents.length === 0 ? (
            <Text style={styles.emptyLog}>No events recorded</Text>
          ) : (
            allEvents.map((event) => (
              <EventItem 
                key={event.id} 
                event={event} 
                volumeUnit={session.volumeUnit}
              />
            ))
          )}
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Tolerance</Text>
            <Text style={styles.statusValue}>{session.tolerance}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Total Stands</Text>
            <Text style={styles.statusValue}>{session.totalStands}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Initial TT</Text>
            <Text style={styles.statusValue}>{session.initialTT.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: SPACING.sm,
    minWidth: 100,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  title: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  updateTime: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  modeText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionName: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  progress: {
    marginBottom: SPACING.lg,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  valueItem: {
    flex: 1,
  },
  diffContainer: {
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  diffValue: {
    fontSize: FONT_SIZES.headingLarge,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trend: {
    marginBottom: SPACING.lg,
  },
  eventLog: {
    marginBottom: SPACING.lg,
  },
  logTitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyLog: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
});
