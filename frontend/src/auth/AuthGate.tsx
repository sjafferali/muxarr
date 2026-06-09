import { useEffect, useState, type ReactNode } from 'react'
import { fetchAuthStatus, login as loginRequest } from '../api/auth'
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './context'
import Login from './Login'

export default function AuthGate({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [passwordLogin, setPasswordLogin] = useState(false)
  const [authed, setAuthed] = useState(() => !!getToken())

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false))
    fetchAuthStatus()
      .then((status) => {
        setAuthRequired(status.auth_required)
        setPasswordLogin(status.password_login)
      })
      .catch(() => {
        // Fail closed: if the status check fails, require sign-in.
        setAuthRequired(true)
        setPasswordLogin(true)
      })
      .finally(() => setLoading(false))
    return () => setUnauthorizedHandler(null)
  }, [])

  const logout = () => {
    clearToken()
    setAuthed(false)
  }

  const handlePasswordLogin = async (username: string, password: string) => {
    const token = await loginRequest(username, password)
    setToken(token)
    setAuthed(true)
  }

  const handleTokenLogin = (token: string) => {
    setToken(token)
    setAuthed(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12141a] text-sm text-[#6b7280]">
        Loading…
      </div>
    )
  }

  if (authRequired && !authed) {
    return (
      <Login
        passwordLogin={passwordLogin}
        onPasswordLogin={handlePasswordLogin}
        onTokenLogin={handleTokenLogin}
      />
    )
  }

  return (
    <AuthContext.Provider value={{ authRequired, logout }}>{children}</AuthContext.Provider>
  )
}
