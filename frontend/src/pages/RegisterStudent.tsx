import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerStudent } from '../api/auth'
import '../styles/auth.css'

function RegisterStudent() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await registerStudent({ email, full_name: fullName, password })
      setSuccess('Compte créé avec succès ! Redirection...')
      setTimeout(() => navigate('/login'), 2000)
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

        <p className="auth-title">Créer un compte élève</p>
        <p className="auth-subtitle">Accède à des milliers d'épreuves et de cours</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jean-Jacques Minkande"
              required
            />
          </div>

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
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="divider" />

        <div className="auth-links">
          <span>Déjà un compte ? <Link to="/login">Se connecter</Link></span>
          <span>Tu es enseignant ? <Link to="/register/teacher">Compte enseignant</Link></span>
        </div>
      </div>
    </div>
  )
}

export default RegisterStudent