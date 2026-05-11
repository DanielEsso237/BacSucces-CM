import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, getFilters, downloadUrl } from '../api/documents'
import type { Document, Filters } from '../api/documents'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/dashboard.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function StudentDashboard() {
  const { user, token, logout } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filters, setFilters] = useState<Filters | null>(null)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [docType, setDocType] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Document | null>(null)

  useEffect(() => {
    getFilters().then(setFilters)
  }, [])

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    getDocuments(token, {
      subject: subject || undefined,
      level: level || undefined,
      doc_type: docType || undefined,
    })
      .then(setDocuments)
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }, [token, subject, level, docType])

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.author.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">BacSuccès-CM</div>
        <div className="dashboard-user">
          <span>👋 {user?.full_name}</span>
          <span className="badge badge-student">Élève</span>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="student-layout">
          <aside className="filters-panel">
            <h3>Filtres</h3>

            <div className="form-group">
              <label>Recherche</label>
              <input
                type="text"
                placeholder="Titre, auteur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Matière</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Toutes</option>
                {filters?.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Niveau</label>
              <select value={level} onChange={e => setLevel(e.target.value)}>
                <option value="">Tous</option>
                {filters?.levels.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="">Tous</option>
                <option value="EXAM">Épreuves</option>
                <option value="COURSE">Cours</option>
              </select>
            </div>

            <button className="btn-reset" onClick={() => {
              setSubject('')
              setLevel('')
              setDocType('')
              setSearch('')
            }}>
              Réinitialiser
            </button>
          </aside>

          <div className="student-content">
            {selected && token ? (
              <DocumentViewer
                doc={selected}
                token={token}
                onClose={() => setSelected(null)}
              />
            ) : (
              <>
                <div className="results-header">
                  <h2>Documents disponibles</h2>
                  <span className="results-count">
                    {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                  </span>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {isLoading && <p className="loading">Chargement...</p>}

                {!isLoading && filtered.length === 0 && (
                  <div className="empty-state">
                    <p>Aucun document ne correspond à ta recherche.</p>
                  </div>
                )}

                {!isLoading && (
                  <div className="documents-grid">
                    {filtered.map(doc => (
                      <StudentDocumentCard
                        key={doc.id}
                        doc={doc}
                        onRead={() => setSelected(doc)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StudentDocumentCard({ doc, onRead }: { doc: Document; onRead: () => void }) {
  return (
    <div className="document-card">
      <div className="document-card-header">
        <span className={`badge ${doc.doc_type === 'EXAM' ? 'badge-exam' : 'badge-course'}`}>
          {doc.doc_type === 'EXAM' ? 'Épreuve' : 'Cours'}
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

      <p className="document-author">Par {doc.author.full_name}</p>

      <div className="document-actions">
        <button className="btn-read" onClick={onRead}>
          Lire en ligne
        </button>

        {/* ✅ FIX */}
        <a
          className="btn-download-small"
          href={downloadUrl(doc.id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger
        </a>
      </div>
    </div>
  )
}

function DocumentViewer({ doc, token, onClose }: { doc: Document; token: string; onClose: () => void }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <div>
          <h2 className="viewer-title">{doc.title}</h2>
          <p className="viewer-meta">
            {doc.subject} · {doc.level} · Par {doc.author.full_name}
          </p>
        </div>

        <div className="viewer-actions">
          {/* ✅ FIX */}
          <a
            className="btn-download-small"
            href={downloadUrl(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Télécharger
          </a>

          <button className="btn-close" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>
      </div>

      <div className="viewer-pagination">
        <button
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(p => p - 1)}
        >
          ← Précédent
        </button>

        <span>Page {pageNumber} / {numPages}</span>

        <button
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber(p => p + 1)}
        >
          Suivant →
        </button>
      </div>

      <div className="viewer-pdf">
        <PDFDocument
          file={`http://localhost:8000/documents/${doc.id}/download`}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          options={{
            httpHeaders: { Authorization: `Bearer ${token}` }
          }}
        >
          <Page pageNumber={pageNumber} width={750} />
        </PDFDocument>
      </div>
    </div>
  )
}

export default StudentDashboard