import { useEffect, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { getDb } from '@/lib/db'
import type { Financeur, Situation } from '@/lib/models'

interface SituationRow extends Situation {
  financeur_name: string
}

interface SituationFormState {
  id: string | null
  name: string
  parents_names: string
  children_names: string
  financeur_id: string
  eds_referent: string
  judge_name: string
  placement_location: string
  rate_vm_override: string
  rate_entretien_override: string
  is_active: boolean
  notes: string
}

export function SituationsPage() {
  const [situations, setSituations] = useState<SituationRow[]>([])
  const [financeurs, setFinanceurs] = useState<Financeur[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SituationFormState>({
    id: null,
    name: '',
    parents_names: '',
    children_names: '',
    financeur_id: '',
    eds_referent: '',
    judge_name: '',
    placement_location: '',
    rate_vm_override: '',
    rate_entretien_override: '',
    is_active: true,
    notes: '',
  })

  useEffect(() => {
    void initialLoad()
  }, [])

  async function initialLoad() {
    setLoading(true)
    setError(null)
    try {
      const db = await getDb()
      const financeurRows = await db.select<Financeur[]>(
        'SELECT id, name, type, contact_email, contact_phone, address FROM financeurs ORDER BY name',
      )
      setFinanceurs(financeurRows)

      if (financeurRows.length > 0 && !form.financeur_id) {
        setForm((prev) => ({ ...prev, financeur_id: financeurRows[0]!.id }))
      }

      await refreshSituations()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de charger les situations et financeurs',
      )
    } finally {
      setLoading(false)
    }
  }

  async function refreshSituations() {
    const db = await getDb()
    const rows = await db.select<SituationRow[]>(
      `SELECT
        s.id,
        s.name,
        s.parents_names,
        s.children_names,
        s.financeur_id,
        s.eds_referent,
        s.judge_name,
        s.placement_location,
        s.rate_vm_override,
        s.rate_entretien_override,
        s.is_active,
        s.notes,
        s.created_at,
        s.updated_at,
        f.name as financeur_name
       FROM situations s
       JOIN financeurs f ON f.id = s.financeur_id
       ORDER BY s.created_at DESC`,
    )
    setSituations(rows)
  }

  function resetForm() {
    setForm({
      id: null,
      name: '',
      parents_names: '',
      children_names: '',
      financeur_id: financeurs[0]?.id ?? '',
      eds_referent: '',
      judge_name: '',
      placement_location: '',
      rate_vm_override: '',
      rate_entretien_override: '',
      is_active: true,
      notes: '',
    })
  }

  function handleEdit(s: SituationRow) {
    setForm({
      id: s.id,
      name: s.name,
      parents_names: s.parents_names ?? '',
      children_names: s.children_names ?? '',
      financeur_id: s.financeur_id,
      eds_referent: s.eds_referent ?? '',
      judge_name: s.judge_name ?? '',
      placement_location: s.placement_location ?? '',
      rate_vm_override:
        s.rate_vm_override !== null ? String(s.rate_vm_override) : '',
      rate_entretien_override:
        s.rate_entretien_override !== null
          ? String(s.rate_entretien_override)
          : '',
      is_active: s.is_active === 1,
      notes: s.notes ?? '',
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!form.financeur_id) {
        setError('Un financeur est obligatoire.')
        setLoading(false)
        return
      }

      const now = new Date().toISOString()
      const id = form.id ?? crypto.randomUUID()

      const rateVm =
        form.rate_vm_override.trim().length > 0
          ? Number.parseFloat(form.rate_vm_override.replace(',', '.'))
          : null
      const rateEnt =
        form.rate_entretien_override.trim().length > 0
          ? Number.parseFloat(form.rate_entretien_override.replace(',', '.'))
          : null

      if (
        rateVm !== null &&
        (Number.isNaN(rateVm) || rateVm < 0)
      ) {
        setError('Le tarif VM doit être un nombre positif.')
        setLoading(false)
        return
      }
      if (
        rateEnt !== null &&
        (Number.isNaN(rateEnt) || rateEnt < 0)
      ) {
        setError('Le tarif Entretien doit être un nombre positif.')
        setLoading(false)
        return
      }

      const db = await getDb()

      if (form.id) {
        await db.execute(
          `UPDATE situations
           SET name = $1,
               parents_names = $2,
               children_names = $3,
               financeur_id = $4,
               eds_referent = $5,
               judge_name = $6,
               placement_location = $7,
               rate_vm_override = $8,
               rate_entretien_override = $9,
               is_active = $10,
               notes = $11,
               updated_at = $12
           WHERE id = $13`,
          [
            form.name.trim(),
            form.parents_names.trim() || null,
            form.children_names.trim() || null,
            form.financeur_id,
            form.eds_referent.trim() || null,
            form.judge_name.trim() || null,
            form.placement_location.trim() || null,
            rateVm,
            rateEnt,
            form.is_active ? 1 : 0,
            form.notes.trim() || null,
            now,
            id,
          ],
        )
      } else {
        await db.execute(
          `INSERT INTO situations (
             id, name, parents_names, children_names, financeur_id,
             eds_referent, judge_name, placement_location,
             rate_vm_override, rate_entretien_override,
             is_active, notes, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5,
             $6, $7, $8,
             $9, $10,
             $11, $12, $13, $14
           )`,
          [
            id,
            form.name.trim(),
            form.parents_names.trim() || null,
            form.children_names.trim() || null,
            form.financeur_id,
            form.eds_referent.trim() || null,
            form.judge_name.trim() || null,
            form.placement_location.trim() || null,
            rateVm,
            rateEnt,
            form.is_active ? 1 : 0,
            form.notes.trim() || null,
            now,
            now,
          ],
        )
      }

      resetForm()
      await refreshSituations()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la sauvegarde de la situation',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <FolderOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Situations</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Dossiers en cours
          </h2>

          {loading && situations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : situations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune situation pour le moment. Ajoute un dossier via le
              formulaire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Nom</th>
                    <th className="px-2 py-1">Parents</th>
                    <th className="px-2 py-1">Enfants</th>
                    <th className="px-2 py-1">Financeur</th>
                    <th className="px-2 py-1">Actif</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {situations.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{s.name}</td>
                      <td className="px-2 py-1">
                        {s.parents_names ?? '—'}
                      </td>
                      <td className="px-2 py-1">
                        {s.children_names ?? '—'}
                      </td>
                      <td className="px-2 py-1">
                        {s.financeur_name ?? '—'}
                      </td>
                      <td className="px-2 py-1">
                        {s.is_active === 1 ? 'Oui' : 'Non'}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
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
            {form.id ? 'Modifier une situation' : 'Nouvelle situation'}
          </h2>

          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Nom de la situation
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
                Parents
              </label>
              <input
                type="text"
                value={form.parents_names}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    parents_names: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Enfants
              </label>
              <input
                type="text"
                value={form.children_names}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    children_names: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Financeur
              </label>
              <select
                value={form.financeur_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    financeur_id: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {financeurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                EDS référent
              </label>
              <input
                type="text"
                value={form.eds_referent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    eds_referent: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Juge
              </label>
              <input
                type="text"
                value={form.judge_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    judge_name: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Lieu de placement
              </label>
              <input
                type="text"
                value={form.placement_location}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    placement_location: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tarif VM (override)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.rate_vm_override}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rate_vm_override: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="laisser vide pour le tarif par défaut"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tarif Entretien (override)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.rate_entretien_override}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rate_entretien_override: e.target.value,
                  }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="laisser vide pour le tarif par défaut"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border"
              />
              <label
                htmlFor="is_active"
                className="text-xs font-medium text-muted-foreground"
              >
                Situation active
              </label>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <p className="md:col-span-2 text-sm text-destructive">
                Erreur : {error}
              </p>
            )}

            <div className="md:col-span-2 flex gap-2">
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
