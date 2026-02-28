import { useState } from 'react'
import { Database } from 'lucide-react'
import { open, save } from '@tauri-apps/plugin-dialog'
import { ensureDbReady, getStoredDbPath, setStoredDbPath } from '@/lib/db'

export function DatabasePage() {
  const [displayPath, setDisplayPath] = useState<string | null>(
    getStoredDbPath(),
  )
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleImport() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: 'Choisir une base de données (.db)',
        filters: [
          {
            name: 'Bases SQLite',
            extensions: ['db'],
          },
        ],
      })

      if (!selected || Array.isArray(selected)) {
        setSuccess(null)
        return
      }

      const path = selected
      setStoredDbPath(path)
      await ensureDbReady()
      setDisplayPath(path)
      setSuccess('Base sélectionnée avec succès. Toutes les pages utilisent maintenant ce fichier.')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de l’import de la base de données.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    // Exporter = copier manuellement le fichier .db choisi.
    // Comme l'application écrit déjà directement dans ce fichier,
    // tu peux simplement le copier dans l'explorateur (clé USB, etc.).
    setError(null)
    setSuccess(
      "Pour exporter, copie simplement le fichier .db indiqué comme 'Chemin sélectionné' dans l'explorateur de fichiers.",
    )
  }

  async function handleCreateNew(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const base =
        newName && newName.trim().length > 0
          ? newName.trim()
          : 'alliance-admin'

      const safeBase = base.replace(/[^a-zA-Z0-9_-]+/g, '_')
      const defaultFileName = safeBase.endsWith('.db')
        ? safeBase
        : `${safeBase}.db`

      const destination = await save({
        title: 'Choisir où enregistrer la nouvelle base',
        defaultPath: defaultFileName,
        filters: [
          {
            name: 'Bases SQLite',
            extensions: ['db'],
          },
        ],
      })

      if (!destination) {
        setSuccess(null)
        return
      }

      setStoredDbPath(destination)
      await ensureDbReady()
      setDisplayPath(destination)
      setNewName('')
      setSuccess(
        `Nouvelle base créée à l'emplacement choisi. Toutes les pages utilisent maintenant ce fichier.`,
      )
    } catch (e) {
      const message =
        typeof e === 'string'
          ? e
          : e instanceof Error
            ? e.message
            : JSON.stringify(e)
      setError(`Erreur lors de la création de la nouvelle base : ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Base de données</h1>
      </div>

      <div className="mb-4 space-y-2 text-sm text-muted-foreground">
        <p>
          Ici, tu peux choisir une base de données SQLite existante (fichier{' '}
          <code>.db</code>) ou en créer une nouvelle avec le bon schéma.
          Toute l&apos;application (situations, planning, comptabilité)
          travaillera sur la base actuellement sélectionnée.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">
          Erreur : {error}
        </p>
      )}
      {success && (
        <p className="mb-4 text-sm text-emerald-600">
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Base actuelle
          </h2>

          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Chemin sélectionné :</span>{' '}
              <span className="break-all">
                {displayPath ?? 'Aucun (aucune base choisie pour le moment)'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Si le fichier n&apos;existe pas encore, il sera créé
              automatiquement lorsque tu commenceras à utiliser l&apos;appli.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Ouvrir une base existante…
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !displayPath}
              className="inline-flex items-center rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Exporter la base actuelle…
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Pour partager ta base avec quelqu&apos;un d&apos;autre, tu peux
            utiliser le bouton &quot;Exporter&quot; pour enregistrer un
            fichier <code>.db</code> n&apos;importe où (clé USB, dossier
            partagé…).
          </p>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Nouvelle base de données
          </h2>

          <form className="space-y-3" onSubmit={handleCreateNew}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nom de la base (optionnel)
              </label>
              <input
                type="text"
                placeholder="ex: alliance-janvier-2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Le fichier SQLite créé portera ce nom (avec l&apos;extension
                <code>.db</code>). Tu pourras choisir où l&apos;enregistrer.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Créer une nouvelle base vide
            </button>

            <p className="text-xs text-muted-foreground">
              Une fois créée, la nouvelle base est immédiatement utilisée par
              l&apos;application (et les migrations s&apos;appliquent pour
              créer toutes les tables nécessaires).
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}

