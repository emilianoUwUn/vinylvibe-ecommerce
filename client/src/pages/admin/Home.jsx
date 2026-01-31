import { useState, useEffect } from 'react'
import api from '../../api/axios'
import '../../styles/admin/Dashboard.css'

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalInventory: 0,
    lowStockCount: 0
  })

  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const [salesRes, invRes, lowRes] = await Promise.all([
          api.get('/admin/sales-total'),
          api.get('/admin/inventory'),
          api.get('/admin/low-stock?threshold=5')
        ])

        const totalInv = invRes.data.success
          ? invRes.data.data.reduce((acc, item) => acc + (item.stock || 0), 0)
          : 0

        setStats({
          totalSales: salesRes.data.data?.total_sales || 0,
          totalOrders: salesRes.data.data?.total_orders || 0,
          totalInventory: totalInv,
          lowStockCount: lowRes.data.data?.length || 0
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      }
    }
    fetchHomeStats()
  }, [])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value || 0)
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Dashboard Administrativo</h1>
        <p>Estado actual del negocio y control operativo de VinylVibe.</p>
      </header>
      <section className="dashboard-section">
        <h2>📊 Indicadores Clave de Rendimiento (KPIs)</h2>
        <div className="kpi-list">
          <p><strong>Ventas Totales:</strong> {formatCurrency(stats.totalSales)} — <span>Refleja el ingreso bruto de todas las órdenes completadas.</span></p>
          <p><strong>Órdenes Totales:</strong> {stats.totalOrders} — <span>Número total de pedidos procesados en el sistema.</span></p>
          <p><strong>Nivel de Inventario:</strong> {stats.totalInventory} unidades — <span>Total de vinilos disponibles en bodega.</span></p>
          <p><strong>Alertas de Stock Bajo:</strong> {stats.lowStockCount} productos — <span>Productos identificados con menos de 5 unidades.</span></p>
        </div>
      </section>

      <hr />

      <section className="dashboard-section">
        <h2>👥 Gestión de Personal Administrativo</h2>
        <p>Desde este panel se tiene el control sobre el equipo con permisos elevados. Actualmente, el sistema permite:</p>
        <ul>
          <li><strong>Alta de Administradores:</strong> Registro de nuevos usuarios con acceso total al sistema mediante correos corporativos.</li>
        </ul>
      </section>

      <hr />

      <section className="dashboard-section">
        <h2>💿 Control de Existencias (Re-stock)</h2>
        <p>Monitoreo constante del catálogo para evitar quiebres de stock:</p>
        <ul>
          <li><strong>Reposición de Inventario:</strong> Ajuste manual de cantidades para álbumes de alta rotación .</li>
          <li><strong>Alertas de Stock Bajo:</strong> El sistema identifica automáticamente productos con menos de 5 unidades para priorizar su re-abastecimiento.</li>
        </ul>
      </section>
    </div>
  )
}