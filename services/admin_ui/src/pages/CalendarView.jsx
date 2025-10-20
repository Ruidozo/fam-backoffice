import { format, getDay, parse, startOfWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { getOrders, getSettings } from '../api'
import '../styles/calendar.css'

const locales = {
  'pt': pt,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

function CalendarView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [settings, setSettings] = useState(null)
  const [cutoffWarning, setCutoffWarning] = useState(null)

  useEffect(() => {
    loadOrders()
    loadSettings()
  }, [])

  useEffect(() => {
    // Convert orders to calendar events
    const orderEvents = orders
      .filter(order => order.delivery_date)
      .map(order => ({
        id: order.id,
        title: `#${order.id} - ${order.customer?.name || `Cliente #${order.customer_id}`}`,
        start: new Date(order.delivery_date + 'T00:00:00'),
        end: new Date(order.delivery_date + 'T23:59:59'),
        resource: order,
      }))
    setEvents(orderEvents)
  }, [orders])

  useEffect(() => {
    if (settings) {
      calculateCutoffWarning()
    }
  }, [settings])

  const loadSettings = async () => {
    try {
      const response = await getSettings()
      setSettings(response.data)
    } catch (error) {
      console.error('Erro ao carregar definições:', error)
    }
  }

  const calculateCutoffWarning = () => {
    if (!settings) return

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate next cutoff date
    const daysUntilCutoff = (settings.order_cutoff_day - currentDay + 7) % 7
    const nextCutoff = new Date(now)
    nextCutoff.setDate(now.getDate() + (daysUntilCutoff === 0 ? 7 : daysUntilCutoff))
    nextCutoff.setHours(settings.order_cutoff_hour, settings.order_cutoff_minute, 0, 0)

    // Calculate time remaining
    const timeRemaining = nextCutoff - now
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    // Only show warning if cutoff is within 48 hours
    if (hoursRemaining <= 48 && hoursRemaining >= 0) {
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      setCutoffWarning({
        day: dayNames[settings.order_cutoff_day],
        time: `${String(settings.order_cutoff_hour).padStart(2, '0')}:${String(settings.order_cutoff_minute).padStart(2, '0')}`,
        hours: hoursRemaining,
        minutes: minutesRemaining,
        isUrgent: hoursRemaining <= 24
      })
    } else {
      setCutoffWarning(null)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await getOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error)
      alert('Erro ao carregar encomendas')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedOrder(event.resource)
    setShowModal(true)
  }

  const eventStyleGetter = (event) => {
    const order = event.resource
    const statusColors = {
      pending: '#fbbf24',
      confirmed: '#60a5fa',
      preparing: '#a78bfa',
      dispatched: '#fb923c',
      delivered: '#4ade80',
    }
    
    const backgroundColor = statusColors[order.status] || '#94a3b8'
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: '500',
      }
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Em Preparação',
      dispatched: 'Expedido',
      delivered: 'Entregue'
    }
    return labels[status] || status
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div className="calendar-container">
      {cutoffWarning && (
        <div style={{
          margin: '1rem',
          padding: '1rem',
          background: cutoffWarning.isUrgent ? '#fef3c7' : '#dbeafe',
          border: `1px solid ${cutoffWarning.isUrgent ? '#fbbf24' : '#60a5fa'}`,
          borderRadius: '0.375rem',
          color: cutoffWarning.isUrgent ? '#92400e' : '#1e40af'
        }}>
          <strong>
            {cutoffWarning.isUrgent ? 'URGENTE' : 'AVISO'}: Prazo para encomendas
          </strong>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            As encomendas devem ser feitas até {cutoffWarning.day} às {cutoffWarning.time}.
            {' '}Tempo restante: <strong>{cutoffWarning.hours}h {cutoffWarning.minutes}min</strong>
          </p>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 140px)' }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        culture="pt"
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Encomenda",
          noEventsInRange: "Nenhuma encomenda neste período"
        }}
      />

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Encomenda #{selectedOrder.id}</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div>
              <p><strong>Cliente:</strong> {selectedOrder.customer?.name || `#${selectedOrder.customer_id}`}</p>
              <p><strong>Data de Entrega:</strong> {format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy')}</p>
              <p><strong>Estado:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{getStatusLabel(selectedOrder.status)}</span></p>
              <p><strong>Total:</strong> €{parseFloat(selectedOrder.total).toFixed(2)}</p>
              {selectedOrder.notes && <p><strong>Observações:</strong> {selectedOrder.notes}</p>}
              
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Itens</h4>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name || `Produto #${item.product_id}`}</td>
                      <td>{item.quantity}</td>
                      <td>€{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td>€{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarView
