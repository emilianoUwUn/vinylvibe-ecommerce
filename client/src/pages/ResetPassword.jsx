import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  console.log('🔄 ResetPassword MONTADO')
  
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [step, setStep] = useState(token ? 'reset' : 'request')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('📋 useEffect ejecutado')
    console.log('🔑 Token desde URL:', token || 'NO PRESENTE')
    console.log('📋 Step actual:', step)
    console.log('🎯 URL completa:', window.location.href)
  }, [token])

  // Paso 1: Solicitar email
  const handleRequestReset = async (e) => {
    e.preventDefault()
    console.log('📧 [PASO 1] Solicitando reset para:', email)
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('📤 Enviando POST a /api/forgot-password')
      const res = await fetch('http://localhost:3001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      console.log('✅ Respuesta servidor:', data)
      
      if (res.ok) {
        console.log('✅ Email enviado correctamente')
        setMessage('Email de recuperación enviado. Revisa tu bandeja de entrada.')
        setEmail('')
      } else {
        console.log('❌ Error en respuesta:', data.error)
        setError(data.error || 'Error al enviar email')
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err)
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: Resetear contraseña con token
  const handleResetPassword = async (e) => {
    e.preventDefault()
    console.log('🔄 [PASO 2] Reseteando contraseña')
    console.log('🔑 Token:', token)
    console.log('🔒 Nueva contraseña:', newPassword ? '✅ Presente' : '❌ Vacía')
    console.log('🔒 Confirmar:', confirmPassword ? '✅ Presente' : '❌ Vacía')

    if (newPassword !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden')
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      console.log('❌ Contraseña muy corta')
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('📤 Enviando POST a /api/reset-password')
      console.log('   - token:', token)
      console.log('   - newPassword: ✅ Presente')
      
      const res = await fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          newPassword
        })
      })
      
      const data = await res.json()
      console.log('✅ Respuesta servidor:', data)
      
      if (res.ok) {
        console.log('✅ Contraseña actualizada correctamente')
        setMessage('✅ Contraseña actualizada exitosamente. Redirigiendo...')
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /')
          navigate('/')
        }, 2000)
      } else {
        console.log('❌ Error:', data.error)
        setError(data.error || 'Error al resetear contraseña')
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err)
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  console.log('🎨 Renderizando componente. Step actual:', step)

  return (
    <div className="container">
      <div className="form-container">
        <div className="header">
          <h1 className="title">
            Vinyl<span className="title-accent">V</span>ibe
          </h1>
          <div className="divider"></div>
          <p className="subtitle">
            {step === 'request' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
          </p>
        </div>

        <div className="card">
          {/* PASO 1: Solicitar Email */}
          {step === 'request' && (
            <>
              <p style={{color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6', textAlign: 'center'}}>
                Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña.
              </p>

              <form className="form" onSubmit={handleRequestReset}>
                <div className="input-group">
                  <input 
                    type="email" 
                    placeholder="Ingresa tu email" 
                    className="input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      console.log('✏️ Email actualizado:', e.target.value)
                    }}
                    required
                  />
                </div>
                
                {error && (
                  <p style={{color: '#DC2626', fontSize: '0.875rem', textAlign: 'center', marginBottom: '0.5rem'}}>
                    ❌ {error}
                  </p>
                )}
                
                {message && (
                  <p style={{color: '#059669', fontSize: '0.875rem', textAlign: 'center', marginBottom: '0.5rem'}}>
                    ✅ {message}
                  </p>
                )}
                
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? '⏳ Enviando...' : '📧 Enviar Email'}
                </button>
              </form>
            </>
          )}

          {/* PASO 2: Resetear Contraseña */}
          {step === 'reset' && (
            <>
              <p style={{color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6', textAlign: 'center'}}>
                Ingresa tu nueva contraseña
              </p>

              <form className="form" onSubmit={handleResetPassword}>
                <div className="input-group">
                  <input 
                    type="password" 
                    placeholder="Nueva contraseña" 
                    className="input"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      console.log('✏️ Nueva contraseña actualizada')
                    }}
                    required
                  />
                  <input 
                    type="password" 
                    placeholder="Confirmar contraseña" 
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      console.log('✏️ Confirmar contraseña actualizada')
                    }}
                    required
                  />
                </div>
                
                {error && (
                  <p style={{color: '#DC2626', fontSize: '0.875rem', textAlign: 'center', marginBottom: '0.5rem'}}>
                    ❌ {error}
                  </p>
                )}
                
                {message && (
                  <p style={{color: '#059669', fontSize: '0.875rem', textAlign: 'center', marginBottom: '0.5rem'}}>
                    ✅ {message}
                  </p>
                )}
                
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? '⏳ Actualizando...' : '🔒 Actualizar Contraseña'}
                </button>
              </form>
            </>
          )}

          <div className="links">
            <Link 
              to="/" 
              className="link"
              onClick={() => console.log('🔙 Click en volver al login')}
            >
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}