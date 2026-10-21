import { load } from '@tauri-apps/plugin-store';
import type { CycleLog } from './types';

let storePromise: ReturnType<typeof load> | null = null;

function getStore() {
  if (!storePromise) storePromise = load('cycle-data.bin');
  return storePromise;
}

export async function loadLogs(): Promise<CycleLog[]> {
  const store = await getStore();
  return (await store.get<CycleLog[]>('periodLogs')) ?? [];
}

export async function saveLogs(logs: CycleLog[]): Promise<void> {
  const store = await getStore();
  await store.set('periodLogs', logs);
  await store.save();
}

export async function loadTheme(): Promise<'dark' | 'light' | null> {
  const store = await getStore();
  return (await store.get<'dark' | 'light'>('theme')) ?? null;
}

export async function saveTheme(theme: 'dark' | 'light'): Promise<void> {
  const store = await getStore();
  await store.set('theme', theme);
  await store.save();
}
