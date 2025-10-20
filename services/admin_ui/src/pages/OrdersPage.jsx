import { differenceInHours, endOfWeek, format, isWithinInterval, startOfWeek } from 'date-fns'
import { useEffect, useState } from 'react'
import { createOrder, deleteOrder, getCustomers, getOrder, getOrderHistory, getOrders, getProducts, updateOrder, updateOrderStatus } from '../api'

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [weekFilter, setWeekFilter] = useState('all') // 'all' | 'current'
  const [sortBy, setSortBy] = useState('delivery_date') // 'delivery_date' | 'id'
  const [formData, setFormData] = useState({
    customer_id: '',
    delivery_date: '',
    notes: '',
    items: []
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [orders, weekFilter, sortBy])

  const loadData = async () => {
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts()
      ])
      setOrders(ordersRes.data)
      setCustomers(customersRes.data)
      setProducts(productsRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let result = [...orders]

    // Week filter
    if (weekFilter === 'current') {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      result = result.filter(order => {
        if (!order.delivery_date) return false
        const deliveryDate = new Date(order.delivery_date)
        return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd })
      })
    }

    // Sort
    if (sortBy === 'delivery_date') {
      result.sort((a, b) => {
        if (!a.delivery_date) return 1
        if (!b.delivery_date) return -1
        return new Date(a.delivery_date) - new Date(b.delivery_date)
      })
    } else {
      result.sort((a, b) => b.id - a.id)
    }

    setFilteredOrders(result)
  }

  const getUrgentOrders = () => {
    const now = new Date()
    return orders.filter(order => {
      if (!order.delivery_date || order.status === 'delivered') return false
      const deliveryDate = new Date(order.delivery_date)
      const hoursUntil = differenceInHours(deliveryDate, now)
      return hoursUntil >= 0 && hoursUntil <= 24
    })
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Cliente', 'Data de Entrega', 'Estado', 'Total', 'Observações', 'Itens']
    const rows = filteredOrders.map(order => [
      order.id,
      order.customer?.name || `Cliente #${order.customer_id}`,
      order.delivery_date ? format(new Date(order.delivery_date), 'dd/MM/yyyy') : '',
      getStatusLabel(order.status),
      parseFloat(order.total || 0).toFixed(2),
      order.notes || '',
      order.items?.map(i => `${i.product?.name || i.product_id} (${i.quantity}x)`).join('; ') || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `encomendas_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createOrder(formData)
      setShowModal(false)
      setFormData({ customer_id: '', delivery_date: '', notes: '', items: [] })
      loadData()
    } catch (error) {
      console.error('Erro ao criar encomenda:', error)
      alert('Erro ao criar encomenda')
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: '' }]
    })
  }

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    
    // Auto-fill unit_price when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        newItems[index].unit_price = product.unit_price
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const openEditOrder = async (orderId) => {
    try {
      const { data } = await getOrder(orderId)
      setEditingOrderId(orderId)
      setFormData({
        customer_id: data.customer_id,
        delivery_date: data.delivery_date ? String(data.delivery_date).slice(0, 10) : '',
        notes: data.notes || '',
        items: (data.items || []).map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      })
      setEditModal(true)
    } catch (e) {
      console.error('Erro ao carregar encomenda para editar:', e)
      alert('Erro ao carregar encomenda para editar')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateOrder(editingOrderId, formData)
      setEditModal(false)
      setEditingOrderId(null)
      setFormData({ customer_id: '', delivery_date: '', notes: '', items: [] })
      loadData()
    } catch (error) {
      console.error('Erro ao atualizar encomenda:', error)
      alert('Erro ao atualizar encomenda')
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      loadData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta encomenda?')) return
    
    try {
      await deleteOrder(id)
      loadData()
    } catch (error) {
      console.error('Erro ao excluir encomenda:', error)
      alert('Erro ao excluir encomenda')
    }
  }

  const handleViewOrder = async (orderId) => {
    try {
      const response = await getOrder(orderId)
      setSelectedOrder(response.data)
      try {
        const histRes = await getOrderHistory(orderId)
        setHistory(histRes.data)
      } catch (e) {
        console.warn('Sem histórico para esta encomenda', e)
        setHistory([])
      }
      setViewModal(true)
    } catch (error) {
      console.error('Erro ao carregar encomenda:', error)
      alert('Erro ao carregar encomenda')
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      encomendado: 'Encomendado',
      pago: 'Pago',
      preparing: 'Em Preparação',
      delivered: 'Entregue'
    }
    return labels[status] || status
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0))
    }, 0)
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  const urgentOrders = getUrgentOrders()

  return (
    <div>
      {urgentOrders.length > 0 && (
        <div className="alert alert-warning" style={{
          margin: '1rem',
          padding: '1rem',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '0.375rem',
          color: '#92400e'
        }}>
          <strong>URGENTE: {urgentOrders.length} encomenda{urgentOrders.length > 1 ? 's' : ''} urgente{urgentOrders.length > 1 ? 's' : ''}!</strong>
          {' '}Para entrega nas próximas 24 horas.
        </div>
      )}

      <div className="page-header">
        <h2>Encomendas</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--gray-300)' }}
          >
            <option value="all">Todas</option>
            <option value="current">Semana Atual</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--gray-300)' }}
          >
            <option value="delivery_date">Ordenar por Data</option>
            <option value="id">Ordenar por ID</option>
          </select>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            📥 Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nova Encomenda
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Data de Entrega</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  Nenhuma encomenda cadastrada
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isUrgent = urgentOrders.some(u => u.id === order.id)
                return (
                  <tr key={order.id} style={isUrgent ? { background: '#fef3c7' } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>#{order.id}</span>
                        {isUrgent && <span style={{ fontSize: '1.2rem' }}>!</span>}
                        {order.is_monthly_payment && (
                          <span className="status-badge" style={{ background: '#10b981', color: 'white', fontSize: '0.75rem' }}>
                            Pagamento Mensal
                          </span>
                        )}
                        {order.is_auto_generated && (
                          <span className="status-badge" style={{ background: '#6366f1', color: 'white', fontSize: '0.75rem' }}>
                            Mensal
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{order.customer?.name || `Cliente #${order.customer_id}`}</td>
                    <td>{order.delivery_date ? format(new Date(order.delivery_date), 'dd/MM/yyyy') : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>€{parseFloat(order.total || 0).toFixed(2)}</span>
                        {parseFloat(order.total || 0) === 0 && order.is_auto_generated && (
                          <span 
                            className="status-badge" 
                            style={{ 
                              background: '#e0f2fe', 
                              color: '#0369a1', 
                              fontSize: '0.7rem',
                              border: '1px solid #bae6fd',
                              padding: '2px 6px'
                            }}
                            title="Esta entrega faz parte de uma subscrição mensal. O pagamento foi efetuado através da encomenda de 'Pagamento Mensal'."
                          >
                            Plano Mensal
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className={`status-badge status-${order.status}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="encomendado">Encomendado</option>
                        <option value="pago">Pago</option>
                        <option value="preparing">Em Preparação</option>
                        <option value="delivered">Entregue</option>
                      </select>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          Ver
                        </button>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditOrder(order.id)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(order.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Nova Encomenda</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Entrega</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Observações</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Itens</h4>
              
              {formData.items.map((item, index) => (
                <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Produto *</label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      >
                        <option value="">Selecione um produto</option>
                        {products.filter(p => p.active).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - €{parseFloat(product.unit_price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Preço Unitário (€) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddItem}
                style={{ marginBottom: '1rem' }}
              >
                + Adicionar Item
              </button>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <strong>Total: €{calculateTotal().toFixed(2)}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Encomenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Editar Encomenda #{editingOrderId}</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Entrega</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Observações</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Itens</h4>
              {formData.items.map((item, index) => (
                <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Produto *</label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      >
                        <option value="">Selecione um produto</option>
                        {products.filter(p => p.active).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - €{parseFloat(product.unit_price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Preço Unitário (€) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddItem}
                style={{ marginBottom: '1rem' }}
              >
                + Adicionar Item
              </button>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <strong>Total: €{calculateTotal().toFixed(2)}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Encomenda #{selectedOrder.id}</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setViewModal(false)}
              >
                ✕
              </button>
            </div>
            <div>
              <p><strong>Cliente:</strong> {selectedOrder.customer?.name || `#${selectedOrder.customer_id}`}</p>
              <p><strong>Data de Entrega:</strong> {selectedOrder.delivery_date ? format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy') : '-'}</p>
              <p><strong>Estado:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{getStatusLabel(selectedOrder.status)}</span></p>
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
              
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <strong>Total: €{parseFloat(selectedOrder.total).toFixed(2)}</strong>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Histórico de Estados</h4>
              {history.length === 0 ? (
                <div className="empty-state">Sem histórico.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {history.map((h) => (
                    <li key={h.id || `${h.status}-${h.changed_at}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0' }}>
                      <span className={`status-badge status-${h.status}`} style={{ minWidth: 100, textAlign: 'center' }}>
                        {getStatusLabel(h.status)}
                      </span>
                      <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                        {new Date(h.changed_at).toLocaleString('pt-PT')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
