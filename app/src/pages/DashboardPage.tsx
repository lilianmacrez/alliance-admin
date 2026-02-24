import { LayoutDashboard } from 'lucide-react'

export function DashboardPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Situations actives" value="—" />
        <StatCard label="Actes ce mois" value="—" />
        <StatCard label="Facturé ce mois" value="—" />
      </div>

      <p className="mt-8 text-muted-foreground text-sm">
        Les statistiques s'afficheront ici une fois les données saisies.
      </p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  )
}
