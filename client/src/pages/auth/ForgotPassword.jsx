import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/forgot-password', { email });
            const data = response.data;

            if (data.success) {
                setMessage('Email de recuperación enviado. Revisa tu bandeja de entrada.');
            } else {
                setError(data.error || 'Error al enviar email');
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

    return (
        <div className="container">
            <div className="form-container">
                <div className="header">
                    <div className="icon-container">
                        <span className="icon">?</span>
                    </div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 300, color: '#1F2937', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                        ¿Perdiste el <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#EA580C' }}>ritmo</span>?
                    </h2>
                    <div style={{ width: '3rem', height: '1px', backgroundColor: '#EA580C', margin: '0 auto 1rem' }}></div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6, maxWidth: '20rem', margin: '0 auto' }}>
                        No te preocupes, te ayudaremos a recuperar el acceso a tu colección musical.
                    </p>
                </div>

                <div className="card">
                    <form className="form" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Tu correo electrónico"
                            className="input input-center"
                            style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

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
                            {loading ? 'Enviando...' : 'Enviar instrucciones'}
                        </button>
                    </form>

                    <div className="links">
                        <p className="info-text text-center">
                            Recibirás un enlace para restablecer tu contraseña en tu correo electrónico.
                        </p>

                        <div className="separator">
                            <div className="separator-line"></div>
                            <span className="separator-text">o</span>
                            <div className="separator-line"></div>
                        </div>

                        <Link to="/" className="link" style={{ textTransform: 'uppercase' }}>
                            Regresar al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
