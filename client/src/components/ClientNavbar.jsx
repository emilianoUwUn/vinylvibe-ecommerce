import { useContext, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../styles/ClientNavbar.css'

export default function ClientNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const navItems = [
    { path: '/client/home', label: 'Home' },
    { path: '/catalogo', label: 'Catálogo' },
    { path: '/carrito', label: 'Carrito' },
    { path: '/coleccion', label: 'Colección' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const handleNavClick = () => {
    setMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/client/home" className="logo">
          Vinyl<span className="logo-accent">V</span>ibe
        </Link>
      </div>

      <div className={`navbar-center ${menuOpen ? 'active' : ''}`}>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-right" ref={menuRef}>
        <div className="user-section desktop-only">
          <div className="user-info">
            <span className="user-greeting">Hola,</span>
            <span className="user-name">{user?.userName || 'Invitado'}</span>
          </div>
          <button className="logout-btn-desktop" onClick={handleLogout}>
            Salir
          </button>
        </div>

        <button 
          className={`hamburger ${menuOpen ? 'active' : ''}`} 
          onClick={toggleMenu} 
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {menuOpen && (
          <div className="mobile-dropdown-menu active">
            <ul className="mobile-nav-menu">
              {navItems.map(item => (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="menu-divider"></div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
