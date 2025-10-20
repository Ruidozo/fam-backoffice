import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './AuthContext'
import CalendarView from './pages/CalendarView'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import KanbanView from './pages/KanbanView'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductionView from './pages/ProductionView'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

// Main app layout
function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/fam_black.png" alt="FAM" className="nav-logo" />
        </div>
        <ul className="nav-links">
          <li><Link to="/">Encomendas</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/kanban">Kanban</Link></li>
          <li><Link to="/calendar">Calendário</Link></li>
          <li><Link to="/production">Produção</Link></li>
          <li><Link to="/customers">Clientes</Link></li>
          <li><Link to="/products">Produtos</Link></li>
          {user?.role === 'admin' && (
            <li><Link to="/settings">Definições</Link></li>
          )}
        </ul>
        <div className="nav-user">
          <span className="user-name">{user?.full_name || user?.username}</span>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<OrdersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kanban" element={<KanbanView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/production" element={<ProductionView />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute adminOnly>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
