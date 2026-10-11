import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (getToken()) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  // text-base on phones keeps iOS Safari from zooming in when an input is focused.
  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-[#E8DDCD] font-body text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#264F24]/20 focus:border-[#264F24]'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EDE1] px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-[#E8DDCD] p-6 sm:p-8">
        <h1 className="font-display font-black text-xl uppercase text-[#22231F] mb-1">Admin Login</h1>
        <p className="font-body text-xs text-[#676A61] mb-6">The Next Protein Nepal</p>

        <div className="mb-4">
          <label htmlFor="email" className="block font-body text-sm font-semibold text-[#22231F] mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block font-body text-sm font-semibold text-[#22231F] mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-[#676A61] hover:text-[#264F24]"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && <p className="mb-4 font-body text-sm text-[#8B4A2E]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 rounded-full bg-[#264F24] text-[#F5EDE1] font-body font-bold text-sm hover:bg-[#173A22] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
