import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SetupScreen, DrillerScreen, MirrorScreen } from '../screens';
import { COLORS } from '../constants/theme';
import { useTripStore } from '../store/tripStore';

type ScreenName = 'Setup' | 'Driller' | 'Mirror';

export function AppNavigator() {
  const restoreSession = useTripStore((state) => state.restoreSession);
  const session = useTripStore((state) => state.session);
  const isLoading = useTripStore((state) => state.isLoading);
  const clearCurrentSession = useTripStore((state) => state.clearCurrentSession);
  const [screen, setScreen] = React.useState<ScreenName>('Setup');

  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  React.useEffect(() => {
    if (session?.isActive) {
      setScreen((current) => (current === 'Mirror' ? current : 'Driller'));
    } else if (!session) {
      setScreen('Setup');
    }
  }, [session]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (screen === 'Mirror') {
    return (
      <MirrorScreen
        onClose={() => setScreen('Driller')}
        onGoToSetup={async () => {
          await clearCurrentSession();
          setScreen('Setup');
        }}
      />
    );
  }

  if (screen === 'Driller' && session?.isActive) {
    return (
      <DrillerScreen
        onOpenMirror={() => setScreen('Mirror')}
        onNewTrip={() => setScreen('Setup')}
      />
    );
  }

  return <SetupScreen onStartTrip={() => setScreen('Driller')} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
