import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, getFilters, uploadDocument, downloadUrl } from '../api/documents'
import type { Document, Filters } from '../api/documents'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/dashboard.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type Tab = 'mes-documents' | 'uploader'

function TeacherDashboard() {
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('mes-documents')

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">BacSuccès-CM</div>
        <div className="dashboard-user">
          <span>{user?.full_name}</span>
          <span className="badge badge-teacher">Enseignant</span>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab ${tab === 'mes-documents' ? 'active' : ''}`}
          onClick={() => setTab('mes-documents')}
        >
          Mes documents
        </button>
        <button
          className={`tab ${tab === 'uploader' ? 'active' : ''}`}
          onClick={() => setTab('uploader')}
        >
          Uploader un document
        </button>
      </div>

      <main className="dashboard-main">
        {tab === 'mes-documents' && token && user && (
          <MesDocuments token={token} userId={user.id} />
        )}
        {tab === 'uploader' && token && (
          <UploadForm token={token} onSuccess={() => setTab('mes-documents')} />
        )}
      </main>
    </div>
  )
}

function MesDocuments({ token, userId }: { token: string; userId: number }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDocuments(token)
      .then(docs => setDocuments(docs.filter(d => d.author_id === userId)))
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }, [token, userId])

  if (isLoading) return <p className="loading">Chargement...</p>
  if (error) return <p className="error">{error}</p>

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <p>Tu n'as pas encore uploadé de documents.</p>
      </div>
    )
  }

  return (
    <div className="documents-grid">
      {documents.map(doc => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
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

  useEffect(() => {
    getFilters().then(setFilters)
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null

    if (selected && selected.type !== 'application/pdf') {
      setError('Seuls les PDF sont autorisés')
      return
    }

    setFile(selected)
    setError(null)

    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      setError('Sélectionne un fichier PDF')
      return
    }

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
      setSuccess('Document uploadé avec succès !')
      setTimeout(onSuccess, 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  if (!filters) return <p className="loading">Chargement...</p>

  return (
    <div className="upload-layout">
      <div className="upload-form-container">
        <h2>Uploader un document</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Matière</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} required>
                <option value="">Choisir...</option>
                {filters.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Niveau</label>
              <select value={level} onChange={e => setLevel(e.target.value)} required>
                <option value="">Choisir...</option>
                {filters.levels.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} required>
                <option value="">Choisir...</option>
                <option value="EXAM">Épreuve</option>
                <option value="ANNALES">Annales</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Fichier PDF</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} required />
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Upload en cours...' : 'Uploader'}
          </button>
        </form>
      </div>

      {previewUrl && (
        <div className="pdf-preview-container">
          <h3>Aperçu du PDF</h3>
          <div className="pdf-preview">
            <PDFDocument file={previewUrl}>
              <Page pageNumber={1} width={340} />
            </PDFDocument>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentCard({ doc }: { doc: Document }) {
  const docTypeLabel = doc.doc_type === 'EXAM' ? 'Épreuve' : 'Annales'
  const docTypeBadge = doc.doc_type === 'EXAM' ? 'badge-exam' : 'badge-annales'

  return (
    <div className="document-card">
      <div className="document-card-header">
        <span className={`badge ${docTypeBadge}`}>
          {docTypeLabel}
        </span>
        <span className="document-date">
          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <h3 className="document-title">{doc.title}</h3>

      {doc.description && (
        <p className="document-description">{doc.description}</p>
      )}

      <div className="document-meta">
        <span className="tag">{doc.subject}</span>
        <span className="tag">{doc.level}</span>
      </div>

      <a
        className="btn-download"
        href={downloadUrl(doc.id)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Télécharger PDF
      </a>
    </div>
  )
}

export default TeacherDashboard