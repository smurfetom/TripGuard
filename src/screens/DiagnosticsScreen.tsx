import React from 'react';
import { ScrollView, Text, StyleSheet, Button } from 'react-native';
import { useTripStore } from '../store/tripStore';

type Props = {
  onClose?: () => void;
};

export function DiagnosticsScreen({ onClose }: Props) {
  const session = useTripStore((s) => s.session);
  const isActive = session?.isActive ?? false;
  const currentStand = session?.currentStand ?? 0;
  const totalStands = session?.totalStands ?? 0;
  const currentTotalVolume = useTripStore((s) => s.currentTotalVolume);
  const currentActualTT = useTripStore((s) => s.currentActualTT);
  const currentExpectedTT = useTripStore((s) => s.currentExpectedTT);
  const deviationStatus = useTripStore((s) => s.deviationStatus);
  const currentSection = session?.currentSection?.name ?? '';
  const progress = totalStands > 0 ? Math.min((currentStand / totalStands) * 100, 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnostics</Text>
      <Text>Status: {isActive ? 'Active' : 'Idle'}</Text>
      <Text>Stand: {currentStand}/{totalStands}</Text>
      <Text>Volume: {Number.isFinite(currentTotalVolume) ? currentTotalVolume.toFixed(2) : '0.00'}</Text>
      <Text>TT: {currentActualTT ?? 0} / {currentExpectedTT}</Text>
      <Text>Deviation: {deviationStatus}</Text>
      <Text>Current Section: {currentSection || '—'}</Text>
      <Text>Progress: {progress.toFixed(0)}%</Text>
      {onClose && <Button title="Back" onPress={onClose} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
});

export default DiagnosticsScreen;
