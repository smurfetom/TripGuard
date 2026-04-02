// Client-side license scoping for per-license isolation (Option 1)
import AsyncStorage from '@react-native-async-storage/async-storage';

const LICENSE_KEY = '@tripguard_current_license'
let currentLicenseId: string = 'default'

export function getCurrentLicenseId(): string {
  return currentLicenseId
}

export function setCurrentLicenseId(id: string): void {
  currentLicenseId = id
  // Persist license choice for future app launches
  AsyncStorage.setItem(LICENSE_KEY, id).catch(() => {})
}

export async function loadCurrentLicenseIdFromStorage(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(LICENSE_KEY)
    if (v) currentLicenseId = v
  } catch {
    // ignore storage errors, fall back to default
  }
  return currentLicenseId
}
