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
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>BacSuccès-CM</h1>
          <p>Plateforme d'échange de cours et d'épreuves</p>
        </div>

        <p className="auth-title">Connexion</p>
        <p className="auth-subtitle">Accède à ton espace personnel</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.cm"
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="divider" />

        <div className="auth-links">
          <span>Pas encore de compte ?</span>
          <Link to="/register/student">Créer un compte élève</Link>
          <Link to="/register/teacher">Créer un compte enseignant</Link>
        </div>
      </div>
    </div>
  )
}

export default Login