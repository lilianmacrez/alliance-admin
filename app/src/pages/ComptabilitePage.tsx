import { useCallback, useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { dbExecute, dbSelect } from '@/lib/db'
import type { Document, Financeur } from '@/lib/models'

interface DocumentRow extends Document {
  financeur_name: string
}

export function ComptabilitePage() {
  const [financeurs, setFinanceurs] = useState<Financeur[]>([])
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [month, setMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [financeurId, setFinanceurId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialLoad = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const financeurRows = await dbSelect<Financeur>(
        'SELECT * FROM financeurs ORDER BY name',
      )
      setFinanceurs(financeurRows)
      if (financeurRows.length > 0) {
        setFinanceurId(financeurRows[0]!.id)
      }
      await refreshDocuments(month)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de charger les données de comptabilité',
      )
    } finally {
      setLoading(false)
    }
  }, [month, refreshDocuments])

  useEffect(() => {
    void initialLoad()
  }, [initialLoad])

  const refreshDocuments = useCallback(
    async (m?: string) => {
      const targetMonth = m ?? month

      const docs = await dbSelect<DocumentRow>(
        `SELECT
           d.id,
           d.type,
           d.document_number,
           d.situation_id,
           d.financeur_id,
           d.month_year,
           d.total_amount,
           d.status,
           d.issue_date,
           d.notes,
           d.created_at,
           f.name as financeur_name
         FROM documents d
         JOIN financeurs f ON f.id = d.financeur_id
         WHERE d.type = 'FACTURE'
           AND d.month_year = $1
         ORDER BY d.issue_date DESC, d.document_number ASC`,
        [targetMonth],
      )

      setDocuments(docs)
    },
    [month],
  )

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth)
    try {
      await refreshDocuments(newMonth)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Impossible de recharger les documents pour ce mois',
      )
    }
  }

  async function handleGenerateInvoice() {
    if (!financeurId) {
      setError('Sélectionne un financeur.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Récupérer les actes éligibles pour ce financeur et ce mois
      const acts = await dbSelect<{
        id: string
        amount: number
        situation_id: string
        act_type_name: string
        act_date: string
      }>(
        `SELECT
           a.id,
           a.amount,
           a.situation_id,
           t.name as act_type_name,
           a.act_date
         FROM acts a
         JOIN situations s ON s.id = a.situation_id
         JOIN financeurs f ON f.id = s.financeur_id
         JOIN act_types t ON t.id = a.act_type_id
         WHERE f.id = $1
           AND a.status = 'REALIZED'
           AND a.is_billed = 0
           AND substr(a.act_date, 1, 7) = $2`,
        [financeurId, month],
      )

      if (acts.length === 0) {
        setError(
          "Aucun acte réalisé et non facturé pour ce financeur et ce mois.",
        )
        setLoading(false)
        return
      }

      // Générer un numéro de facture simple AAXXXX (nuance: basique pour v1)
      const countRows = await dbSelect<{ count: number }>(
        "SELECT COUNT(*) as count FROM documents WHERE type = 'FACTURE'",
      )
      const nextIndex = (countRows[0]?.count ?? 0) + 1
      const documentNumber = `AA${String(nextIndex).padStart(4, '0')}`

      const now = new Date().toISOString()
      const documentId = crypto.randomUUID()
      const situationId = acts[0]!.situation_id

      const totalAmount = acts.reduce((sum, a) => sum + (a.amount ?? 0), 0)

      await dbExecute(
        `INSERT INTO documents (
           id, type, document_number, situation_id, financeur_id,
           month_year, total_amount, status, issue_date, notes, created_at
         ) VALUES (
           $1, 'FACTURE', $2, $3, $4,
           $5, $6, 'DRAFT', $7, NULL, $8
         )`,
        [
          documentId,
          documentNumber,
          situationId,
          financeurId,
          month,
          totalAmount,
          now,
          now,
        ],
      )

      for (const act of acts) {
        const lineId = crypto.randomUUID()
        const description = `${act.act_type_name} du ${act.act_date}`
        await dbExecute(
          `INSERT INTO document_lines (
             id, document_id, act_id, description, quantity, unit_price, total
           ) VALUES (
             $1, $2, $3, $4, 1, $5, $5
           )`,
          [lineId, documentId, act.id, description, act.amount],
        )
      }

      await dbExecute(
        `UPDATE acts SET is_billed = 1 WHERE id IN (${acts
          .map((_, idx) => `$${idx + 1}`)
          .join(', ')})`,
        acts.map((a) => a.id),
      )

      await refreshDocuments()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la génération de la facture',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Comptabilité</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Mois
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => void handleMonthChange(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Financeur
          </label>
          <select
            value={financeurId}
            onChange={(e) => setFinanceurId(e.target.value)}
            className="min-w-[200px] rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {financeurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={loading || !financeurId}
          onClick={() => void handleGenerateInvoice()}
          className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Générer une facture pour ce mois
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">
          Erreur : {error}
        </p>
      )}

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Factures du mois
        </h2>

        {loading && documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune facture pour ce mois.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">Numéro</th>
                  <th className="px-2 py-1">Financeur</th>
                  <th className="px-2 py-1">Mois</th>
                  <th className="px-2 py-1">Montant total</th>
                  <th className="px-2 py-1">Statut</th>
                  <th className="px-2 py-1">Date d&apos;émission</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="px-2 py-1">{d.document_number}</td>
                    <td className="px-2 py-1">{d.financeur_name}</td>
                    <td className="px-2 py-1">{d.month_year}</td>
                    <td className="px-2 py-1">
                      {d.total_amount.toFixed(2)} €
                    </td>
                    <td className="px-2 py-1">{d.status}</td>
                    <td className="px-2 py-1">{d.issue_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
