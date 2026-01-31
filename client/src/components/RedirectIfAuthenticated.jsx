import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function RedirectIfAuthenticated({ children }) {
    const { user, loading } = useContext(AuthContext)

    if (loading) return <div>Cargando...</div>

    if (user) {
        // Si ya está autenticado, redirigir a su área correspondiente
        return <Navigate to={user.role === 'admin' ? '/admin/home' : '/client/home'} replace />
    }

    // Si no está autenticado, mostrar el componente (Login, Register, etc.)
    return children
}
