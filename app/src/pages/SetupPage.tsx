import { useCallback, useEffect, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { getStoredDbPath, setStoredDbPath } from '../lib/db'

type SetupState = 'idle' | 'selecting' | 'done'

export function SetupPage() {
  const [dbPath, setDbPath] = useState<string | null>(getStoredDbPath())
  const [state, setState] = useState<SetupState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDbPath(getStoredDbPath())
  }, [])

  const handleChooseFolder = useCallback(async () => {
    setError(null)
    setState('selecting')
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      })

      if (!selected || Array.isArray(selected)) {
        setState('idle')
        return
      }

      // On construit le chemin du fichier SQLite dans ce dossier.
      const fullPath = `${selected}/alliance-admin.db`
      setStoredDbPath(fullPath)
      setDbPath(fullPath)
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setState('idle')
    }
  }, [])

  return (
    <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
      <h1>Configuration initiale</h1>
      <p>
        Choisissez le dossier où sera stockée la base de données{' '}
        <code>.db</code>. Idéalement, utilisez un dossier synchronisé (OneDrive,
        Google Drive...) pour la multi-postes.
      </p>

      <section style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={handleChooseFolder}
          disabled={state === 'selecting'}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {state === 'selecting'
            ? 'Ouverture de la boîte de dialogue...'
            : 'Choisir le dossier de sauvegarde'}
        </button>

        {dbPath && (
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Dossier sélectionné : <code>{dbPath}</code>
          </p>
        )}

        {error && (
          <p style={{ marginTop: '1rem', color: '#b91c1c' }}>
            Erreur : {error}
          </p>
        )}
      </section>
    </main>
  )
}

