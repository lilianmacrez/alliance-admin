import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { getDb } from '@/lib/db'
import type { Financeur } from '@/lib/models'

const FINANCEUR_TYPES: Financeur['type'][] = ['DPEJ', 'MECS', 'FOYER', 'AUTRE']

interface FormState {
  id: string | null
  name: string
  type: Financeur['type']
  contact_email: string
  contact_phone: string
  address: string
}

export function FinanceursPage() {
  const [items, setItems] = useState<Financeur[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    id: null,
    name: '',
    type: 'DPEJ',
    contact_email: '',
    contact_phone: '',
    address: '',
  })

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const db = await getDb()
      const rows = await db.select<Financeur[]>(
        'SELECT id, name, type, contact_email, contact_phone, address FROM financeurs ORDER BY name',
      )
      setItems(rows)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de charger les financeurs",
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({
      id: null,
      name: '',
      type: 'DPEJ',
      contact_email: '',
      contact_phone: '',
      address: '',
    })
  }

  function handleEdit(f: Financeur) {
    setForm({
      id: f.id,
      name: f.name,
      type: f.type,
      contact_email: f.contact_email ?? '',
      contact_phone: f.contact_phone ?? '',
      address: f.address ?? '',
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const db = await getDb()
      const id = form.id ?? crypto.randomUUID()

      if (form.id) {
        await db.execute(
          `UPDATE financeurs
           SET name = $1, type = $2, contact_email = $3, contact_phone = $4, address = $5
           WHERE id = $6`,
          [
            form.name.trim(),
            form.type,
            form.contact_email.trim() || null,
            form.contact_phone.trim() || null,
            form.address.trim() || null,
            id,
          ],
        )
      } else {
        await db.execute(
          `INSERT INTO financeurs (id, name, type, contact_email, contact_phone, address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            form.name.trim(),
            form.type,
            form.contact_email.trim() || null,
            form.contact_phone.trim() || null,
            form.address.trim() || null,
          ],
        )
      }

      resetForm()
      await refresh()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erreur lors de la sauvegarde du financeur',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Financeurs</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Liste des financeurs
          </h2>

          {loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun financeur pour le moment. Ajoute-en un via le formulaire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Nom</th>
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">Téléphone</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{f.name}</td>
                      <td className="px-2 py-1">{f.type}</td>
                      <td className="px-2 py-1">{f.contact_email ?? '—'}</td>
                      <td className="px-2 py-1">{f.contact_phone ?? '—'}</td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(f)}
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
            {form.id ? 'Modifier un financeur' : 'Nouveau financeur'}
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
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as Financeur['type'],
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FINANCEUR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contact_email: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contact_phone: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Adresse
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address: e.target.value,
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
