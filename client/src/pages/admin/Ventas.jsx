import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { DollarSign, Package, Users, TrendingUp, Calendar, RefreshCcw } from 'lucide-react'
import '../../styles/admin/Dashboard.css'

export default function Ventas() {
  const [report, setReport] = useState([])
  const [totals, setTotals] = useState({ total_sales: 0, total_orders: 0, total_customers: 0 })
  const [topSelling, setTopSelling] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reportRes, totalsRes, topRes] = await Promise.all([
        api.get('/admin/sales-report'),
        api.get('/admin/sales-total'),
        api.get('/admin/top-selling')
      ])

      if (reportRes.data.success) {
        console.log('📊 Admin Report Data:', reportRes.data.data);
        if (reportRes.data.data.length > 0) {
          console.log('🔍 First Record Keys:', Object.keys(reportRes.data.data[0]));
        }
        setReport(reportRes.data.data)
      }
      if (totalsRes.data.success) {
        console.log('💰 Admin Totals Data:', totalsRes.data.data);
        setTotals(totalsRes.data.data)
      }
      if (topRes.data.success) {
        console.log('🏆 Admin Top Selling Data:', topRes.data.data);
        setTopSelling(topRes.data.data)
      }
    } catch (err) {
      console.error('Error fetching sales data:', err)
      setError('No se pudo cargar la información de ventas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Fecha inválida'
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value) => {
    // Asegurarse de que el valor sea un número
    const numValue = parseFloat(value) || 0
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numValue)
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-state">Cargando reporte de ventas...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Gestión de Ventas</h1>
          <p>Visualiza el rendimiento de tu tienda y el historial de transacciones.</p>
        </div>
        <button className="refresh-btn" onClick={fetchData} title="Actualizar datos">
          <RefreshCcw size={20} />
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Ingresos Totales</h3>
            <div className="stat-value">{formatCurrency(totals.total_sales || totals.total_ventas || totals.total || 0)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>Órdenes</h3>
            <div className="stat-value">{totals.total_orders || totals.total_ordenes || totals.ordenes || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Clientes Únicos</h3>
            <div className="stat-value">{totals.total_customers || totals.total_clientes || totals.clientes || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Promedio de Venta</h3>
            <div className="stat-value">
              {formatCurrency(
                (totals.total_orders || totals.total_ordenes || totals.ordenes) > 0
                  ? (totals.total_sales || totals.total_ventas || totals.total) / (totals.total_orders || totals.total_ordenes || totals.ordenes)
                  : 0
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="table-container">
          <div className="table-header">
            <h2>Reporte de Ventas Recientes</h2>
            <div className="badge badge-success">Actualizado</div>
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>ID Orden</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {report.length > 0 ? (
                  report.map((sale, index) => {
                    // Mapeo inteligente - Busca por nombres comunes o por tipo de dato
                    const keys = Object.keys(sale);

                    // 1. Detectar ID
                    const id = sale.order_id || sale.id || sale.ID || index + 1;

                    // 2. Detectar Nombre
                    const name = sale.customer_name || sale.first_name || sale.nombre || sale.CLIENTE || sale.nombre_completo ||
                      keys.find(k => k.toLowerCase().includes('nombre')) || 'Cliente';

                    // 3. Detectar Email
                    const email = sale.customer_email || sale.email || sale.correo || sale.EMAIL || 'N/A';

                    // 4. Detectar Fecha (busca por nombre o por formato de string de fecha)
                    let date = sale.order_date || sale.fecha || sale.created_at || sale.FECHA || sale.fecha_orden;
                    if (!date) {
                      date = keys.find(k => {
                        const val = String(sale[k]);
                        return val.match(/^\d{4}-\d{2}-\d{2}/) || (val.includes('T') && val.includes(':'));
                      }) ? sale[keys.find(k => String(sale[k]).match(/^\d{4}-\d{2}-\d{2}/))] : null;
                    }

                    // 5. Detectar Total (busca por nombre o por el valor más alto numérico que no sea ID)
                    let total = sale.total_amount || sale.total_price || sale.total || sale.monto || sale.TOTAL || sale.precio_total;
                    if (!total) {
                      // Buscar una columna que parezca un precio (número decimal alto o que contenga 'total/monto' en el nombre)
                      const possibleTotalKey = keys.find(k => k.toLowerCase().includes('total') || k.toLowerCase().includes('monto') || k.toLowerCase().includes('price') || k.toLowerCase().includes('precio'));
                      if (possibleTotalKey) total = sale[possibleTotalKey];
                    }

                    return (
                      <tr key={`sale-${index}`}>
                        <td>#{id}</td>
                        <td>{name} {sale.last_name || ''}</td>
                        <td>{email}</td>
                        <td>{formatDate(date)}</td>
                        <td>{formatCurrency(total)}</td>
                        <td>
                          <span className={`badge ${parseFloat(total) > 0 ? 'badge-success' : 'badge-pending'}`}>
                            Completado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No hay ventas registradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h2>Vinilos Más Vendidos</h2>
            <TrendingUp size={20} color="#D4AF37" />
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Artista</th>
                  <th>Unidades Vendidas</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topSelling.length > 0 ? (
                  topSelling.map((item, index) => {
                    const title = item.title || item.titulo || item.TITLE || 'Vinilo';
                    const artist = item.artist || item.artista || item.ARTIST || 'Artista';
                    const sold = item.total_sold || item.vendidos || item.cantidad || item.CANTIDAD || 0;
                    const revenue = item.total_revenue || item.total_price || item.ingresos || item.total || 0;

                    return (
                      <tr key={index}>
                        <td>{title}</td>
                        <td>{artist}</td>
                        <td>{sold}</td>
                        <td>{formatCurrency(revenue)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No hay datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Script de depuración temporal para ver los nombres reales de las columnas en la consola del navegador */}
      {process.env.NODE_ENV === 'development' && report.length > 0 && (
        <script dangerouslySetInnerHTML={{ __html: `console.log('Estructura de datos report:', ${JSON.stringify(report[0])})` }} />
      )}
    </div>
  )
}
