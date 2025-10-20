import { useEffect, useState } from 'react'
import { createCustomer, createMonthlyPayment, createRecurringPlan, deleteCustomer, deleteRecurringPlan, getCustomers, getProducts, getRecurringPlans, updateCustomer, updateRecurringPlan } from '../api'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [managingPlanCustomer, setManagingPlanCustomer] = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planFormData, setPlanFormData] = useState({
    day_of_week: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    active: true,
    items: []
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pickup_location: '',
    is_subscription: false
  })

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await getCustomers()
      setCustomers(response.data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadPlan = async (customerId) => {
    try {
      const response = await getRecurringPlans(customerId)
      if (response.data && response.data.length > 0) {
        const plan = response.data[0]
        setCurrentPlan(plan)
        setPlanFormData({
          day_of_week: plan.day_of_week,
          start_date: plan.start_date,
          end_date: plan.end_date || '',
          active: plan.active,
          items: plan.items || []
        })
      } else {
        setCurrentPlan(null)
        setPlanFormData({
          day_of_week: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          active: true,
          items: []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
      } else {
        await createCustomer(formData)
      }
      setShowModal(false)
      setEditingCustomer(null)
  setFormData({ name: '', email: '', phone: '', address: '', pickup_location: '', is_subscription: false })
      loadCustomers()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente')
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      pickup_location: customer.pickup_location || '',
      is_subscription: customer.is_subscription || false
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    try {
      await deleteCustomer(id)
      loadCustomers()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente')
    }
  }

  const handleAdd = () => {
    setEditingCustomer(null)
  setFormData({ name: '', email: '', phone: '', address: '', pickup_location: '', is_subscription: false })
    setShowModal(true)
  }

  const handleOpenPlanModal = async (customer) => {
    setManagingPlanCustomer(customer)
    await loadPlan(customer.id)
    setShowPlanModal(true)
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    try {
      const planData = {
        customer_id: managingPlanCustomer.id,
        day_of_week: parseInt(planFormData.day_of_week),
        start_date: planFormData.start_date,
        end_date: planFormData.end_date || null,
        active: planFormData.active,
        items: planFormData.items
      }

      if (currentPlan) {
        await updateRecurringPlan(currentPlan.id, planData)
        alert('Plano atualizado com sucesso!')
      } else {
        await createRecurringPlan(planData)
        alert('Plano criado com sucesso!')
      }
      
      await loadPlan(managingPlanCustomer.id)
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      alert('Erro ao salvar plano: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeletePlan = async () => {
    if (!currentPlan) return
    if (!confirm('Tem certeza que deseja excluir este plano?')) return

    try {
      await deleteRecurringPlan(currentPlan.id)
      alert('Plano excluído com sucesso!')
      setCurrentPlan(null)
      setPlanFormData({
        day_of_week: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        active: true,
        items: []
      })
    } catch (error) {
      console.error('Erro ao excluir plano:', error)
      alert('Erro ao excluir plano')
    }
  }

  const handleGeneratePayment = async () => {
    if (!currentPlan) {
      alert('É necessário criar um plano primeiro!')
      return
    }

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    if (!confirm(`Gerar encomenda de pagamento mensal para ${month}/${year}?`)) return

    try {
      await createMonthlyPayment(currentPlan.id, month, year)
      alert('Encomenda de pagamento criada com sucesso! Veja na página de Encomendas.')
      setShowPlanModal(false)
    } catch (error) {
      console.error('Erro ao gerar pagamento:', error)
      alert('Erro ao gerar pagamento: ' + (error.response?.data?.detail || error.message))
    }
  }

  const addPlanItem = () => {
    setPlanFormData({
      ...planFormData,
      items: [...planFormData.items, { product_id: '', quantity: 1 }]
    })
  }

  const removePlanItem = (index) => {
    setPlanFormData({
      ...planFormData,
      items: planFormData.items.filter((_, i) => i !== index)
    })
  }

  const updatePlanItem = (index, field, value) => {
    const newItems = [...planFormData.items]
    newItems[index] = { ...newItems[index], [field]: field === 'quantity' ? parseInt(value) : parseInt(value) }
    setPlanFormData({ ...planFormData, items: newItems })
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Clientes</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Novo Cliente
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Morada</th>
              <th>Local de Recolha</th>
              <th>Subscrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.address || '-'}</td>
                  <td>{customer.pickup_location || '-'}</td>
                  <td>
                    {customer.is_subscription ? (
                      <span className="status-badge status-delivered">✓ Mensal</span>
                    ) : (
                      <span className="status-badge status-pending">Avulso</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {customer.is_subscription && (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => handleOpenPlanModal(customer)}
                          title="Gerir plano de subscrição"
                        >
                          📋 Plano
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(customer)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(customer.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
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
                  <label>Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Morada</label>
                  <textarea
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Local de Recolha Preferido (se diferente da morada)</label>
                  <input
                    type="text"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_subscription}
                      onChange={(e) => setFormData({ ...formData, is_subscription: e.target.checked })}
                    />
                    <span>Subscrição Mensal (pagamento mensal, entregas semanais)</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlanModal && managingPlanCustomer && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Plano de Subscrição - {managingPlanCustomer.name}</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowPlanModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSavePlan}>
              <div className="modal-body">
                {currentPlan && (
                  <div className="info-box" style={{ background: '#d4edda', borderColor: '#28a745' }}>
                    <p><strong>✓ Plano Ativo</strong></p>
                    <p style={{ fontSize: '0.9em', color: '#155724', margin: '0.5rem 0 0 0' }}>
                      Este cliente já tem um plano de subscrição configurado.
                    </p>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Dia da Semana para Entrega *</label>
                    <select
                      required
                      value={planFormData.day_of_week}
                      onChange={(e) => setPlanFormData({ ...planFormData, day_of_week: e.target.value })}
                    >
                      <option value="0">Segunda-feira</option>
                      <option value="1">Terça-feira</option>
                      <option value="2">Quarta-feira</option>
                      <option value="3">Quinta-feira</option>
                      <option value="4">Sexta-feira</option>
                      <option value="5">Sábado</option>
                      <option value="6">Domingo</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Data de Início *</label>
                    <input
                      type="date"
                      required
                      value={planFormData.start_date}
                      onChange={(e) => setPlanFormData({ ...planFormData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Data de Fim (opcional)</label>
                    <input
                      type="date"
                      value={planFormData.end_date}
                      onChange={(e) => setPlanFormData({ ...planFormData, end_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={planFormData.active}
                        onChange={(e) => setPlanFormData({ ...planFormData, active: e.target.checked })}
                      />
                      <span>Plano Ativo</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 'bold' }}>Produtos Semanais *</label>
                    <button type="button" className="btn btn-secondary btn-small" onClick={addPlanItem}>
                      + Adicionar Produto
                    </button>
                  </div>

                  {planFormData.items.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                      Nenhum produto adicionado. Clique em "+ Adicionar Produto" para começar.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {planFormData.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => updatePlanItem(index, 'product_id', e.target.value)}
                            style={{ flex: 2 }}
                          >
                            <option value="">Selecione um produto</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} {product.unit_price ? `- €${parseFloat(product.unit_price).toFixed(2)}` : ''}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => updatePlanItem(index, 'quantity', e.target.value)}
                            placeholder="Qtd"
                            style={{ width: '80px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() => removePlanItem(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {currentPlan && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>💰 Gerar Pagamento Mensal</h4>
                    <p style={{ fontSize: '0.9em', color: '#666', margin: '0 0 1rem 0' }}>
                      Crie a encomenda de pagamento mensal para o mês atual. O cliente deve pagar esta encomenda
                      para que as entregas semanais sejam geradas automaticamente.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleGeneratePayment}
                    >
                      🎯 Gerar Encomenda de Pagamento
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {currentPlan && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeletePlan}
                    style={{ marginRight: 'auto' }}
                  >
                    Excluir Plano
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                  Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
