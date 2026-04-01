import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useTripStore } from '../store/tripStore';

type Props = {
  onClose?: () => void;
};

export function StatusScreen({ onClose }: Props) {
  const session = useTripStore((s) => s.session);
  const isActive = session?.isActive ?? false;
  const currentStand = session?.currentStand ?? 0;
  const totalStands = session?.totalStands ?? 0;
  const currentTotalVolume = useTripStore((s) => s.currentTotalVolume);
  const currentActualTT = useTripStore((s) => s.currentActualTT);
  const currentExpectedTT = useTripStore((s) => s.currentExpectedTT);
  const deviationStatus = useTripStore((s) => s.deviationStatus);
  const currentSection = session?.currentSection?.name ?? '';
  const lastEvent = session?.segments?.flatMap((seg) => seg.events ?? [])?.slice(-1)[0];
  const progress = totalStands > 0 ? Math.min((currentStand / totalStands) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TripGuard Status</Text>
      <Text>Status: {isActive ? 'Active' : 'Idle'}</Text>
      <Text>Stand: {currentStand}/{totalStands}</Text>
      <Text>Volume: {Number.isNaN(currentTotalVolume) ? 0 : currentTotalVolume.toFixed(2)}</Text>
      <Text>TT (actual/expected): {currentActualTT ?? 0} / {currentExpectedTT}</Text>
      <Text>Deviation: {deviationStatus}</Text>
      <Text>Current Section: {currentSection || '—'}</Text>
      <Text>Progress: {progress.toFixed(0)}%</Text>
      {lastEvent && (
        <Text>Last event: {lastEvent.type} @ {new Date(lastEvent.timestamp).toLocaleTimeString()}</Text>
      )}
      <View style={styles.progressBar} />
      <View style={styles.spacer} />
      <Button title="Back to Setup" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  spacer: {
    height: 12,
  },
  progressBar: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
});

export default StatusScreen;
