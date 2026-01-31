import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.post('/register', formData)
            const data = response.data

            if (data.success) {
                setSuccess('Cuenta creada exitosamente. Redirigiendo...')
                setTimeout(() => {
                    navigate('/')
                }, 2000)
            } else {
                setError(data.error || 'Error al crear cuenta')
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error)
            } else {
                setError('Error de conexión')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div style={{ width: '100%', maxWidth: '32rem' }}>
                <div className="header" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 300, color: '#1F2937', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                        Únete a la <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#EA580C' }}>experiencia</span>
                    </h2>
                    <div style={{ width: '4rem', height: '1px', backgroundColor: '#EA580C', margin: '0 auto 1rem' }}></div>
                    <p className="subtitle">Coleccionista exclusivo</p>
                </div>

                <div className="card" style={{ padding: '2.5rem' }}>
                    <form className="form" style={{ gap: '1.5rem' }} onSubmit={handleSubmit}>
                        <div className="grid-2">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Nombre"
                                className="input"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Apellido"
                                className="input"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Correo electrónico"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Contraseña"
                                className="input"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="terms"
                                className="checkbox"
                                required
                            />
                            <label htmlFor="terms" className="checkbox-label">
                                Acepto los términos de servicio y política de privacidad de VinylVibe
                            </label>
                        </div>

                        {error && (
                            <p style={{ color: '#DC2626', fontSize: '0.875rem', textAlign: 'center' }}>
                                {error}
                            </p>
                        )}

                        {success && (
                            <p style={{ color: '#059669', fontSize: '0.875rem', textAlign: 'center' }}>
                                {success}
                            </p>
                        )}

                        <button type="submit" className="btn btn-orange" style={{ marginTop: '2rem' }} disabled={loading}>
                            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </button>
                    </form>

                    <div className="links">
                        <div className="separator">
                            <div style={{ width: '3rem', height: '1px', backgroundColor: '#D1D5DB' }}></div>
                            <span className="separator-text">o</span>
                            <div style={{ width: '3rem', height: '1px', backgroundColor: '#D1D5DB' }}></div>
                        </div>
                        <Link to="/" className="link" style={{ textTransform: 'uppercase' }}>
                            Ya tengo cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
