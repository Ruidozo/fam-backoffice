import { useEffect, useState } from 'react'
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../api'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [managingPlanCustomer, setManagingPlanCustomer] = useState(null)
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
                          onClick={() => {
                            setManagingPlanCustomer(customer)
                            setShowPlanModal(true)
                          }}
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
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Cliente:</strong> {managingPlanCustomer.name}</p>
                <p><strong>Tipo:</strong> Subscrição Mensal</p>
                <p style={{ color: '#666', fontSize: '0.9em', marginTop: '8px' }}>
                  💡 O plano de subscrição define que produtos o cliente recebe semanalmente.
                  No início de cada mês, crie uma encomenda de pagamento mensal.
                  Quando o cliente pagar, o sistema gera automaticamente as entregas semanais.
                </p>
              </div>

              <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  🚧 Interface de gestão de planos em desenvolvimento
                </p>
                <p style={{ fontSize: '0.9em', color: '#888' }}>
                  Por enquanto, utilize a API diretamente:<br/>
                  POST /recurring/plans - Criar plano<br/>
                  POST /recurring/plans/{'{'}id{'}'}/create-monthly-payment - Criar pagamento mensal
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
