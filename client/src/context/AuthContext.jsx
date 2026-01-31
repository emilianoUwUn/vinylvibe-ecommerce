import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('userName')
    const role = localStorage.getItem('role')
    
    if (token && userName && role) {
      setUser({ userName, role })
    }
    setLoading(false)
  }, [])

  const login = (token, userName, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userName', userName)
    localStorage.setItem('role', role)
    setUser({ userName, role })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('role')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
