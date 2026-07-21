import { useState } from 'react'

import { login, register, saveToken, googleAuthUrl } from '../api'

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
        <h1>Never miss a deadline</h1>
        <p className="subtitle">
          Connect your Gmail to automatically track deadlines from your inbox.
        </p>
      </div>

      <a href={googleAuthUrl()} className="google-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
      </a>

      <div className="auth-divider"><span>or continue with email</span></div>
      <p className="gmail-rec"><strong>RECOMMENDED:</strong> Sign in with Google for automatic Gmail sync</p>

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