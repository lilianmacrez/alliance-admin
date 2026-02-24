import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getStoredDbPath } from '@/lib/db'
import { AppLayout } from '@/components/AppLayout'
import { SetupPage } from '@/pages/SetupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SituationsPage } from '@/pages/SituationsPage'
import { PlanningPage } from '@/pages/PlanningPage'
import { FinanceursPage } from '@/pages/FinanceursPage'
import { ComptabilitePage } from '@/pages/ComptabilitePage'
import { ParametresPage } from '@/pages/ParametresPage'

export default function App() {
  const hasDbPath = !!getStoredDbPath()

  return (
    <HashRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />

        {hasDbPath ? (
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="situations" element={<SituationsPage />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="financeurs" element={<FinanceursPage />} />
            <Route path="comptabilite" element={<ComptabilitePage />} />
            <Route path="parametres" element={<ParametresPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/setup" replace />} />
        )}
      </Routes>
    </HashRouter>
  )
}
