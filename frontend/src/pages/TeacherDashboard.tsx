import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, getFilters, uploadDocument } from '../api/documents'
import type { Document, Filters } from '../api/documents'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/teacher.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type Tab = 'docs' | 'upload'

function docTypeMeta(type: string) {
  switch (type) {
    case 'EXAM': return { label: 'Épreuve', cls: 'chip-exam' }
    case 'ANNALES': return { label: 'Annales', cls: 'chip-annales' }
    default: return { label: type, cls: 'chip-exam' }
  }
}

async function downloadWithAuth(docId: number, title: string, token: string) {
  const res = await fetch(`http://localhost:8000/documents/${docId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function TeacherDashboard() {
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('docs')

  return (
    <div className="td-root">
      <aside className="td-sidebar">
        <div className="td-brand">
          <span className="td-brand-icon">B</span>
          <span className="td-brand-name">BacSuccès</span>
        </div>

        <nav className="td-nav">
          <span className="td-nav-label">Menu</span>
          <button
            className={`td-nav-item ${tab === 'docs' ? 'active' : ''}`}
            onClick={() => setTab('docs')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Mes documents
          </button>
          <button
            className={`td-nav-item ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Uploader un document
          </button>
        </nav>

        <div className="td-sidebar-footer">
          <div className="td-user-block">
            <div className="td-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
            <div className="td-user-info">
              <span className="td-user-name">{user?.full_name}</span>
              <span className="td-user-role">Enseignant</span>
            </div>
          </div>
          <button className="td-logout-btn" onClick={logout} title="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="td-main">
        {tab === 'docs' && token && user && (
          <MesDocuments token={token} userId={user.id} onUpload={() => setTab('upload')} />
        )}
        {tab === 'upload' && token && (
          <UploadForm token={token} onSuccess={() => setTab('docs')} />
        )}
      </main>
    </div>
  )
}

function MesDocuments({ token, userId, onUpload }: { token: string; userId: number; onUpload: () => void }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDocuments(token)
      .then(docs => setDocuments(docs.filter(d => d.author_id === userId)))
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }, [token, userId])

  if (isLoading) {
    return (
      <div>
        <div className="td-page-header">
          <div>
            <h1 className="td-page-title">Mes documents</h1>
            <p className="td-page-sub">Tous vos documents publiés</p>
          </div>
        </div>
        <div className="td-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="td-skeleton" />)}
        </div>
      </div>
    )
  }

  if (error) return <div className="td-error-banner">{error}</div>

  return (
    <div>
      <div className="td-page-header">
        <div>
          <h1 className="td-page-title">Mes documents</h1>
          <p className="td-page-sub">{documents.length} document{documents.length !== 1 ? 's' : ''} publié{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="td-btn-primary" onClick={onUpload}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="td-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>Aucun document publié pour le moment</p>
          <button className="td-btn-primary" onClick={onUpload}>Publier mon premier document</button>
        </div>
      ) : (
        <div className="td-grid">
          {documents.map(doc => <DocCard key={doc.id} doc={doc} token={token} />)}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, token }: { doc: Document; token: string }) {
  const { label, cls } = docTypeMeta(doc.doc_type)

  const handleDownload = useCallback(() => {
    downloadWithAuth(doc.id, doc.title, token)
  }, [doc.id, doc.title, token])

  return (
    <article className="td-card">
      <div className="td-card-top">
        <span className={`td-chip ${cls}`}>{label}</span>
        <span className="td-card-date">
          {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <h3 className="td-card-title">{doc.title}</h3>
      {doc.description && <p className="td-card-desc">{doc.description}</p>}
      <div className="td-card-tags">
        <span className="td-tag">{doc.subject}</span>
        <span className="td-tag">{doc.level}</span>
      </div>
      <button className="td-btn-download" onClick={handleDownload}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Télécharger le PDF
      </button>
    </article>
  )
}

function UploadForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [filters, setFilters] = useState<Filters | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getFilters().then(setFilters) }, [])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null
    if (selected && selected.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés')
      return
    }
    setFile(selected)
    setError(null)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Sélectionne un fichier PDF'); return }
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('subject', subject)
    formData.append('level', level)
    formData.append('doc_type', docType)
    formData.append('file', file)
    try {
      await uploadDocument(token, formData)
      setSuccess('Document publié avec succès !')
      setTimeout(onSuccess, 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const previewOptions = useMemo(() => ({}), [])

  if (!filters) return <div className="td-loading">Chargement…</div>

  return (
    <div>
      <div className="td-page-header">
        <div>
          <h1 className="td-page-title">Uploader un document</h1>
          <p className="td-page-sub">Remplissez les informations et sélectionnez votre fichier PDF</p>
        </div>
      </div>

      <div className="td-upload-layout">
        <div className="td-form-card">
          {error && <div className="td-alert td-alert-error">{error}</div>}
          {success && <div className="td-alert td-alert-success">{success}</div>}

          <form className="td-form" onSubmit={handleSubmit}>
            <div className="td-field">
              <label className="td-label">Titre du document</label>
              <input className="td-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : Baccalauréat Mathématiques 2023" required />
            </div>

            <div className="td-field">
              <label className="td-label">Description <span className="td-optional">(optionnel)</span></label>
              <textarea className="td-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Quelques mots pour décrire le contenu…" />
            </div>

            <div className="td-row">
              <div className="td-field">
                <label className="td-label">Matière</label>
                <select className="td-select" value={subject} onChange={e => setSubject(e.target.value)} required>
                  <option value="">Choisir…</option>
                  {filters.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="td-field">
                <label className="td-label">Niveau</label>
                <select className="td-select" value={level} onChange={e => setLevel(e.target.value)} required>
                  <option value="">Choisir…</option>
                  {filters.levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="td-field">
                <label className="td-label">Type</label>
                <select className="td-select" value={docType} onChange={e => setDocType(e.target.value)} required>
                  <option value="">Choisir…</option>
                  <option value="EXAM">Épreuve</option>
                  <option value="ANNALES">Annales</option>
                </select>
              </div>
            </div>

            <div className="td-field">
              <label className="td-label">Fichier PDF</label>
              <label className="td-file-drop">
                <input type="file" accept=".pdf" onChange={handleFileChange} required style={{ display: 'none' }} />
                {file ? (
                  <div className="td-file-selected">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{file.name}</span>
                    <span className="td-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ) : (
                  <div className="td-file-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Cliquer pour sélectionner un PDF</span>
                    <span className="td-file-hint">Seuls les fichiers .pdf sont acceptés</span>
                  </div>
                )}
              </label>
            </div>

            <button className="td-btn-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Publication en cours…' : 'Publier le document'}
            </button>
          </form>
        </div>

        {previewUrl && (
          <div className="td-preview-card">
            <p className="td-preview-title">Aperçu</p>
            <div className="td-preview-pdf">
              <PDFDocument file={previewUrl} options={previewOptions}>
                <Page pageNumber={1} width={320} />
              </PDFDocument>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard