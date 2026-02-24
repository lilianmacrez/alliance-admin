import { Building2 } from 'lucide-react'

export function FinanceursPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Financeurs</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Gestion des financeurs (DPEJ, MECS, Foyers…) et de leurs coordonnées.
        À implémenter.
      </p>
    </div>
  )
}
