import { useCallback, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { getStoredDbPath, setStoredDbPath } from '@/lib/db'

type SetupState = 'idle' | 'selecting' | 'done'

export function SetupPage() {
  const [dbPath, setDbPath] = useState<string | null>(getStoredDbPath())
  const [state, setState] = useState<SetupState>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleChooseFolder = useCallback(async () => {
    setError(null)
    setState('selecting')
    try {
      const selected = await open({ directory: true, multiple: false })

      if (!selected || Array.isArray(selected)) {
        setState('idle')
        return
      }

      const fullPath = `${selected}/alliance-admin.db`
      setStoredDbPath(fullPath)
      setDbPath(fullPath)
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setState('idle')
    }
  }, [])

  const handleContinue = () => {
    // On force la route racine avant de recharger,
    // pour éviter de revenir sur /setup après le reload.
    window.location.hash = '/'
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Configuration initiale</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez un dossier de référence pour vos données (par exemple pour
          les sauvegardes). La base de données{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.db</code> est
          physiquement stockée dans les données de l&apos;application, afin
          d&apos;être compatible avec Tauri.
        </p>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleChooseFolder}
            disabled={state === 'selecting'}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {state === 'selecting'
              ? 'Ouverture…'
              : 'Choisir le dossier de sauvegarde'}
          </button>

          {dbPath && (
            <p className="text-sm break-all">
              <span className="font-medium">Chemin :</span>{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {dbPath}
              </code>
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">Erreur : {error}</p>
          )}

          {state === 'done' && (
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continuer vers l'application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
