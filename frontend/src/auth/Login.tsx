import { useState, type FormEvent } from 'react'

interface LoginProps {
  passwordLogin: boolean
  onPasswordLogin: (username: string, password: string) => Promise<void>
  onTokenLogin: (token: string) => void
}

export default function Login({ passwordLogin, onPasswordLogin, onTokenLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordLogin) {
      if (!token.trim()) {
        setError('Enter your API token')
        return
      }
      onTokenLogin(token.trim())
      return
    }

    setSubmitting(true)
    try {
      await onPasswordLogin(username, password)
    } catch {
      setError('Invalid username or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#12141a] px-6 font-sans text-[#e8eaed]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#191c24] p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-black tracking-tight text-white">
            M
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Mux<span className="text-indigo-400">arr</span>
          </span>
        </div>

        <h1 className="mb-1 text-lg font-bold">Sign in</h1>
        <p className="mb-6 text-sm text-[#6b7280]">
          {passwordLogin
            ? 'Enter your credentials to continue.'
            : 'Enter your API token to continue.'}
        </p>

        {passwordLogin ? (
          <>
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0ab]">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#12141a] px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0ab]">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#12141a] px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </>
        ) : (
          <>
            <label className="mb-1.5 block text-xs font-medium text-[#9aa0ab]">API token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#12141a] px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </>
        )}

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
