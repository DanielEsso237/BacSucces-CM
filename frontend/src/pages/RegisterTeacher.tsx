import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerTeacher } from '../api/auth'
import '../styles/auth.css'

function RegisterTeacher() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [justification, setJustification] = useState('')
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
      await registerTeacher({ email, full_name: fullName, password, teacher_justification: justification })
      setSuccess('Demande envoyée ! Un administrateur va valider ton compte sous 48h. Redirection...')
      setTimeout(() => navigate('/login'), 3000)
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

        <p className="auth-title">Créer un compte enseignant</p>
        <p className="auth-subtitle">Partage tes épreuves et cours avec les élèves</p>

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

          <div className="form-group">
            <label>Justification</label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Ex: Matricule MEN-2024-001, Lycée de Buea, matière: Mathématiques"
              rows={4}
              required
            />
            <span className="field-hint">
              Indique ton matricule, ton établissement et ta matière. L'admin vérifiera ces informations.
            </span>
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>

        <div className="divider" />

        <div className="auth-links">
          <span>Déjà un compte ? <Link to="/login">Se connecter</Link></span>
          <span>Tu es élève ? <Link to="/register/student">Compte élève</Link></span>
        </div>
      </div>
    </div>
  )
}

export default RegisterTeacher