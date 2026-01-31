import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) return <div>Cargando...</div>

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/home' : '/client/home'} replace />
  }

  return children
}
