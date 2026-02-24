import { FolderOpen } from 'lucide-react'

export function SituationsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Situations</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Liste des dossiers / situations suivies (parents, enfants, EDS, financeur…).
        À implémenter.
      </p>
    </div>
  )
}
