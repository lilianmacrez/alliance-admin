import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { getStoredDbPath } from './lib/db.ts'

const hasDbPath = !!getStoredDbPath()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            hasDbPath ? <App /> : <Navigate to="/setup" replace />
          }
        />
        <Route path="/setup" element={<SetupPage />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
