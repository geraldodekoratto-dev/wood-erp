import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PCPPage from '@/modules/pcp/pages/PCPPage'
import KanbanPage from '@/modules/pcp/pages/KanbanPage'
import OrderDetailPage from '@/modules/pcp/pages/OrderDetailPage'
import CustomersPage from '@/modules/clientes/pages/CustomersPage'
import CustomerDetailPage from '@/modules/clientes/pages/CustomerDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pcp" element={<PCPPage />} />
            <Route path="/pcp/kanban" element={<KanbanPage />} />
            <Route path="/pcp/:id" element={<OrderDetailPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/clientes/:id" element={<CustomerDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
