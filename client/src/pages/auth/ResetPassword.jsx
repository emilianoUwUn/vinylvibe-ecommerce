import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        // Extraer token de la URL
        const token = searchParams.get('token');

        if (!token) {
            setError('Token de recuperación no válido');
            return;
        }

        try {
            // Decodificar el token JWT (solo la parte del payload)
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Verificar si el token ha expirado
            if (payload.exp * 1000 < Date.now()) {
                setError('El enlace ha expirado. Solicita uno nuevo.');
                return;
            }

            // Verificar que sea un token de reset
            if (payload.purpose !== 'password-reset') {
                setError('Token no válido para esta operación');
                return;
            }

            setEmail(payload.email);
            setTokenValid(true);
            console.log('✅ Token válido para:', payload.email);
        } catch (err) {
            console.error('Error al decodificar token:', err);
            setError('Token inválido o corrupto');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validaciones
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            console.log('📤 Enviando reset para email:', email);
            const response = await api.post('/reset-password', {
                email: email,
                newPassword: newPassword
            });

            if (response.data.success) {
                setMessage('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setError(response.data.error || 'Error al actualizar contraseña');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error);
            } else {
                setError('Error de conexión');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid && !error) {
        return (
            <div className="container">
                <div className="form-container">
                    <p>Verificando enlace...</p>
                </div>
            </div>
        );
    }

    if (error && !tokenValid) {
        return (
            <div className="container">
                <div className="form-container">
                    <div className="header">
                        <h2 style={{ color: '#DC2626' }}>❌ Error</h2>
                        <p>{error}</p>
                    </div>
                    <Link to="/forgot-password" className="btn">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="form-container">
                <div className="header">
                    <h1 className="title">
                        Vinyl<span className="title-accent">V</span>ibe
                    </h1>
                    <div className="divider"></div>
                    <p className="subtitle">Nueva Contraseña</p>
                </div>

                <div className="card">
                    <form className="form" onSubmit={handleSubmit}>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Ingresa tu nueva contraseña para <strong>{email}</strong>
                        </p>

                        <div className="input-group">
                            <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                placeholder="Nueva contraseña"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Confirmar contraseña"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p style={{ color: '#DC2626', fontSize: '0.875rem', textAlign: 'center' }}>
                                {error}
                            </p>
                        )}

                        {message && (
                            <p style={{ color: '#059669', fontSize: '0.875rem', textAlign: 'center' }}>
                                {message}
                            </p>
                        )}

                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>

                    <div className="links">
                        <Link to="/" className="link">
                            ← Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
