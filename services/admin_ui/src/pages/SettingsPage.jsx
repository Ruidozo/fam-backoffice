import { useEffect, useState } from 'react'
import { createUser, deleteUser, getSettings, getUsers, updateSettings, updateUser } from '../api'
import '../styles/users.css'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Segunda-feira' },
  { value: 1, label: 'Terça-feira' },
  { value: 2, label: 'Quarta-feira' },
  { value: 3, label: 'Quinta-feira' },
  { value: 4, label: 'Sexta-feira' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
]

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [formData, setFormData] = useState({
    production_day: 2,
    order_cutoff_day: 6,
    order_cutoff_hour: 23,
    order_cutoff_minute: 59
  })

  // Users state
  const [users, setUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'operator',
    is_active: true,
  })

  useEffect(() => {
    loadSettings()
    fetchUsers()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await getSettings()
      setSettings(response.data)
      setFormData({
        production_day: response.data.production_day,
        order_cutoff_day: response.data.order_cutoff_day,
        order_cutoff_hour: response.data.order_cutoff_hour,
        order_cutoff_minute: response.data.order_cutoff_minute
      })
    } catch (error) {
      console.error('Erro ao carregar definições:', error)
      alert('Erro ao carregar definições')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await getUsers()
      setUsers(response.data)
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      await updateSettings(formData)
      alert('Definições atualizadas com sucesso!')
      loadSettings()
    } catch (error) {
      console.error('Erro ao atualizar definições:', error)
      alert('Erro ao atualizar definições')
    } finally {
      setSaving(false)
    }
  }

  // User management functions
  const handleUserSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const updateData = { ...userFormData }
        if (!updateData.password) {
          delete updateData.password
        }
        await updateUser(editingUser.id, updateData)
      } else {
        await createUser(userFormData)
      }
      
      setShowUserModal(false)
      setEditingUser(null)
      resetUserForm()
      fetchUsers()
    } catch (error) {
      console.error('Erro ao guardar utilizador:', error)
      alert(error.response?.data?.detail || 'Erro ao guardar utilizador')
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name || '',
      password: '',
      role: user.role,
      is_active: user.is_active,
    })
    setShowUserModal(true)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja eliminar este utilizador?')) return

    try {
      await deleteUser(userId)
      fetchUsers()
    } catch (error) {
      console.error('Erro ao eliminar utilizador:', error)
      alert(error.response?.data?.detail || 'Erro ao eliminar utilizador')
    }
  }

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'operator',
      is_active: true,
    })
  }

  const openCreateUserModal = () => {
    resetUserForm()
    setEditingUser(null)
    setShowUserModal(true)
  }

  const getRoleName = (role) => {
    const roles = {
      admin: 'Administrador',
      manager: 'Gestor',
      operator: 'Operador',
    }
    return roles[role] || role
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Definições</h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'system' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'system' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'system' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Sistema
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'users' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'users' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Utilizadores
        </button>
      </div>

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            Produção
          </h3>

          <div className="form-group">
            <label>Dia de Produção</label>
            <select
              name="production_day"
              value={formData.production_day}
              onChange={handleChange}
              required
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
              Dia da semana em que a produção é realizada (ex: Terça-feira)
            </small>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            Prazo Limite para Encomendas
          </h3>

          <div className="form-group">
            <label>Dia Limite</label>
            <select
              name="order_cutoff_day"
              value={formData.order_cutoff_day}
              onChange={handleChange}
              required
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
              Último dia da semana para receber encomendas
            </small>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Hora</label>
              <select
                name="order_cutoff_hour"
                value={formData.order_cutoff_hour}
                onChange={handleChange}
                required
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Minuto</label>
              <select
                name="order_cutoff_minute"
                value={formData.order_cutoff_minute}
                onChange={handleChange}
                required
              >
                {[0, 15, 30, 45, 59].map(minute => (
                  <option key={minute} value={minute}>
                    {String(minute).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <strong>Prazo atual:</strong> {DAYS_OF_WEEK[formData.order_cutoff_day].label} às{' '}
            {String(formData.order_cutoff_hour).padStart(2, '0')}:
            {String(formData.order_cutoff_minute).padStart(2, '0')}
          </div>
        </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar Definições'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadSettings}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-page">
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Gestão de Utilizadores</h3>
            <button className="btn btn-primary" onClick={openCreateUserModal}>
              + Novo Utilizador
            </button>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Nome Completo</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Estado</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.full_name || '-'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString('pt-PT')
                        : 'Nunca'}
                    </td>
                    <td className="actions">
                      <button 
                        className="btn btn-small btn-edit" 
                        onClick={() => handleEditUser(user)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-small btn-delete" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Modal */}
          {showUserModal && (
            <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h2>
                  <button className="close-btn" onClick={() => setShowUserModal(false)}>×</button>
                </div>
                
                <form onSubmit={handleUserSubmit}>
                  <div className="form-group">
                    <label>Utilizador *</label>
                    <input
                      type="text"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      required
                      disabled={!!editingUser}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nome Completo</label>
                    <input
                      type="text"
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Senha {editingUser ? '(deixe em branco para manter)' : '*'}</label>
                    <input
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Função *</label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      required
                    >
                      <option value="operator">Operador</option>
                      <option value="manager">Gestor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {editingUser && (
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={userFormData.is_active}
                          onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                        />
                        Utilizador Ativo
                      </label>
                    </div>
                  )}

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SettingsPage
