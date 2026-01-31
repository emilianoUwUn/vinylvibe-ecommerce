import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Plus, Minus, RotateCcw, Search, AlertTriangle, RefreshCcw, Package, Disc, Check } from 'lucide-react'
import '../../styles/admin/Dashboard.css'

export default function Productos() {
  const [inventory, setInventory] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)

  // Estado para los contadores individuales por producto
  const [quantities, setQuantities] = useState({})

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invRes, lowRes] = await Promise.all([
        api.get('/admin/inventory'),
        api.get('/admin/low-stock?threshold=5')
      ])

      if (invRes.data.success) {
        setInventory(invRes.data.data)
        // Inicializar contadores a 1
        const initialQtys = {}
        invRes.data.data.forEach(item => {
          initialQtys[item.id] = 1
        })
        setQuantities(initialQtys)
      }
      if (lowRes.data.success) setLowStock(lowRes.data.data)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('No se pudo cargar el inventario. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateQuantity = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }))
  }

  const handleUpdateStock = async (vinylId, operation) => {
    const qty = quantities[vinylId] || 1
    try {
      const res = await api.put(`/admin/inventory/${vinylId}/stock`, {
        quantity: qty,
        operation
      })

      if (res.data.success) {
        setInventory(prev => prev.map(item =>
          item.id === vinylId ? { ...item, stock: res.data.data.new_stock } : item
        ))
        // Resetear contador a 1 después de confirmar
        setQuantities(prev => ({ ...prev, [vinylId]: 1 }))

        // Notificación visual opcional (puedes usar un toast aquí)
        console.log('Stock actualizado correctamente');
      }
    } catch (err) {
      console.error('Error updating stock:', err)
      alert('Error al actualizar el stock: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleResetStock = async (vinylId) => {
    if (!window.confirm('¿Estás seguro de que quieres resetear el stock de este producto a 0?')) return

    try {
      const res = await api.post(`/admin/inventory/${vinylId}/reset`, {})
      if (res.data.success) {
        setInventory(prev => prev.map(item =>
          item.id === vinylId ? { ...item, stock: 0 } : item
        ))
      }
    } catch (err) {
      console.error('Error resetting stock:', err)
      alert('Error al resetear el stock')
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterLowStock ? (item.stock || 0) <= 5 : true
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value || 0)
  }

  if (loading && inventory.length === 0) {
    return (
      <div className="admin-page inventory-page">
        <div className="loading-state">Cargando inventario...</div>
      </div>
    )
  }

  return (
    <div className="admin-page inventory-page">
      <header className="page-header">
        <div>
          <h1>Gestión de Inventario</h1>
          <p>Control de existencias y re-stock operativo.</p>
        </div>
        <button className="refresh-btn" onClick={fetchData} title="Actualizar datos">
          <RefreshCcw size={20} />
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid inventory-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Disc size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Productos</h3>
            <div className="stat-value">{inventory.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>Alertas de Stock</h3>
            <div className="stat-value">{lowStock.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>Existencias Totales</h3>
            <div className="stat-value">
              {inventory.reduce((acc, item) => acc + (item.stock || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar vinilo o artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={() => setFilterLowStock(!filterLowStock)}
            />
            <span className="checkmark"></span>
            Ver solo stock bajo (≤ 5)
          </label>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Catálogo de Existencias</h2>
          <div className="item-count">{filteredInventory.length} Vinilos</div>
        </div>
        <div className="scrollable-table">
          <table className="inventory-table">
            <thead>
              <tr>
                <th width="40%">Producto</th>
                <th width="15%">Precio</th>
                <th width="15%">Existencia</th>
                <th width="30%" style={{ textAlign: 'center' }}>Operación de Re-stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-info-cell">
                        <div className="img-wrapper">
                          <img src={item.image_url} alt={item.title} />
                        </div>
                        <div className="text-wrapper">
                          <div className="title">{item.title}</div>
                          <div className="artist">{item.artist}</div>
                          <div className="genre">{item.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="price-tag">{formatCurrency(item.price)}</div>
                    </td>
                    <td>
                      <div className={`stock-status-badge ${item.stock === 0 ? 'empty' : item.stock <= 5 ? 'critical' : 'ok'}`}>
                        {item.stock} uni.
                      </div>
                    </td>
                    <td>
                      <div className="stock-actions-container">
                        <div className="quantity-counter">
                          <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                          <input type="number" readOnly value={quantities[item.id] || 1} />
                          <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                        </div>

                        <div className="button-group">
                          <button
                            className="btn-confirm add"
                            onClick={() => handleUpdateStock(item.id, 'add')}
                            title="Confirmar adición"
                          >
                            <Check size={16} /> Agregar
                          </button>

                          <button
                            className="btn-small-icon reset"
                            onClick={() => handleResetStock(item.id)}
                            title="Resetear a 0"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-row">No se encontraron productos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
