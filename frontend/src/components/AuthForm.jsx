import { useState } from 'react'

import { login, register, saveToken } from '../lib/api'

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = mode === 'register' ? await register(email, password) : await login(email, password)
      saveToken(result.access_token)
      onAuthSuccess(result.user)
      setEmail('')
      setPassword('')
      setMode('login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-hero">
        <p className="eyebrow">DueLook</p>
        <h1>Sign in to your inbox workspace</h1>
        <p className="subtitle">
          Use fake accounts for now to verify login, isolation, and per-user email imports.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="abc@gmail.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="secret123"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {error && <div className="banner error">{error}</div>}

        <button className="primary-btn" disabled={loading}>
          {loading ? 'Working…' : mode === 'register' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <button
        type="button"
        className="switch-btn"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
      </button>
    </div>
  )
}