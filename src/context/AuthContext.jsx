
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'acrembura_access_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const { access_token: accessToken, user: authenticatedUser } =
      result.data

    if (!accessToken || !authenticatedUser) {
      throw new Error('The server returned incomplete login details.')
    }

    localStorage.setItem(TOKEN_KEY, accessToken)
    setUser(authenticatedUser)

    return authenticatedUser
  }, [])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        if (active) setLoading(false)
        return
      }

      try {
        const result = await apiRequest('/auth/me')

        if (active) setUser(result.data)
      } catch {
        localStorage.removeItem(TOKEN_KEY)

        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    const handleUnauthorized = () => {
      if (active) logout()
    }

    window.addEventListener('acrembura:unauthorized', handleUnauthorized)

    return () => {
      active = false
      window.removeEventListener(
        'acrembura:unauthorized',
        handleUnauthorized
      )
    }
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isOwner: user?.role === 'owner',
      isReceptionist: user?.role === 'receptionist',
    }),
    [user, loading, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
