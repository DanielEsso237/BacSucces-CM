import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'
import axios from 'axios'
import type { User } from '../api/auth'

const api = axios.create({ baseURL: 'http://localhost:8000' })

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function getPendingTeachers(token: string): Promise<User[]> {
  const r = await api.get<User[]>('/auth/admin/pending-teachers', {
    headers: authHeader(token)
  })
  return r.data
}

async function updateUser(token: string, userId: number, data: { status?: string; role?: string }): Promise<User> {
  const r = await api.patch<User>(`/auth/admin/users/${userId}`, data, {
    headers: authHeader(token)
  })
  return r.data
}

function AdminDashboard() {
  const { user, token, logout } = useAuth()
  const [teachers, setTeachers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function load() {
    setIsLoading(true)
    getPendingTeachers(token!)
      .then(setTeachers)
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [token])

  async function handleValidate(userId: number) {
    setError(null)
    setSuccess(null)
    try {
      await updateUser(token!, userId, { status: 'ACTIVE' })
      setSuccess('Compte enseignant validé !')
      load()
    } catch {
      setError('Erreur lors de la validation')
    }
  }

  async function handleReject(userId: number) {
    setError(null)
    setSuccess(null)
    try {
      await updateUser(token!, userId, { status: 'SUSPENDED' })
      setSuccess('Compte rejeté.')
      load()
    } catch {
      setError('Erreur lors du rejet')
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">BacSuccès-CM</div>
        <div className="dashboard-user">
          <span>👋 {user?.full_name}</span>
          <span className="badge badge-admin">Admin</span>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2 style={{ marginBottom: '24px' }}>Demandes d'inscription enseignants</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isLoading && <p className="loading">Chargement...</p>}

        {!isLoading && teachers.length === 0 && (
          <div className="empty-state">
            <p>Aucune demande en attente 🎉</p>
          </div>
        )}

        {!isLoading && teachers.length > 0 && (
          <div className="pending-list">
            {teachers.map(teacher => (
              <div key={teacher.id} className="pending-card">
                <div className="pending-info">
                  <h3>{teacher.full_name}</h3>
                  <p className="pending-email">{teacher.email}</p>
                  {teacher.teacher_justification && (
                    <p className="pending-justification">📄 {teacher.teacher_justification}</p>
                  )}
                  <p className="pending-date">
                    Inscrit le {new Date(teacher.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="pending-actions">
                  <button className="btn-validate" onClick={() => handleValidate(teacher.id)}>
                    ✓ Valider
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(teacher.id)}>
                    ✗ Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard