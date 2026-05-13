import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'
import axios from 'axios'
import type { User } from '../api/auth'

const api = axios.create({ baseURL: 'http://localhost:8000' })

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function getPendingTeachers(token: string): Promise<User[]> {
  const r = await api.get<User[]>('/auth/admin/pending-teachers', { headers: authHeader(token) })
  return r.data
}

async function updateUser(token: string, userId: number, data: { status?: string; role?: string }): Promise<User> {
  const r = await api.patch<User>(`/auth/admin/users/${userId}`, data, { headers: authHeader(token) })
  return r.data
}

type Tab = 'stats' | 'teachers'

function AdminDashboard() {
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('stats')
  const [teachers, setTeachers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function loadTeachers() {
    setIsLoading(true)
    getPendingTeachers(token!)
      .then(setTeachers)
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadTeachers() }, [token])

  async function handleValidate(userId: number) {
    setError(null)
    setSuccess(null)
    try {
      await updateUser(token!, userId, { status: 'ACTIVE' })
      setSuccess('Compte enseignant validé avec succès.')
      loadTeachers()
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
      loadTeachers()
    } catch {
      setError('Erreur lors du rejet')
    }
  }

  return (
    <div className="ad-root">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <span className="ad-brand-icon">B</span>
          <span className="ad-brand-name">BacSuccès</span>
        </div>

        <nav className="ad-nav">
          <span className="ad-nav-label">Administration</span>
          <button
            className={`ad-nav-item ${tab === 'stats' ? 'active' : ''}`}
            onClick={() => setTab('stats')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Statistiques
          </button>
          <button
            className={`ad-nav-item ${tab === 'teachers' ? 'active' : ''}`}
            onClick={() => setTab('teachers')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Demandes enseignants
            {teachers.length > 0 && (
              <span className="ad-nav-badge">{teachers.length}</span>
            )}
          </button>
        </nav>

        <div className="ad-sidebar-footer">
          <div className="ad-user-block">
            <div className="ad-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
            <div className="ad-user-info">
              <span className="ad-user-name">{user?.full_name}</span>
              <span className="ad-user-role">Administrateur</span>
            </div>
          </div>
          <button className="ad-logout-btn" onClick={logout} title="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="ad-main">
        {error && <div className="ad-alert ad-alert-error">{error}</div>}
        {success && <div className="ad-alert ad-alert-success">{success}</div>}

        {tab === 'stats' && <StatsPanel pendingCount={teachers.length} />}
        {tab === 'teachers' && (
          <TeachersPanel
            teachers={teachers}
            isLoading={isLoading}
            onValidate={handleValidate}
            onReject={handleReject}
          />
        )}
      </main>
    </div>
  )
}

function StatsPanel({ pendingCount }: { pendingCount: number }) {
  const stats = [
    {
      label: 'Documents publiés',
      value: '2 148',
      delta: '+12 cette semaine',
      up: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      color: 'green',
    },
    {
      label: 'Élèves inscrits',
      value: '10 432',
      delta: '+238 ce mois',
      up: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      color: 'blue',
    },
    {
      label: 'Enseignants actifs',
      value: '512',
      delta: '+8 ce mois',
      up: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      color: 'violet',
    },
    {
      label: 'Demandes en attente',
      value: String(pendingCount),
      delta: pendingCount > 0 ? 'À traiter' : 'Aucune',
      up: false,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      color: pendingCount > 0 ? 'amber' : 'green',
    },
  ]

  const breakdown = [
    { label: 'Épreuves', count: 1384, pct: 64 },
    { label: 'Annales', count: 764, pct: 36 },
  ]

  const subjects = [
    { label: 'Mathématiques', count: 512 },
    { label: 'Physique', count: 398 },
    { label: 'SVT', count: 287 },
    { label: 'Français', count: 345 },
    { label: 'Anglais', count: 264 },
    { label: 'Histoire-Géo', count: 198 },
    { label: 'Philosophie', count: 94 },
    { label: 'Informatique', count: 50 },
  ]
  const maxSubject = Math.max(...subjects.map(s => s.count))

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Tableau de bord</h1>
          <p className="ad-page-sub">Vue d'ensemble de la plateforme BacSuccès-CM</p>
        </div>
      </div>

      <div className="ad-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`ad-stat-card ad-stat-${s.color}`}>
            <div className="ad-stat-top">
              <div className="ad-stat-icon">{s.icon}</div>
              <span className={`ad-stat-delta ${s.up ? 'up' : 'neutral'}`}>{s.delta}</span>
            </div>
            <p className="ad-stat-value">{s.value}</p>
            <p className="ad-stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="ad-charts-row">
        <div className="ad-chart-card">
          <h2 className="ad-chart-title">Répartition par type</h2>
          <div className="ad-donut-wrap">
            <svg className="ad-donut" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#fef2f2" strokeWidth="18" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#991b1b" strokeWidth="18"
                strokeDasharray={`${64 * 3.016} ${100 * 3.016}`}
                strokeDashoffset={3.016 * 25}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#4c1d95" strokeWidth="18"
                strokeDasharray={`${36 * 3.016} ${100 * 3.016}`}
                strokeDashoffset={3.016 * (25 - 64)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">2 148</text>
              <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#94a3b8">documents</text>
            </svg>
            <div className="ad-donut-legend">
              {breakdown.map((b, i) => (
                <div key={i} className="ad-legend-row">
                  <span className={`ad-legend-dot ${i === 0 ? 'exam' : 'annales'}`} />
                  <span className="ad-legend-label">{b.label}</span>
                  <span className="ad-legend-count">{b.count}</span>
                  <span className="ad-legend-pct">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ad-chart-card">
          <h2 className="ad-chart-title">Documents par matière</h2>
          <div className="ad-bars">
            {subjects.map((s, i) => (
              <div key={i} className="ad-bar-row">
                <span className="ad-bar-label">{s.label}</span>
                <div className="ad-bar-track">
                  <div
                    className="ad-bar-fill"
                    style={{ width: `${(s.count / maxSubject) * 100}%` }}
                  />
                </div>
                <span className="ad-bar-value">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeachersPanel({
  teachers, isLoading, onValidate, onReject
}: {
  teachers: User[]
  isLoading: boolean
  onValidate: (id: number) => void
  onReject: (id: number) => void
}) {
  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Demandes enseignants</h1>
          <p className="ad-page-sub">{teachers.length} demande{teachers.length !== 1 ? 's' : ''} en attente de validation</p>
        </div>
      </div>

      {isLoading && (
        <div className="ad-pending-list">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="ad-skeleton" />)}
        </div>
      )}

      {!isLoading && teachers.length === 0 && (
        <div className="ad-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p>Aucune demande en attente</p>
        </div>
      )}

      {!isLoading && teachers.length > 0 && (
        <div className="ad-pending-list">
          {teachers.map(teacher => (
            <div key={teacher.id} className="ad-pending-card">
              <div className="ad-pending-avatar">{teacher.full_name.charAt(0).toUpperCase()}</div>
              <div className="ad-pending-info">
                <h3 className="ad-pending-name">{teacher.full_name}</h3>
                <p className="ad-pending-email">{teacher.email}</p>
                {teacher.teacher_justification && (
                  <div className="ad-pending-justif">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {teacher.teacher_justification}
                  </div>
                )}
                <p className="ad-pending-date">
                  Inscrit le {new Date(teacher.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="ad-pending-actions">
                <button className="ad-btn-validate" onClick={() => onValidate(teacher.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  Valider
                </button>
                <button className="ad-btn-reject" onClick={() => onReject(teacher.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard