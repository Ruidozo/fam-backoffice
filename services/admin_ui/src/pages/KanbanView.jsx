import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { getOrders, updateOrderStatus } from '../api'
import '../styles/kanban.css'

const COLUMNS = [
  { id: 'pending', label: 'Pendente', color: '#fbbf24' },
  { id: 'confirmed', label: 'Confirmado', color: '#60a5fa' },
  { id: 'preparing', label: 'Em Preparação', color: '#a78bfa' },
  { id: 'dispatched', label: 'Expedido', color: '#fb923c' },
  { id: 'delivered', label: 'Entregue', color: '#4ade80' }
]

function KanbanView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState({})

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    // Group orders by status
    const grouped = COLUMNS.reduce((acc, col) => {
      acc[col.id] = orders.filter(o => o.status === col.id)
      return acc
    }, {})
    setColumns(grouped)
  }, [orders])

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
                              <span className="kanban-card-id">#{order.id}</span>
                              <span className="kanban-card-total">€{parseFloat(order.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="kanban-card-customer">
                              {order.customer?.name || `Cliente #${order.customer_id}`}
                            </div>
                            {order.delivery_date && (
                              <div className="kanban-card-date">
                                📅 {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
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
