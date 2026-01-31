import { useState, useEffect } from 'react';
import api from '../../api/axios';
import '../../styles/client/Pages.css';

export default function Catalogo() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  // Estado para cantidades (mapa de vinylId -> quantity)
  const [quantities, setQuantities] = useState({});

  const [cartMessage, setCartMessage] = useState('');

  const genres = ['Hip Hop', 'Alternative', 'R&B', 'Pop', 'Rock', 'Indie', 'Prog Rock', 'Neo Soul', 'Post-Punk', 'Reggaeton'];

  const fetchAlbums = async (query = '') => {
    setLoading(true);
    try {
      let endpoint = '/albums';
      if (query) {
        endpoint = `/vinyls/search?q=${query}`;
      }

      const response = await api.get(endpoint);
      if (response.data.success) {
        // Normalizamos la respuesta: si viene de search es `data`, si es get_albums es `data`
        const data = response.data.data;
        setAlbums(data);

        // Inicializar cantidades en 1
        const initialQuantities = {};
        data.forEach(album => {
          initialQuantities[album.id] = 1;
        });
        setQuantities(prev => ({ ...initialQuantities, ...prev })); // Mantener previos si existen
      } else {
        setError('Error al cargar el catálogo');
      }
    } catch (err) {
      console.error('Error fetching albums:', err);
      setError('Error de conexión al cargar álbumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce para búsqueda
    const delayDebounceFn = setTimeout(() => {
      // Si hay género seleccionado, lo incluimos en la búsqueda si no hay término específico,
      // o combinamos. Por simplicidad, el SP busca en todo.
      // Si el usuario escribe, buscamos eso. Si solo selecciona género, buscamos el género.
      const query = searchTerm || selectedGenre;
      fetchAlbums(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedGenre]);

  const handleQuantityChange = (id, delta, maxStock) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const newValue = Math.min(Math.max(1, current + delta), maxStock);
      return { ...prev, [id]: newValue };
    });
  };

  const addToCart = async (album) => {
    const qty = quantities[album.id] || 1;

    try {
      const response = await api.post('/cart', {
        vinylId: album.id,
        quantity: qty
      });

      if (response.data.success) {
        setCartMessage(`¡Agregado! ${qty}x ${album.title}`);
        setTimeout(() => setCartMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response && err.response.status === 403) {
        alert('Debes iniciar sesión para comprar.');
        // Aquí podrías redirigir al login
      } else {
        alert('Error al agregar al carrito.');
      }
    }
  };

  if (loading && albums.length === 0) return (
    <div className="client-page loading-container">
      <div className="spinner"></div>
      <p>Cargando colección...</p>
    </div>
  );

  return (
    <div className="client-page">
      <div className="catalog-header">
        <h1>Catálogo <span className="highlight">Exclusivo</span></h1>
        <p>Una selección curada de vinilos para el oyente exigente.</p>

        {/* BUSCADOR Y FILTROS */}
        <div className="filters-container">
          <input
            type="text"
            placeholder="Buscar por título, artista..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="genre-select"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">Todos los géneros</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {cartMessage && <div className="cart-toast">{cartMessage}</div>}
      </div>

      <div className="catalog-grid">
        {albums.map((album) => (
          <div key={album.id} className="album-card">
            <div className="album-image-container">
              <img
                src={album.image_url}
                alt={`${album.title} cover`}
                className="album-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300?text=VinylVibe';
                }}
              />
              {album.stock < 5 && album.stock > 0 && (
                <span className="stock-badge low">¡Solo {album.stock}!</span>
              )}
              {album.stock === 0 && (
                <span className="stock-badge out">Agotado</span>
              )}
            </div>

            <div className="album-info">
              <h3 className="album-title">{album.title}</h3>
              <p className="album-artist">{album.artist}</p>

              <div className="album-meta">
                <span className="album-genre">{album.genre}</span>
                <span className="album-price">${Number(album.price).toFixed(2)}</span>
              </div>

              {/* CONTROLES DE CARRITO */}
              <div className="cart-controls">
                {album.stock > 0 ? (
                  <>
                    <div className="qty-selector">
                      <button
                        onClick={() => handleQuantityChange(album.id, -1, album.stock)}
                        className="qty-btn"
                      >-</button>
                      <span className="qty-val">{quantities[album.id] || 1}</span>
                      <button
                        onClick={() => handleQuantityChange(album.id, 1, album.stock)}
                        className="qty-btn"
                      >+</button>
                    </div>
                    <button
                      className="add-btn"
                      onClick={() => addToCart(album)}
                    >
                      Agregar
                    </button>
                  </>
                ) : (
                  <button className="add-btn disabled" disabled>No Disponible</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {albums.length === 0 && !loading && (
        <div className="no-results">
          <p>No se encontraron vinilos con esa búsqueda.</p>
          <button
            className="btn-clear"
            onClick={() => { setSearchTerm(''); setSelectedGenre('') }}
          >
            Ver todos
          </button>
        </div>
      )}
    </div>
  );
}
