import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const data = await loginApi({ email, password })
      login(data.access_token, data.user)
      if (data.role === 'ADMIN') navigate('/dashboard/admin')
      else if (data.role === 'TEACHER') navigate('/dashboard/teacher')
      else navigate('/dashboard/student')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Accueil
          </Link>

          <h1 className="auth-heading">Bon retour</h1>
          <p className="auth-subheading">Connecte-toi pour accéder à ta bibliothèque</p>

          {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Adresse email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.cm"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Mot de passe</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '24px 0' }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Pas encore de compte ?</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-links">
            <p className="auth-link-row">
              Tu es élève ? <Link to="/register/student">Créer un compte élève</Link>
            </p>
            <p className="auth-link-row">
              Tu es enseignant ? <Link to="/register/teacher">Créer un compte enseignant</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="auth-visual">
        <div className="auth-visual-pattern" />
        <div className="auth-visual-ring" />
        <div className="auth-visual-ring" />
        <div className="auth-visual-ring" />
        <div className="auth-visual-content">
          <div className="auth-visual-logo">
            <div className="auth-visual-logo-icon">B</div>
            <span className="auth-visual-logo-name">BacSuccès-CM</span>
          </div>
          <p className="auth-visual-quote">
            Réussis ton bac avec les <span>meilleures ressources</span> du Cameroun
          </p>
          <p className="auth-visual-desc">
            Accède à des milliers d'épreuves et d'annales partagées par les meilleurs enseignants du pays.
          </p>
          <div className="auth-visual-stats">
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">2 000+</span>
              <span className="auth-visual-stat-label">Documents</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">500+</span>
              <span className="auth-visual-stat-label">Enseignants</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">8</span>
              <span className="auth-visual-stat-label">Matières</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login