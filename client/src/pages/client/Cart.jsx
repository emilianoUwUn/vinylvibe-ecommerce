import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import '../../styles/client/Pages.css';

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCart = async () => {
        try {
            const response = await api.get('/cart');
            if (response.data.success) {
                setCartItems(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await api.put(`/cart/${itemId}`, { quantity: newQuantity });
            fetchCart();
        } catch (error) {
            console.error('Error updating quantity:', error);
            showToast('Error al actualizar cantidad', 'error');
        }
    };

    const removeItem = async (itemId) => {
        // Eliminación directa sin confirmación, con feedback visual
        try {
            await api.delete(`/cart/${itemId}`);
            fetchCart();
            window.dispatchEvent(new Event('cartUpdated'));
            showToast('Producto eliminado', 'success');
        } catch (error) {
            console.error('Error removing item:', error);
            showToast('Error al eliminar producto', 'error');
        }
    };

    const emptyCart = async () => {
        try {
            await api.delete('/cart');
            setCartItems([]);
            // Dispara evento para actualizar badges en header si los hubiera
            window.dispatchEvent(new Event('cartUpdated'));
            showToast('Carrito vaciado', 'success');
        } catch (error) {
            console.error('Error emptying cart:', error);
            showToast('Error al vaciar el carrito', 'error');
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + Number(item.subtotal), 0);
    };

    if (loading) return <div className="client-page loading-container"><div className="spinner"></div></div>;

    return (
        <div className="client-page">
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                }}>
                    {toast.message}
                </div>
            )}

            <h1>Tu Carrito</h1>

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <p>Tu carrito está vacío.</p>
                    <button onClick={() => navigate('/catalogo')} className="btn-continue">
                        Ir al Catálogo
                    </button>
                </div>
            ) : (
                <div className="cart-container">
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image_url} alt={item.title} className="cart-item-img" />
                                <div className="cart-item-details">
                                    <h3>{item.title}</h3>
                                    <p className="artist">{item.artist}</p>
                                </div>
                                <div className="cart-item-price">
                                    <div className="qty-selector" style={{ justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                        <button className="qty-btn" onClick={() => updateQuantity(item.vinyl_id, item.quantity - 1)}>-</button>
                                        <span className="qty-val">{item.quantity}</span>
                                        <button className="qty-btn" onClick={() => updateQuantity(item.vinyl_id, item.quantity + 1)}>+</button>
                                        <button className="btn-trash" onClick={() => removeItem(item.vinyl_id)}>🗑️</button>
                                    </div>
                                    <p className="price">${Number(item.subtotal).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h2>Resumen</h2>
                        <div className="summary-row total">
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>

                        <div className="cart-controls">
                            <button
                                className="btn-checkout"
                                onClick={() => navigate('/client/checkout')}
                            >
                                Proceder al Pago
                            </button>

                            <button className="btn-empty" onClick={emptyCart}>
                                Vaciar Carrito
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
