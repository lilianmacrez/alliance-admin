import { FileText } from 'lucide-react'

export function ComptabilitePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Comptabilité</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Génération des devis et factures, exports comptables (Grand Livre, Compte de résultat…).
        À implémenter.
      </p>
    </div>
  )
}
