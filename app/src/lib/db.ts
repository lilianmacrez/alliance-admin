import Database, { type Database as DatabaseInstance } from '@tauri-apps/plugin-sql'

const DB_PATH_KEY = 'alliance-admin.db-path'

export function getStoredDbPath(): string | null {
  return window.localStorage.getItem(DB_PATH_KEY)
}

export function setStoredDbPath(path: string): void {
  window.localStorage.setItem(DB_PATH_KEY, path)
}

export async function openDb(): Promise<DatabaseInstance> {
  const path = getStoredDbPath()

  if (!path) {
    throw new Error('Aucun chemin de base de données configuré')
  }

  // On utilise SQLite, avec un chemin absolu choisi par l’utilisateur.
  return Database.load(`sqlite:${path}`)
}

