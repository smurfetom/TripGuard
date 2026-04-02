import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SetupScreen, DrillerScreen, MirrorScreen, StatusScreen, DiagnosticsScreen, LicenseLoginScreen } from '../screens';
import { loadCurrentLicenseIdFromStorage, getCurrentLicenseId, setCurrentLicenseId } from '../utils/license';
import { useTripStore } from '../store/tripStore';
import { useAppTheme } from '../theme/ThemeProvider';

type ScreenName = 'Setup' | 'Driller' | 'Mirror' | 'Status' | 'Diagnostics';

export function AppNavigator() {
  const { colors } = useAppTheme();
  const [licenseReady, setLicenseReady] = React.useState(false);
  const [licenseId, setLicenseId] = React.useState<string>(getCurrentLicenseId());
  const restoreSession = useTripStore((state) => state.restoreSession);
  const session = useTripStore((state) => state.session);
  const isLoading = useTripStore((state) => state.isLoading);
  const clearCurrentSession = useTripStore((state) => state.clearCurrentSession);
  const [screen, setScreen] = React.useState<ScreenName>('Setup');

  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Load persisted license on startup
  React.useEffect(() => {
    (async () => {
      try {
        const loadedId = await loadCurrentLicenseIdFromStorage();
        if (loadedId) {
          setCurrentLicenseId(loadedId);
          setLicenseId(loadedId);
        }
      } catch {
        // ignore
      }
      setLicenseReady(true);
    })();
  }, []);

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

  // Show a login gate if license not yet selected
  if (!licenseReady || licenseId === 'default') {
    return <LicenseLoginScreen onSuccess={(id) => { setCurrentLicenseId(id); setLicenseId(id); setScreen('Setup'); }} />
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

  if (screen === 'Diagnostics') {
    return <DiagnosticsScreen onClose={() => setScreen('Setup')} />;
  }

  return <SetupScreen onStartTrip={() => setScreen('Driller')} onGoToStatus={() => setScreen('Status')} onGoToDiagnostics={() => setScreen('Diagnostics')} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
