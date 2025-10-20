import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { addWeeks, endOfWeek, format, isWithinInterval, startOfWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { getOrders, updateOrderStatus } from '../api'
import '../styles/kanban.css'

const COLUMNS = [
  { id: 'encomendado', label: 'Encomendado', color: '#fbbf24' },
  { id: 'pago', label: 'Pago', color: '#60a5fa' },
  { id: 'preparing', label: 'Em Preparação', color: '#a78bfa' },
  { id: 'delivered', label: 'Entregue', color: '#4ade80' }
]

function KanbanView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState({})
  const [selectedWeek, setSelectedWeek] = useState(new Date()) // Current week by default

  // Calculate week boundaries
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }) // Sunday

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    // Filter orders by selected week
    const filteredOrders = orders.filter(order => {
      if (!order.delivery_date) return false
      const deliveryDate = new Date(order.delivery_date)
      return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd })
    })

    // Group filtered orders by status
    const grouped = COLUMNS.reduce((acc, col) => {
      acc[col.id] = filteredOrders.filter(o => o.status === col.id)
      return acc
    }, {})
    setColumns(grouped)
  }, [orders, selectedWeek])

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

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const orderId = parseInt(draggableId)
    const newStatus = destination.droppableId

    try {
      await updateOrderStatus(orderId, newStatus)
      
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div className="kanban-container">
      {/* Week selector */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1.25rem',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e5e5'
      }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
          style={{
            borderRadius: '6px',
            padding: '0.625rem 1.25rem',
            fontWeight: '500',
            fontSize: '0.875rem',
            transition: 'all 0.15s',
            border: '1px solid #e5e5e5',
            background: 'white',
            color: '#171717'
          }}
        >
          ← Anterior
        </button>
        
        <div style={{ 
          textAlign: 'center',
          minWidth: '280px',
          padding: '0.5rem'
        }}>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.25rem',
            color: '#171717',
            letterSpacing: '-0.01em'
          }}>
            {format(weekStart, "d 'de' MMMM", { locale: pt })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: pt })}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#737373',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Semana {format(weekStart, 'w', { locale: pt })}
          </div>
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
          style={{
            borderRadius: '6px',
            padding: '0.625rem 1.25rem',
            fontWeight: '500',
            fontSize: '0.875rem',
            transition: 'all 0.15s',
            border: '1px solid #e5e5e5',
            background: 'white',
            color: '#171717'
          }}
        >
          Próxima →
        </button>

        <button 
          className="btn btn-primary"
          onClick={() => setSelectedWeek(new Date())}
          style={{ 
            marginLeft: '0.5rem',
            borderRadius: '6px',
            padding: '0.625rem 1.25rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            background: '#171717',
            border: 'none',
            color: 'white',
            transition: 'all 0.15s'
          }}
        >
          Hoje
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(column => (
            <div key={column.id} className="kanban-column">
              <div className="kanban-column-header" style={{ borderTopColor: column.color }}>
                <h3>{column.label}</h3>
                <span className="kanban-count">{columns[column.id]?.length || 0}</span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {columns[column.id]?.map((order, index) => (
                      <Draggable
                        key={order.id}
                        draggableId={String(order.id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div className="kanban-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="kanban-card-id">#{order.id}</span>
                                {order.is_monthly_payment && (
                                  <span 
                                    style={{ 
                                      fontSize: '0.65rem', 
                                      background: '#171717', 
                                      color: 'white',
                                      padding: '3px 6px',
                                      borderRadius: '3px',
                                      fontWeight: '600'
                                    }} 
                                    title="Pagamento Mensal"
                                  >
                                    MENSAL
                                  </span>
                                )}
                                {order.is_auto_generated && !order.is_monthly_payment && (
                                  <span 
                                    style={{ 
                                      fontSize: '0.65rem', 
                                      background: '#fafafa', 
                                      color: '#525252',
                                      padding: '3px 6px',
                                      borderRadius: '3px',
                                      border: '1px solid #e5e5e5',
                                      fontWeight: '500'
                                    }} 
                                    title="Entrega semanal do plano"
                                  >
                                    PLANO
                                  </span>
                                )}
                              </div>
                              <span className="kanban-card-total">
                                €{parseFloat(order.total || 0).toFixed(2)}
                                {parseFloat(order.total || 0) === 0 && order.is_auto_generated && (
                                  <span 
                                    style={{ 
                                      fontSize: '0.65rem', 
                                      background: '#fafafa', 
                                      color: '#525252',
                                      padding: '3px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #e5e5e5',
                                      marginLeft: '0.5rem',
                                      whiteSpace: 'nowrap',
                                      fontWeight: '500'
                                    }} 
                                    title="Esta entrega faz parte de uma subscrição mensal"
                                  >
                                    Plano
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="kanban-card-customer">
                              {order.customer?.name || `Cliente #${order.customer_id}`}
                            </div>
                            {order.delivery_date && (
                              <div className="kanban-card-date">
                                {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                              </div>
                            )}
                            {order.items && order.items.length > 0 && (
                              <div className="kanban-card-items">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default KanbanView
