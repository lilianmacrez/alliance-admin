import { CalendarDays } from 'lucide-react'

export function PlanningPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Planning</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Calendrier des actes (visites médiatisées, entretiens…) avec suivi des statuts.
        À implémenter.
      </p>
    </div>
  )
}
