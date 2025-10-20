import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboardStats } from '../api'
import '../styles/dashboard.css'

const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#60a5fa',
  preparing: '#a78bfa',
  dispatched: '#fb923c',
  delivered: '#4ade80'
}

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Em Preparação',
  dispatched: 'Expedido',
  delivered: 'Entregue'
}

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      const { data } = await getDashboardStats(parseInt(dateRange))
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      alert('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  if (!stats) {
    return <div className="empty-state">Sem dados disponíveis</div>
  }

  // Prepare status data for pie chart
  const statusData = stats.orders_by_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8'
  }))

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="date-range" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Período:</label>
          <select 
            id="date-range"
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">Orders</div>
          <div className="kpi-content">
            <div className="kpi-label">Total de Encomendas</div>
            <div className="kpi-value">{stats.total_orders}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">Units</div>
          <div className="kpi-content">
            <div className="kpi-label">Total de Unidades</div>
            <div className="kpi-value">{stats.total_units.toLocaleString()}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">Revenue</div>
          <div className="kpi-content">
            <div className="kpi-label">Receita Total</div>
            <div className="kpi-value">€{stats.total_revenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">Avg</div>
          <div className="kpi-content">
            <div className="kpi-label">Ticket Médio</div>
            <div className="kpi-value">
              €{stats.total_orders > 0 ? (stats.total_revenue / stats.total_orders).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        
        {/* Orders Over Time */}
        <div className="chart-card">
          <h3>Encomendas por Dia (Últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.orders_by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#c47b27" strokeWidth={2} name="Encomendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Over Time */}
        <div className="chart-card">
          <h3>Receita por Dia (Últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.orders_by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#7a9e7e" strokeWidth={2} name="Receita (€)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="chart-card">
          <h3>Encomendas por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="chart-card">
          <h3>Top 10 Produtos (Unidades Vendidas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.top_products}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_units" fill="#c47b27" name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="chart-card">
          <h3>Top 10 Clientes (Receita)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.top_customers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="total_revenue" fill="#7a9e7e" name="Receita (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products Summary Table */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Resumo de Produtos</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Unidades Vendidas</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_products.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td><strong>{product.total_units}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customers Summary Table */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Resumo de Clientes</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_customers.slice(0, 5).map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td><strong>€{customer.total_revenue.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
