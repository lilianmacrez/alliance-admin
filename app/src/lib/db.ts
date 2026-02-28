import { invoke } from '@tauri-apps/api/core'
import { runMigrations } from './migrations'

const DB_PATH_KEY = 'alliance-admin.db-path'

export function getStoredDbPath(): string | null {
  return window.localStorage.getItem(DB_PATH_KEY)
}

export function setStoredDbPath(path: string): void {
  window.localStorage.setItem(DB_PATH_KEY, path)
}

export async function ensureDbReady(): Promise<string> {
  const storedPath = getStoredDbPath()
  if (!storedPath) {
    throw new Error('Aucun chemin de base de données configuré')
  }
  return storedPath
}

export async function dbExecute(
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  const dbPath = await ensureDbReady()
  await runMigrations(dbPath)
  await invoke('db_execute', {
    dbPath,
    sql,
    params,
  })
}

export async function dbSelect<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const dbPath = await ensureDbReady()
  await runMigrations(dbPath)
  const rows = await invoke<Array<{ values: T }>>('db_select', {
    dbPath,
    sql,
    params,
  })
  return rows.map((r) => r.values)
}

// Variante interne permettant aux migrations de passer explicitement un chemin.
export async function dbExecuteRaw(
  dbPath: string,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  await invoke('db_execute', {
    dbPath,
    sql,
    params,
  })
}

export async function dbSelectRaw<T>(
  dbPath: string,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const rows = await invoke<Array<{ values: T }>>('db_select', {
    dbPath,
    sql,
    params,
  })
  return rows.map((r) => r.values)
}
