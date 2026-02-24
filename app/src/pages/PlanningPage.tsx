import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { getDb } from '@/lib/db'
import type { Act, ActType, Situation } from '@/lib/models'

type ActStatus = Act['status']

interface ActRow extends Act {
  situation_name: string
  act_type_name: string
}

interface ActFormState {
  situation_id: string
  act_type_id: string
  act_date: string
  attendees: string
  notes: string
}

export function PlanningPage() {
  const [acts, setActs] = useState<ActRow[]>([])
  const [situations, setSituations] = useState<Situation[]>([])
  const [actTypes, setActTypes] = useState<ActType[]>([])
  const [month, setMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ActFormState>({
    situation_id: '',
    act_type_id: '',
    act_date: '',
    attendees: '',
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

      const [situRows, typeRows] = await Promise.all([
        db.select<Situation[]>('SELECT * FROM situations WHERE is_active = 1'),
        db.select<ActType[]>('SELECT * FROM act_types ORDER BY name'),
      ])

      setSituations(situRows)
      setActTypes(typeRows)

      setForm((prev) => ({
        ...prev,
        situation_id: prev.situation_id || situRows[0]?.id || '',
        act_type_id: prev.act_type_id || typeRows[0]?.id || '',
      }))

      await refreshActs(db, month)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de charger les données du planning',
      )
    } finally {
      setLoading(false)
    }
  }

  async function refreshActs(dbParam?: Awaited<ReturnType<typeof getDb>>, m?: string) {
    const db = dbParam ?? (await getDb())
    const targetMonth = m ?? month

    const rows = await db.select<ActRow[]>(
      `SELECT
         a.id,
         a.situation_id,
         a.act_type_id,
         a.act_date,
         a.attendees,
         a.status,
         a.amount,
         a.is_billed,
         a.notes,
         a.created_at,
         a.updated_at,
         s.name AS situation_name,
         t.name AS act_type_name
       FROM acts a
       JOIN situations s ON s.id = a.situation_id
       JOIN act_types t ON t.id = a.act_type_id
       WHERE substr(a.act_date, 1, 7) = $1
       ORDER BY a.act_date ASC`,
      [targetMonth],
    )

    setActs(rows)
  }

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth)
    try {
      const db = await getDb()
      await refreshActs(db, newMonth)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de recharger les actes pour ce mois',
      )
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!form.situation_id || !form.act_type_id || !form.act_date) {
        setError('Situation, type et date sont obligatoires.')
        setLoading(false)
        return
      }

      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const selectedType = actTypes.find((t) => t.id === form.act_type_id)
      const amount = selectedType?.default_rate ?? 0

      const db = await getDb()

      await db.execute(
        `INSERT INTO acts (
           id, situation_id, act_type_id, act_date, attendees,
           status, amount, is_billed, notes, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, 0, $8, $9, $10
         )`,
        [
          id,
          form.situation_id,
          form.act_type_id,
          form.act_date,
          form.attendees.trim() || null,
          'PLANNED',
          amount,
          form.notes.trim() || null,
          now,
          now,
        ],
      )

      setForm((prev) => ({
        ...prev,
        act_date: '',
        attendees: '',
        notes: '',
      }))

      await refreshActs(db)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la création de l’acte',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: ActStatus) {
    try {
      const db = await getDb()
      await db.execute(
        'UPDATE acts SET status = $1, updated_at = $2 WHERE id = $3',
        [status, new Date().toISOString(), id],
      )
      setActs((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de mettre à jour le statut',
      )
    }
  }

  const statusOptions: ActStatus[] = ['PLANNED', 'REALIZED', 'ABSENT', 'CANCELED']

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Planning</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">
          Mois affiché
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => void handleMonthChange(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.8fr)]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Actes du mois
          </h2>

          {loading && acts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : acts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun acte pour ce mois. Ajoute un acte via le formulaire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Date</th>
                    <th className="px-2 py-1">Situation</th>
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Présents</th>
                    <th className="px-2 py-1">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {acts.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{a.act_date}</td>
                      <td className="px-2 py-1">{a.situation_name}</td>
                      <td className="px-2 py-1">{a.act_type_name}</td>
                      <td className="px-2 py-1">{a.attendees ?? '—'}</td>
                      <td className="px-2 py-1">
                        <select
                          value={a.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              a.id,
                              e.target.value as ActStatus,
                            )
                          }
                          className="rounded-md border px-1.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
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
            Nouvel acte
          </h2>

          {situations.length === 0 || actTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crée d&apos;abord au moins une situation et un type de
              prestation.
            </p>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Situation
                </label>
                <select
                  value={form.situation_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      situation_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {situations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Type de prestation
                </label>
                <select
                  value={form.act_type_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      act_type_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {actTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.default_rate.toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={form.act_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, act_date: e.target.value }))
                  }
                  className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Présents (attendees)
                </label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attendees: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="ex : mère / enfant"
                />
              </div>

              <div className="space-y-1">
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
                <p className="text-sm text-destructive">
                  Erreur : {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Ajouter l&apos;acte
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
