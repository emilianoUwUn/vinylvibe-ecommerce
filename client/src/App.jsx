import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Layout
import ClientLayout from './components/ClientLayout'
import AdminLayout from './components/AdminLayout'

// Auth pages
import Login from './pages/login'
import Register from './pages/register'
import ResetPassword from './pages/ResetPassword'

// Client pages
import ClientHome from './pages/client/Home'
import Catalogo from './pages/client/Catalogo'
import Carrito from './pages/client/Carrito'
import Coleccion from './pages/client/Coleccion'

// Admin pages
import AdminHome from './pages/admin/Home'
import Productos from './pages/admin/Productos'
import Usuarios from './pages/admin/Usuarios'
import Ventas from './pages/admin/Ventas'

export default function App() {
  console.log('🎧 App component renderizado')

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes - Sin protección */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Client Routes - Con protección */}
          <Route element={<ClientLayout />}>
            <Route 
              path="/client/home" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientHome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/catalogo" 
              element={
                <ProtectedRoute requiredRole="client">
                  <Catalogo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/carrito" 
              element={
                <ProtectedRoute requiredRole="client">
                  <Carrito />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/coleccion" 
              element={
                <ProtectedRoute requiredRole="client">
                  <Coleccion />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Admin Routes - Con protección */}
          <Route element={<AdminLayout />}>
            <Route 
              path="/admin/home" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminHome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/productos" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Productos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/usuarios" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Usuarios />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/ventas" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Ventas />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}