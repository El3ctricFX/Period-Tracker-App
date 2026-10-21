import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { CycleLog } from './types';

export async function exportData(logs: CycleLog[]): Promise<void> {
  const path = await save({
    defaultPath: 'cycle_tracker_backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!path) return;
  await writeTextFile(path, JSON.stringify(logs, null, 2));
}

export async function importData(): Promise<CycleLog[] | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!path || Array.isArray(path)) return null;
  const text = await readTextFile(path);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Invalid backup');
  return parsed as CycleLog[];
}