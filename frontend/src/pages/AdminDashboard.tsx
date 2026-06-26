import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'
import axios from 'axios'
import type { User } from '../api/auth'
import { getAllUsers } from '../api/auth'

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

interface Stats {
  total_documents: number
  total_students: number
  total_teachers: number
  pending_teachers: number
  exam_count: number
  annales_count: number
  correction_count: number
  subjects: { label: string; count: number }[]
}

async function getStats(token: string): Promise<Stats> {
  const r = await api.get<Stats>('/admin/stats', { headers: authHeader(token) })
  return r.data
}

type Tab = 'stats' | 'teachers' | 'users'

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
          <button
            className={`ad-nav-item ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Inscrits
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

        {tab === 'stats' && token && <StatsPanel token={token} pendingCount={teachers.length} />}
        {tab === 'teachers' && (
          <TeachersPanel
            teachers={teachers}
            isLoading={isLoading}
            onValidate={handleValidate}
            onReject={handleReject}
          />
        )}
        {tab === 'users' && token && <UsersPanel token={token} />}
      </main>
    </div>
  )
}

function StatsPanel({ token, pendingCount }: { token: string; pendingCount: number }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getStats(token)
      .then(setStats)
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading || !stats) {
    return (
      <div>
        <div className="ad-page-header">
          <div>
            <h1 className="ad-page-title">Tableau de bord</h1>
            <p className="ad-page-sub">Vue d'ensemble de la plateforme BacSuccès-CM</p>
          </div>
        </div>
        <div className="ad-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="ad-skeleton" style={{ height: 110 }} />)}
        </div>
      </div>
    )
  }

  const totalDocs = stats.total_documents
  const examPct = totalDocs > 0 ? Math.round((stats.exam_count / totalDocs) * 100) : 0
  const annalesPct = totalDocs > 0 ? Math.round((stats.annales_count / totalDocs) * 100) : 0
  const correctionPct = totalDocs > 0 ? 100 - examPct - annalesPct : 0

  const statCards = [
    {
      label: 'Documents publiés',
      value: stats.total_documents.toLocaleString('fr-FR'),
      delta: `${stats.exam_count} épr. · ${stats.annales_count} ann. · ${stats.correction_count} corr.`,
      up: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      color: 'green',
    },
    {
      label: 'Élèves inscrits',
      value: stats.total_students.toLocaleString('fr-FR'),
      delta: 'Comptes actifs',
      up: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      color: 'blue',
    },
    {
      label: 'Enseignants actifs',
      value: stats.total_teachers.toLocaleString('fr-FR'),
      delta: 'Comptes validés',
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

  const maxSubject = stats.subjects.length > 0 ? Math.max(...stats.subjects.map(s => s.count)) : 1

  const circumference = 2 * Math.PI * 48
  const examDash = (examPct / 100) * circumference
  const annalesDash = (annalesPct / 100) * circumference
  const correctionDash = (correctionPct / 100) * circumference
  const offset = circumference * 0.25

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Tableau de bord</h1>
          <p className="ad-page-sub">Vue d'ensemble de la plateforme BacSuccès-CM</p>
        </div>
      </div>

      <div className="ad-stats-grid">
        {statCards.map((s, i) => (
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
          {totalDocs === 0 ? (
            <p style={{ color: 'var(--ad-muted)', fontSize: 13 }}>Aucun document publié.</p>
          ) : (
            <div className="ad-donut-wrap">
              <svg className="ad-donut" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="18" />
                <circle
                  cx="60" cy="60" r="48" fill="none" stroke="#991b1b" strokeWidth="18"
                  strokeDasharray={`${examDash} ${circumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60" cy="60" r="48" fill="none" stroke="#4c1d95" strokeWidth="18"
                  strokeDasharray={`${annalesDash} ${circumference}`}
                  strokeDashoffset={offset - examDash}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60" cy="60" r="48" fill="none" stroke="#0f766e" strokeWidth="18"
                  strokeDasharray={`${correctionDash} ${circumference}`}
                  strokeDashoffset={offset - examDash - annalesDash}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{totalDocs}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#94a3b8">documents</text>
              </svg>
              <div className="ad-donut-legend">
                <div className="ad-legend-row">
                  <span className="ad-legend-dot exam" />
                  <span className="ad-legend-label">Épreuves</span>
                  <span className="ad-legend-count">{stats.exam_count}</span>
                  <span className="ad-legend-pct">{examPct}%</span>
                </div>
                <div className="ad-legend-row">
                  <span className="ad-legend-dot annales" />
                  <span className="ad-legend-label">Annales</span>
                  <span className="ad-legend-count">{stats.annales_count}</span>
                  <span className="ad-legend-pct">{annalesPct}%</span>
                </div>
                <div className="ad-legend-row">
                  <span className="ad-legend-dot correction" />
                  <span className="ad-legend-label">Corrections</span>
                  <span className="ad-legend-count">{stats.correction_count}</span>
                  <span className="ad-legend-pct">{correctionPct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ad-chart-card">
          <h2 className="ad-chart-title">Documents par matière</h2>
          {stats.subjects.length === 0 ? (
            <p style={{ color: 'var(--ad-muted)', fontSize: 13 }}>Aucun document publié.</p>
          ) : (
            <div className="ad-bars">
              {stats.subjects.map((s, i) => (
                <div key={i} className="ad-bar-row">
                  <span className="ad-bar-label">{s.label}</span>
                  <div className="ad-bar-track">
                    <div className="ad-bar-fill" style={{ width: `${(s.count / maxSubject) * 100}%` }} />
                  </div>
                  <span className="ad-bar-value">{s.count}</span>
                </div>
              ))}
            </div>
          )}
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
                {teacher.contact && (
                  <p className="ad-pending-contact">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>
                    {teacher.contact}
                  </p>
                )}
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

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Élève',
  TEACHER: 'Enseignant',
  ADMIN: 'Admin',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  SUSPENDED: 'Suspendu',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#166534',
  PENDING: '#92400e',
  SUSPENDED: '#991b1b',
}

const STATUS_BG: Record<string, string> = {
  ACTIVE: '#dcfce7',
  PENDING: '#fef3c7',
  SUSPENDED: '#fef2f2',
}

function UsersPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User | null>(null)

  useEffect(() => {
    setIsLoading(true)
    getAllUsers(token, {
      role: filterRole || undefined,
      status: filterStatus || undefined,
    })
      .then(setUsers)
      .finally(() => setIsLoading(false))
  }, [token, filterRole, filterStatus])

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Inscrits</h1>
          <p className="ad-page-sub">{isLoading ? '…' : `${filtered.length} utilisateur${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
      </div>

      <div className="ad-users-toolbar">
        <div className="ad-users-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="ad-users-search"
            type="text"
            placeholder="Nom, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ad-users-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="STUDENT">Élèves</option>
          <option value="TEACHER">Enseignants</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select className="ad-users-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actifs</option>
          <option value="PENDING">En attente</option>
          <option value="SUSPENDED">Suspendus</option>
        </select>
      </div>

      {isLoading && (
        <div className="ad-users-list">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="ad-skeleton" style={{ height: 72 }} />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="ad-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <p>Aucun utilisateur trouvé</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="ad-users-list">
          {filtered.map(u => (
            <button key={u.id} className="ad-user-row" onClick={() => setSelected(u)}>
              <div className="ad-user-row-avatar" style={{ background: u.role === 'TEACHER' ? '#dbeafe' : u.role === 'ADMIN' ? '#fef3c7' : '#dcfce7', color: u.role === 'TEACHER' ? '#1d4ed8' : u.role === 'ADMIN' ? '#92400e' : '#166534' }}>
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="ad-user-row-info">
                <span className="ad-user-row-name">{u.full_name}</span>
                <span className="ad-user-row-email">{u.email}</span>
              </div>
              {u.contact && (
                <span className="ad-user-row-contact">{u.contact}</span>
              )}
              <span className="ad-user-row-role">{ROLE_LABELS[u.role] ?? u.role}</span>
              <span className="ad-user-row-status" style={{ background: STATUS_BG[u.status], color: STATUS_COLORS[u.status] }}>
                {STATUS_LABELS[u.status] ?? u.status}
              </span>
              <span className="ad-user-row-date">
                {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8', flexShrink: 0 }} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={e => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h2 className="ad-modal-title">Détail de l'inscrit</h2>
          <button className="ad-modal-close" onClick={onClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="ad-modal-body">
          <div className="ad-modal-avatar" style={{ background: user.role === 'TEACHER' ? '#dbeafe' : user.role === 'ADMIN' ? '#fef3c7' : '#dcfce7', color: user.role === 'TEACHER' ? '#1d4ed8' : user.role === 'ADMIN' ? '#92400e' : '#166534' }}>
            {user.full_name.charAt(0).toUpperCase()}
          </div>

          <div className="ad-modal-fields">
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">Nom complet</span>
              <span className="ad-modal-field-value">{user.full_name}</span>
            </div>
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">Email</span>
              <span className="ad-modal-field-value">{user.email}</span>
            </div>
            {user.contact && (
              <div className="ad-modal-field">
                <span className="ad-modal-field-label">Contact</span>
                <span className="ad-modal-field-value">{user.contact}</span>
              </div>
            )}
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">Rôle</span>
              <span className="ad-modal-field-value">
                <span className="ad-modal-badge" style={{ background: user.role === 'TEACHER' ? '#dbeafe' : user.role === 'ADMIN' ? '#fef3c7' : '#dcfce7', color: user.role === 'TEACHER' ? '#1d4ed8' : user.role === 'ADMIN' ? '#92400e' : '#166534' }}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </span>
            </div>
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">Statut</span>
              <span className="ad-modal-field-value">
                <span className="ad-modal-badge" style={{ background: STATUS_BG[user.status], color: STATUS_COLORS[user.status] }}>
                  {STATUS_LABELS[user.status] ?? user.status}
                </span>
              </span>
            </div>
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">Inscrit le</span>
              <span className="ad-modal-field-value">
                {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {user.teacher_justification && (
              <div className="ad-modal-field ad-modal-field-full">
                <span className="ad-modal-field-label">Justification professionnelle</span>
                <div className="ad-pending-justif" style={{ marginTop: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {user.teacher_justification}
                </div>
              </div>
            )}
            <div className="ad-modal-field">
              <span className="ad-modal-field-label">ID interne</span>
              <span className="ad-modal-field-value" style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard