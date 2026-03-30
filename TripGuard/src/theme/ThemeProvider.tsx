import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from '../constants/theme';

type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_STORAGE_KEY = '@tripguard_theme_mode';

const ThemeContext = React.createContext<ThemeContextValue>({
  themeMode: 'dark',
  colors: DARK_COLORS,
  setThemeMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>('dark');

  React.useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'dark' || savedMode === 'light') {
          setThemeModeState(savedMode);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = React.useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const value = React.useMemo(
    () => ({
      themeMode,
      colors: themeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
      setThemeMode,
    }),
    [themeMode, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return React.useContext(ThemeContext);
}
