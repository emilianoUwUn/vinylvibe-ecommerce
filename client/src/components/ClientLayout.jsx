import { Outlet } from 'react-router-dom'
import ClientNavbar from './ClientNavbar'
import ClientFooter from './ClientFooter'
import '../styles/Layout.css'

export default function ClientLayout() {
  return (
    <div className="layout">
      <ClientNavbar />
      <main className="main-content">
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  )
}
