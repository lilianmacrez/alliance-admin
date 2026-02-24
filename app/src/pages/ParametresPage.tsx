import { Settings } from 'lucide-react'
import { getStoredDbPath } from '@/lib/db'

export function ParametresPage() {
  const dbPath = getStoredDbPath()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">
            Base de données
          </h2>
          <p className="text-sm break-all">{dbPath ?? 'Non configurée'}</p>
        </div>
      </section>

      <p className="mt-6 text-muted-foreground text-sm">
        Gestion des territoires, financeurs, tarifs… (à implémenter)
      </p>
    </div>
  )
}
