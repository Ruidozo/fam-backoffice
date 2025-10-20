import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api'

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [formData, setFormData] = useState({
    production_day: 2,
    order_cutoff_day: 6,
    order_cutoff_hour: 23,
    order_cutoff_minute: 59
  })

  useEffect(() => {
    loadSettings()
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

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Definições do Sistema</h2>
      </div>

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
    </div>
  )
}

export default SettingsPage
