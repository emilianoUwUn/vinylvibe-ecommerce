import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      const data = response.data;

      if (data.success) {
        login(data.token, data.user.firstName, data.user.role);

        if (data.user.role === 'admin') {
          navigate('/admin/home');
        } else {
          navigate('/client/home');
        }
      } else {
        // This might not be reached if axios throws on error status, but protecting just in case API returns success: false with 200 OK
        setError(data.error || 'Error al iniciar sesión');
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
          <h1 className="title">
            Vinyl<span className="title-accent">V</span>ibe
          </h1>
          <div className="divider"></div>
          <p className="subtitle">Curated Analog Experience</p>
        </div>

        <div className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Contraseña"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p style={{ color: '#DC2626', fontSize: '0.875rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>

          <div className="links">
            <Link to="/forgot-password" className="link">
              ¿Olvidaste tu contraseña?
            </Link>
            <div className="separator">
              <div className="separator-line"></div>
              <span className="separator-text">o</span>
              <div className="separator-line"></div>
            </div>
            <Link to="/register" className="link" style={{ fontWeight: 500, textTransform: 'uppercase' }}>
              Crear cuenta nueva
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};