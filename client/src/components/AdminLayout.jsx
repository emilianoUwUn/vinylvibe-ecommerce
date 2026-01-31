import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'
import AdminFooter from './AdminFooter'
import '../styles/Layout.css'

export default function AdminLayout() {
  return (
    <div className="layout">
      <AdminNavbar />
      <main className="main-content">
        <Outlet />
      </main>
      <AdminFooter />
    </div>
  )
}
