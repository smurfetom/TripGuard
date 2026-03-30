import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { ValueDisplay, ProgressBar, TrendSlope, EventItem, Button } from '../components';
import { useTripStore } from '../store/tripStore';
import { useAppTheme } from '../theme/ThemeProvider';

type MirrorScreenProps = {
  onClose: () => void;
  onGoToSetup?: () => void;
};

export function MirrorScreen({ onClose, onGoToSetup }: MirrorScreenProps) {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const {
    session,
    currentObservedVolume,
    currentTotalVolume,
    currentDisplayStand,
    calculatedCumulativeVolume,
    actualCumulativeVolume,
    gainLossVolume,
    deviationStatus,
    currentSection,
  } = useTripStore();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [currentObservedVolume, currentTotalVolume]);

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
      case 'OK': return colors.success;
      case 'WARNING': return colors.warning;
      case 'ALARM': return colors.danger;
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
            { backgroundColor: session.mode === 'RIH' ? colors.accent : colors.warning }
          ]}>
            <Text style={styles.modeText}>{session.mode}</Text>
          </View>
          {currentSection && (
            <Text style={styles.sectionName}>{currentSection.name}</Text>
          )}
        </View>

        <View style={styles.tripMetaRow}>
          <Text style={styles.tripMetaText}>Current Stand: {currentDisplayStand}</Text>
          <Text style={styles.tripMetaText}>Logging: every {session.loggingInterval}</Text>
        </View>

        <ProgressBar 
          current={session.currentStand} 
          total={session.totalStands}
          style={styles.progress}
        />

        <View style={styles.valuesRow}>
          <ValueDisplay
            label="Calculated Volume"
            value={calculatedCumulativeVolume}
            unit={session.volumeUnit}
            size="large"
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Accumulated Volume"
            value={actualCumulativeVolume}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Gain / Loss"
            value={gainLossVolume}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
        </View>

        <View style={styles.volumeGrid}>
          <ValueDisplay
            label="Observed Volume"
            value={currentObservedVolume}
            unit={session.volumeUnit}
            style={styles.volumeItem}
          />
          <ValueDisplay
            label="Total Volume"
            value={currentTotalVolume}
            unit={session.volumeUnit}
            style={styles.volumeItem}
          />
        </View>

        {addStandEvents.length > 1 && (
          <TrendSlope
            events={allEvents}
            totalStands={session.totalStands}
            tolerance={session.tolerance}
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
                tolerance={session.tolerance}
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  title: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  updateTime: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
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
    color: colors.white,
  },
  sectionName: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginLeft: SPACING.sm,
  },
  progress: {
    marginBottom: SPACING.lg,
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tripMetaText: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
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
  trend: {
    marginBottom: SPACING.lg,
  },
  volumeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  volumeItem: {
    width: '48%',
  },
  eventLog: {
    marginBottom: SPACING.lg,
  },
  logTitle: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyLog: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: SPACING.xs,
  },
});
