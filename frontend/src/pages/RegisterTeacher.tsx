import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerTeacher } from '../api/auth'
import PhoneInput, { toFullCameroonPhone } from '../components/PhoneInput'
import '../styles/auth.css'

function RegisterTeacher() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [justification, setJustification] = useState('')
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
      const contact = contactDigits.trim() 
        ? toFullCameroonPhone(contactDigits) 
        : undefined

      await registerTeacher({ 
        email, 
        full_name: fullName, 
        password, 
        teacher_justification: justification, 
        contact 
      })

      setSuccess('Demande envoyée ! Un administrateur validera ton compte sous 48h. Redirection…')
      setTimeout(() => navigate('/login'), 3000)
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

          <h1 className="auth-heading">Compte enseignant</h1>
          <p className="auth-subheading">Partage tes épreuves et annales avec les élèves du Cameroun</p>

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
                placeholder="Prof. Marie Atanga"
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
                placeholder="prof@email.cm"
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
              <PhoneInput 
                className="auth-input" 
                value={contactDigits} 
                onChange={setContactDigits}
                maxLength={9}
                placeholder="690 123 456"
              />
              <p className="auth-hint" style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                Numéro à 9 chiffres (exemple : 690123456)
              </p>
            </div>

            <div className="auth-field">
              <label className="auth-label">Justification professionnelle</label>
              <textarea
                className="auth-textarea"
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Ex : Matricule MEN-2024-001, Lycée de Buea, matière : Mathématiques"
                required
              />
              <span className="auth-hint">
                Indique ton matricule MEN, ton établissement et ta matière. L'administrateur vérifiera ces informations avant de valider ton compte.
              </span>
            </div>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Envoi de la demande…' : 'Envoyer ma demande'}
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
              Tu es élève ? <Link to="/register/student">Compte élève</Link>
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
            Partage ton <span>savoir</span>, inspire la prochaine génération
          </p>
          <p className="auth-visual-desc">
            Rejoins une communauté d'enseignants engagés qui contribuent à la réussite des élèves camerounais en partageant leurs ressources pédagogiques.
          </p>
          <div className="auth-visual-stats">
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">500+</span>
              <span className="auth-visual-stat-label">Enseignants</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">48h</span>
              <span className="auth-visual-stat-label">Validation</span>
            </div>
            <div className="auth-visual-stat">
              <span className="auth-visual-stat-value">10k+</span>
              <span className="auth-visual-stat-label">Élèves</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterTeacher