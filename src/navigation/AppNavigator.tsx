import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SetupScreen, DrillerScreen, MirrorScreen, StatusScreen } from '../screens';
import { useTripStore } from '../store/tripStore';
import { useAppTheme } from '../theme/ThemeProvider';

type ScreenName = 'Setup' | 'Driller' | 'Mirror' | 'Status';

export function AppNavigator() {
  const { colors } = useAppTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
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

  if (screen === 'Status') {
    return <StatusScreen onClose={() => setScreen('Setup')} />;
  }

  return <SetupScreen onStartTrip={() => setScreen('Driller')} onGoToStatus={() => setScreen('Status')} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
