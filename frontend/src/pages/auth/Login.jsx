import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // Firebase error codes are descriptive
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg-base)' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: 420, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Login</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Sign in to continue to your workspace.</p>
        </div>

        <input className="glass-input" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" required />
        <input className="glass-input" value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required />

        {error && <p style={{ color: '#dc2626', margin: 0, fontSize: 12 }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 4 }}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <div style={{ display: 'grid', gap: 10, marginTop: 2 }}>
          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="btn-secondary" style={{ width: '100%' }}>
            {googleLoading ? 'Connecting Google...' : 'Continue with Google'}
          </button>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            New here? <Link to="/register" style={{ color: 'var(--accent-violet)', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>
      </form>
    </div>
  )
}