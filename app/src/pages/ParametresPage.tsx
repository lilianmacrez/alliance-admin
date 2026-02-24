import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { getDb, getStoredDbPath } from '@/lib/db'
import type { ActType } from '@/lib/models'

interface ActTypeFormState {
  id: string | null
  name: string
  default_rate: string
}

export function ParametresPage() {
  const dbPath = getStoredDbPath()
  const [actTypes, setActTypes] = useState<ActType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ActTypeFormState>({
    id: null,
    name: '',
    default_rate: '',
  })

  useEffect(() => {
    void refreshActTypes()
  }, [])

  async function refreshActTypes() {
    setLoading(true)
    setError(null)
    try {
      const db = await getDb()
      const rows = await db.select<ActType[]>(
        'SELECT id, name, default_rate FROM act_types ORDER BY name',
      )
      setActTypes(rows)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de charger les types de prestations',
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ id: null, name: '', default_rate: '' })
  }

  function handleEdit(t: ActType) {
    setForm({
      id: t.id,
      name: t.name,
      default_rate: String(t.default_rate),
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const rate = Number.parseFloat(form.default_rate.replace(',', '.'))
      if (Number.isNaN(rate) || rate < 0) {
        setError('Le tarif doit être un nombre positif.')
        setLoading(false)
        return
      }

      const db = await getDb()
      const id = form.id ?? crypto.randomUUID()

      if (form.id) {
        await db.execute(
          'UPDATE act_types SET name = $1, default_rate = $2 WHERE id = $3',
          [form.name.trim(), rate, id],
        )
      } else {
        await db.execute(
          'INSERT INTO act_types (id, name, default_rate) VALUES ($1, $2, $3)',
          [id, form.name.trim(), rate],
        )
      }

      resetForm()
      await refreshActTypes()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la sauvegarde du type de prestation',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <section className="mb-6 space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">
            Base de données
          </h2>
          <p className="text-sm break-all">{dbPath ?? 'Non configurée'}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Types de prestations (act_types)
          </h2>
          {loading && actTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : actTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun type de prestation défini (VM, Entretien…). Ajoute-en un via
              le formulaire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Nom</th>
                    <th className="px-2 py-1">Tarif de base</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actTypes.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{t.name}</td>
                      <td className="px-2 py-1">
                        {t.default_rate.toFixed(2)} €
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Éditer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {form.id ? 'Modifier un type de prestation' : 'Nouveau type'}
          </h2>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nom
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tarif de base (€)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={form.default_rate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    default_rate: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Erreur lors de l&apos;enregistrement : {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {form.id ? 'Mettre à jour' : 'Ajouter'}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Annuler l&apos;édition
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
