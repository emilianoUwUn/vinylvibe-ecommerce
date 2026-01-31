import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated'
import './App.css'

// Layout
import ClientLayout from './components/ClientLayout'
import AdminLayout from './components/AdminLayout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Client pages
import ClientHome from './pages/client/Home'
import Catalogo from './pages/client/Catalogo'
import Cart from './pages/client/Cart'
import Checkout from './pages/client/Checkout'
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
          {/* Auth Routes - Protegidas para usuarios ya logueados */}
          <Route
            path="/"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <Register />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectIfAuthenticated>
                <ForgotPassword />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/reset-password"
            element={
              <RedirectIfAuthenticated>
                <ResetPassword />
              </RedirectIfAuthenticated>
            }
          />

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
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/checkout"
              element={
                <ProtectedRoute requiredRole="client">
                  <Checkout />
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