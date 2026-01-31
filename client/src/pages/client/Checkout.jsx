import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import '../../styles/client/Pages.css';

export default function Checkout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Address, 2: Confirmation
    const [orderId, setOrderId] = useState(null);
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    const [formData, setFormData] = useState({
        country: '',
        state: '',
        city: '',
        address1: '',
        address2: '',
        zip: ''
    });

    const [termsAccepted, setTermsAccepted] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/checkout', formData);
            if (response.data.success) {
                setOrderId(response.data.orderId);
                setStep(2);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            showToast('Error al procesar la orden. Verifique los datos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalPayment = async () => {
        if (!termsAccepted) {
            showToast('Debes aceptar los términos y condiciones.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/orders/pay', { orderId });
            if (response.data.success) {
                showToast('¡Compra exitosa! Enviando a casa...', 'success');
                setTimeout(() => navigate('/client/home'), 2000);
            }
        } catch (err) {
            console.error('Payment error:', err);
            showToast('Error en el pago. Intente nuevamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="client-page checkout-page">
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/carrito')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#374151', padding: '0 0.5rem' }}>
                    ← Volver
                </button>
                <h1 style={{ margin: 0 }}>Finalizar Compra</h1>
            </div>

            {step === 1 ? (
                <form onSubmit={handleAddressSubmit} className="checkout-form">
                    <h2>1. Datos de Envío</h2>
                    <div className="form-group">
                        <label>País</label>
                        <input type="text" name="country" required value={formData.country} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Estado</label>
                            <input type="text" name="state" required value={formData.state} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input type="text" name="city" required value={formData.city} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Dirección (Calle y Número)</label>
                        <input type="text" name="address1" required value={formData.address1} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Apartamento / Unidad (Opcional)</label>
                            <input type="text" name="address2" value={formData.address2} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Código Postal</label>
                            <input type="text" name="zip" required value={formData.zip} onChange={handleChange} />
                        </div>
                    </div>

                    <button type="submit" className="btn-next" disabled={loading}>
                        {loading ? 'Procesando...' : 'Continuar al Pago'}
                    </button>
                </form>
            ) : (
                <div className="confirmation-box">
                    <h2>2. Confirmación de Pago</h2>
                    <p className="order-id">Orden #{orderId}</p>
                    <p>Por favor confirma los detalles y finaliza tu compra.</p>

                    <div className="terms-box">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <label htmlFor="terms">Acepto los términos y condiciones de la compra.</label>
                    </div>

                    <button
                        onClick={handleFinalPayment}
                        className={`btn-pay ${!termsAccepted ? 'disabled' : ''}`}
                        disabled={!termsAccepted || loading}
                    >
                        {loading ? 'Confirmando...' : 'Pagar y Finalizar'}
                    </button>
                </div>
            )}
        </div>
    );
}
