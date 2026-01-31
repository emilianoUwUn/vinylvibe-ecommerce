import { useState } from 'react'
import api from '../../api/axios'
import { UserPlus, Shield, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react'
import '../../styles/admin/Dashboard.css'

export default function Usuarios() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })

    console.log('🚀 Iniciando creación de nuevo administrador...')
    console.log('📦 Datos a enviar:', { ...formData, password: '***' })

    try {
      const res = await api.post(
        '/admin/staff/create',
        formData
      )

      console.log('✅ Respuesta del servidor:', res.data)

      if (res.data.success) {
        setStatus({
          type: 'success',
          message: `¡Administrador ${res.data.data.first_name} creado exitosamente!`
        })
        console.log('🎉 Operación completada con éxito')
        // Limpiar formulario
        setFormData({ firstName: '', lastName: '', email: '', password: '' })
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al conectar con el servidor'
      console.error('❌ Error en la creación:', errorMsg)
      console.error('🔍 Detalles del error:', err.response || err)

      setStatus({
        type: 'error',
        message: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Gestión de Personal</h1>
          <p>Creación de nuevos accesos administrativos al sistema.</p>
        </div>
      </header>

      <div className="create-admin-container">
        <div className="create-card">
          <div className="card-header">
            <div className="icon-badge">
              <UserPlus size={24} />
            </div>
            <h2>Nuevo Administrador</h2>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            {status.message && (
              <div className={`status-banner ${status.type}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.message}
              </div>
            )}

            <div className="form-grid">
              <div className="input-group">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Ej. Ana"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Apellido</label>
                <input
                  type="text"
                  placeholder="Ej. García"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Correo Electrónico (Corporativo)</label>
              <input
                type="email"
                placeholder="usuario@vinylvibe.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Contraseña Temporal</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength="8"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="security-note">
              <Shield size={14} />
              <span>Este usuario tendrá permisos completos de administración.</span>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCcw size={18} className="spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Crear Administrador
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .create-admin-container {
          display: flex;
          justify-content: center;
          padding: 2rem 0;
          animation: slideUp 0.4s ease-out;
        }

        .create-card {
          background: white;
          width: 100%;
          max-width: 550px;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }

        .card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .icon-badge {
          width: 56px;
          height: 56px;
          background: #f1f5f9;
          color: #1a202c;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-banner.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-banner.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .input-group {
          margin-bottom: 1.25rem;
        }

        .input-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .input-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.95rem;
          transition: all 0.2s;
          outline: none;
        }

        .input-group input:focus {
          border-color: #1a202c;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.03);
        }

        .security-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fffbeb;
          color: #92400e;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }

        .submit-btn {
          width: 100%;
          padding: 0.875rem;
          background: #1a202c;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #334155;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .create-card { padding: 1.5rem; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
