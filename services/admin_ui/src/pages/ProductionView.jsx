import { useEffect, useState } from 'react'
import { getProductionNeeds } from '../api'
import '../styles/production.css'

function ProductionView() {
  const [loading, setLoading] = useState(true)
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    // format yyyy-MM-dd
    return d.toISOString().slice(0, 10)
  })
  const [needs, setNeeds] = useState([])
  const [showRounded, setShowRounded] = useState(true)

  useEffect(() => {
    loadNeeds(targetDate)
  }, [targetDate])

  const loadNeeds = async (date) => {
    try {
      const { data } = await getProductionNeeds(date)
      setNeeds(data)
    } catch (error) {
      console.error('Erro ao carregar necessidades de produção:', error)
      alert('Erro ao carregar necessidades de produção')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['SKU', 'Produto', 'Quantidade', 'Qtd. (arredondada)', 'Faltam p/ vender batch']
    const rows = needs.map(n => [
      n.sku,
      n.name,
      n.quantity,
      n.rounded_quantity,
      missingToBatch(n.quantity, n.batch_size)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `producao_${targetDate}.csv`
    link.click()
  }

  const missingToBatch = (quantity, batchSize) => {
    const q = Number(quantity) || 0
    const b = Number(batchSize) || 0
    if (q <= 0 || b <= 1) return 0
    const rem = q % b
    return rem === 0 ? 0 : b - rem
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div className="production-container">
      <div className="page-header">
        <h2>Plano de Produção</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--gray-300)' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={showRounded} onChange={(e) => setShowRounded(e.target.checked)} />
            Arredondar por batch
          </label>
          <button className="btn btn-secondary" onClick={exportCSV}>📥 Exportar CSV</button>
        </div>
      </div>

      <div className="production-summary">
        <div className="summary-card">
          <div className="summary-label">Total de Produtos</div>
          <div className="summary-value">{needs.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total de Unidades</div>
          <div className="summary-value">{needs.reduce((sum, p) => sum + (showRounded ? p.rounded_quantity : p.quantity), 0)}</div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Quantidade</th>
              <th>Qtd. (arredondada)</th>
              <th>Faltam p/ batch</th>
            </tr>
          </thead>
          <tbody>
            {needs.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Nenhum produto para produzir
                </td>
              </tr>
            ) : (
              needs.map((p) => (
                <tr key={p.product_id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sku}</td>
                  <td><span className="production-quantity">{p.quantity}</span></td>
                  <td>{p.rounded_quantity}</td>
                  <td>{missingToBatch(p.quantity, p.batch_size)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>💡 Dica</h3>
        <p style={{ margin: 0, color: 'var(--gray-700)', fontSize: '0.875rem' }}>
          Selecione a data de entrega para ver as necessidades agregadas por produto. Ative o arredondamento para aplicar batches mínimos por produto.
        </p>
      </div>
    </div>
  )
}

export default ProductionView
