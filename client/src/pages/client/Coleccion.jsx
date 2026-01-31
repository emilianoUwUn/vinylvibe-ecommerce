import { useState, useEffect } from 'react';
import api from '../../api/axios';
import '../../styles/client/Pages.css';

export default function Coleccion() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollection();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await api.get('/collection');
      if (response.data.success) {
        setCollection(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
      setError('Error al cargar tu colección');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="client-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando tu colección...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-page">
        <div style={{ textAlign: 'center', padding: '40px', color: '#DC2626' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '300', marginBottom: '0.5rem' }}>
          Mi Colección 🎵
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          {collection.length > 0
            ? `${collection.length} vinilos en tu colección personal`
            : 'Aún no has comprado ningún vinilo'}
        </p>
      </div>

      {collection.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#FAFAF5',
          borderRadius: '8px',
          border: '1px dashed #E5E5D5'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</p>
          <h3 style={{ marginBottom: '0.5rem', color: '#1A1A1A' }}>Tu colección está vacía</h3>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
            Explora el catálogo y comienza tu colección de vinilos
          </p>
          <a
            href="/catalogo"
            style={{
              display: 'inline-block',
              backgroundColor: '#EA580C',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
          >
            Ver Catálogo
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {collection.map((vinyl) => (
            <div
              key={vinyl.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(234, 88, 12, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                position: 'relative',
                paddingTop: '100%',
                backgroundColor: '#F5F5DC'
              }}>
                <img
                  src={vinyl.image_url}
                  alt={vinyl.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: '#1A1A1A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {vinyl.title}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#6B7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {vinyl.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
