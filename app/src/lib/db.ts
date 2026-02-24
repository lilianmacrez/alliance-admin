import Database from '@tauri-apps/plugin-sql'
import type { Database as DatabaseInstance } from '@tauri-apps/plugin-sql'
import { runMigrations } from './migrations'

const DB_PATH_KEY = 'alliance-admin.db-path'

let dbInstance: DatabaseInstance | null = null

export function getStoredDbPath(): string | null {
  return window.localStorage.getItem(DB_PATH_KEY)
}

export function setStoredDbPath(path: string): void {
  window.localStorage.setItem(DB_PATH_KEY, path)
}

export async function getDb(): Promise<DatabaseInstance> {
  if (dbInstance) return dbInstance

  const path = getStoredDbPath()
  if (!path) {
    throw new Error('Aucun chemin de base de données configuré')
  }

  const db = await Database.load(`sqlite:${path}`)
  await db.execute('PRAGMA foreign_keys = ON')
  await runMigrations(db)
  dbInstance = db
  return db
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
  }
}
