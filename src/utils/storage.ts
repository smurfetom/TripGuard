import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLicenseId } from './license';
import { SetupTemplate, TripSession } from '../types';
import { getCurrentLicenseId } from './license';

const STORAGE_KEYS = {
  SESSION: '@tripguard_session',
  SETTINGS: '@tripguard_settings',
  TEMPLATES: '@tripguard_templates',
};

function keyWithLicense(baseKey: string): string {
  const id = getCurrentLicenseId();
  return id ? `${baseKey}:${id}` : baseKey;
}

export async function saveSession(session: TripSession): Promise<void> {
  try {
    await AsyncStorage.setItem(keyWithLicense(STORAGE_KEYS.SESSION), JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

export async function loadSession(): Promise<TripSession | null> {
  try {
    const data = await AsyncStorage.getItem(keyWithLicense(STORAGE_KEYS.SESSION));
    if (data) {
      return JSON.parse(data) as TripSession;
    }
    return null;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyWithLicense(STORAGE_KEYS.SESSION));
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(keyWithLicense(STORAGE_KEYS.SETTINGS), JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export async function loadSettings(): Promise<Record<string, unknown> | null> {
  try {
    const data = await AsyncStorage.getItem(keyWithLicense(STORAGE_KEYS.SETTINGS));
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

export async function saveTemplates(templates: SetupTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(keyWithLicense(STORAGE_KEYS.TEMPLATES), JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save templates:', error);
  }
}

export async function loadTemplates(): Promise<SetupTemplate[]> {
  try {
    const data = await AsyncStorage.getItem(keyWithLicense(STORAGE_KEYS.TEMPLATES));
    if (data) {
      return JSON.parse(data) as SetupTemplate[];
    }
    return [];
  } catch (error) {
    console.error('Failed to load templates:', error);
    return [];
  }
}
