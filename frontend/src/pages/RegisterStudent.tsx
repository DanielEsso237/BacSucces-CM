import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerStudent } from '../api/auth'
import PhoneInput, { toFullCameroonPhone } from '../components/PhoneInput'
import '../styles/auth.css'

function RegisterStudent() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [contactDigits, setContactDigits] = useState('')
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
      await registerStudent({ email, full_name: fullName, password, contact: toFullCameroonPhone(contactDigits) || undefined })
      setSuccess('Compte créé ! Redirection vers la connexion…')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/login" className="auth-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour à la connexion
          </Link>

          <h1 className="auth-heading">Créer un compte élève</h1>
          <p className="auth-subheading">Accède gratuitement à des milliers d'épreuves et d'annales</p>

          {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div className="auth-alert auth-alert-success" style={{ marginBottom: 16 }}>{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Nom complet</label>
              <input
                className="auth-input"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jean-Jacques Minkande"
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="Minimum 8 caractères"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                Contact <span style={{ fontWeight: 400, fontSize: 12, color: '#94a3b8' }}>(optionnel)</span>
              </label>
              <PhoneInput className="auth-input" value={contactDigits} onChange={setContactDigits} />
            </div>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '24px 0' }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">ou</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-links">
            <p className="auth-link-row">
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
            <p className="auth-link-row">
              Tu es enseignant ? <Link to="/register/teacher">Compte enseignant</Link>
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
            Tout ce qu'il te faut pour <span>décrocher ton bac</span>
          </p>
          <p className="auth-visual-desc">
            Rejoins des milliers d'élèves qui préparent leurs examens avec les meilleures ressources pédagogiques du Cameroun.
          </p>
          <div className="auth-visual-stats">
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">Gratuit</span>
              <span className="auth-visual-stat-label">Pour les élèves</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">7</span>
              <span className="auth-visual-stat-label">Niveaux</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">PDF</span>
              <span className="auth-visual-stat-label">Téléchargeables</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterStudent