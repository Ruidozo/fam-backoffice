import { useEffect, useState } from 'react'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api'

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    cost_price: '',
    active: true,
    batch_size: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      alert('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        cost_price: formData.cost_price === '' ? null : parseFloat(formData.cost_price),
        batch_size: formData.batch_size === '' ? null : parseInt(formData.batch_size)
      }
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
      } else {
        await createProduct(data)
      }
      setShowModal(false)
      setEditingProduct(null)
  setFormData({ sku: '', name: '', description: '', unit_price: '', cost_price: '', active: true, batch_size: '' })
      loadProducts()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      unit_price: product.unit_price,
      cost_price: product.cost_price || '',
      active: product.active,
      batch_size: product.batch_size || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      await deleteProduct(id)
      loadProducts()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  const handleAdd = () => {
    setEditingProduct(null)
  setFormData({ sku: '', name: '', description: '', unit_price: '', cost_price: '', active: true, batch_size: '' })
    setShowModal(true)
  }

  const calculateMargin = (unitPrice, costPrice) => {
    if (!unitPrice || !costPrice) return '-'
    const margin = ((unitPrice - costPrice) / unitPrice) * 100
    return `${margin.toFixed(1)}%`
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Produtos</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Novo Produto
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Custo</th>
              <th>Margem</th>
              <th>Batch Mín.</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  Nenhum produto cadastrado
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.description || '-'}</td>
                  <td>€{parseFloat(product.unit_price).toFixed(2)}</td>
                  <td>{product.cost_price ? `€${parseFloat(product.cost_price).toFixed(2)}` : '-'}</td>
                  <td>{calculateMargin(product.unit_price, product.cost_price)}</td>
                  <td>{product.batch_size || '-'}</td>
                  <td>
                    <span className={`status-badge ${product.active ? 'status-delivered' : 'status-pending'}`}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(product.id)}
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
              <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
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
                  <label>SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descrição</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Batch mínimo (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex.: 12"
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Preço de Venda (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Preço de Custo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
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
    </div>
  )
}

export default ProductsPage
