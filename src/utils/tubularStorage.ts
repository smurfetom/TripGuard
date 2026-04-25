import AsyncStorage from '@react-native-async-storage/async-storage';
import { keyWithLicense } from './storage';
import { createId } from './id';

export interface UserTubular {
  id: string;
  type: 'BHA' | 'DP' | 'HWDP' | 'CASING' | 'CUSTOM';
  name: string;
  openEndDisplacementPerStand: number;
  closedEndDisplacementPerStand: number;
  standCapacity?: number;
  standLength: number;
  createdAt: number;
}

const TUBULAR_STORAGE_KEY = 'user_tubulars';

export async function saveUserTubulars(tubulars: UserTubular[]): Promise<void> {
  const key = keyWithLicense(TUBULAR_STORAGE_KEY);
  console.log('saveUserTubulars key:', key);
  console.log('saveUserTubulars data:', JSON.stringify(tubulars));
  await AsyncStorage.setItem(key, JSON.stringify(tubulars));
  console.log('saveUserTubulars complete');
}

export async function loadUserTubulars(): Promise<UserTubular[]> {
  const data = await AsyncStorage.getItem(keyWithLicense(TUBULAR_STORAGE_KEY));
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

export async function addUserTubular(tubular: Omit<UserTubular, 'id' | 'createdAt'>): Promise<UserTubular> {
  console.log('addUserTubular called with:', tubular);
  const existing = await loadUserTubulars();
  console.log('Existing tubulars:', existing);
  const newTubular: UserTubular = {
    ...tubular,
    id: createId(),
    createdAt: Date.now(),
  };
  console.log('Saving new tubular:', newTubular);
  await saveUserTubulars([...existing, newTubular]);
  console.log('Save complete, checking...');
  const verify = await loadUserTubulars();
  console.log('Verify load:', verify);
  return newTubular;
}

export async function updateUserTubular(id: string, updates: Partial<Omit<UserTubular, 'id' | 'createdAt'>>): Promise<void> {
  const existing = await loadUserTubulars();
  const updated = existing.map(t => t.id === id ? { ...t, ...updates } : t);
  await saveUserTubulars(updated);
}

export async function deleteUserTubular(id: string): Promise<void> {
  const existing = await loadUserTubulars();
  const filtered = existing.filter(t => t.id !== id);
  await saveUserTubulars(filtered);
}