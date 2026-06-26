import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, getFilters } from '../api/documents'
import type { Document, Filters } from '../api/documents'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/student.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const DB_NAME = 'bacsucces-offline'
const DB_VERSION = 1
const STORE_NAME = 'pdfs'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function savePDFOffline(docId: number, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, docId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getPDFOffline(docId: number): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(docId)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function deletePDFOffline(docId: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(docId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function listOfflineIds(): Promise<number[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAllKeys()
    req.onsuccess = () => resolve(req.result as number[])
    req.onerror = () => reject(req.error)
  })
}

async function fetchPDFBlob(docId: number, token: string): Promise<Blob> {
  const res = await fetch(`http://localhost:8000/documents/${docId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur réseau')
  return res.blob()
}

async function downloadWithAuth(docId: number, title: string, token: string) {
  const blob = await fetchPDFBlob(docId, token)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function docTypeMeta(type: string) {
  switch (type) {
    case 'EXAM': return { label: 'Épreuve', cls: 'chip-exam' }
    case 'ANNALES': return { label: 'Annales', cls: 'chip-annales' }
    case 'CORRECTION': return { label: 'Correction', cls: 'chip-correction' }
    default: return { label: type, cls: 'chip-exam' }
  }
}

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
  const [offlineIds, setOfflineIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    getFilters().then(setFilters)
    listOfflineIds().then(ids => setOfflineIds(new Set(ids)))
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

  const stats = {
    total: documents.length,
    exams: documents.filter(d => d.doc_type === 'EXAM').length,
    annales: documents.filter(d => d.doc_type === 'ANNALES').length,
    corrections: documents.filter(d => d.doc_type === 'CORRECTION').length,
  }

  const hasFilters = !!(subject || level || docType || search)

  function resetFilters() {
    setSubject('')
    setLevel('')
    setDocType('')
    setSearch('')
  }

  async function handleToggleOffline(doc: Document) {
    if (!token) return
    if (offlineIds.has(doc.id)) {
      await deletePDFOffline(doc.id)
      setOfflineIds(prev => { const s = new Set(prev); s.delete(doc.id); return s })
    } else {
      const blob = await fetchPDFBlob(doc.id, token)
      await savePDFOffline(doc.id, blob)
      setOfflineIds(prev => new Set([...prev, doc.id]))
    }
  }

  return (
    <div className="sd-root">
      <aside className="sd-sidebar">
        <div className="sd-brand">
          <span className="sd-brand-icon">B</span>
          <span className="sd-brand-name">BacSuccès</span>
        </div>

        <nav className="sd-nav">
          <span className="sd-nav-label">Bibliothèque</span>
          <button
            className={`sd-nav-item ${docType === '' && !subject && !level ? 'active' : ''}`}
            onClick={() => { setDocType(''); setSubject(''); setLevel('') }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Tous les documents
            <span className="sd-nav-count">{stats.total}</span>
          </button>
          <button
            className={`sd-nav-item ${docType === 'EXAM' ? 'active' : ''}`}
            onClick={() => setDocType('EXAM')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Épreuves
            <span className="sd-nav-count">{stats.exams}</span>
          </button>
          <button
            className={`sd-nav-item ${docType === 'ANNALES' ? 'active' : ''}`}
            onClick={() => setDocType('ANNALES')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Annales
            <span className="sd-nav-count">{stats.annales}</span>
          </button>
          <button
            className={`sd-nav-item ${docType === 'CORRECTION' ? 'active' : ''}`}
            onClick={() => setDocType('CORRECTION')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Corrections
            <span className="sd-nav-count">{stats.corrections}</span>
          </button>
        </nav>

        <div className="sd-filters">
          <span className="sd-nav-label">Filtrer</span>

          <div className="sd-filter-group">
            <label className="sd-filter-label">Matière</label>
            <select className="sd-select" value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">Toutes les matières</option>
              {filters?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="sd-filter-group">
            <label className="sd-filter-label">Niveau</label>
            <select className="sd-select" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="">Tous les niveaux</option>
              {filters?.levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button className="sd-reset-btn" onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
        </div>

        <div className="sd-sidebar-footer">
          <div className="sd-user-block">
            <div className="sd-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
            <div className="sd-user-info">
              <span className="sd-user-name">{user?.full_name}</span>
              <span className="sd-user-role">Élève</span>
            </div>
          </div>
          <button className="sd-logout-btn" onClick={logout} title="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="sd-main">
        {selected && token ? (
          <ViewerPanel
            doc={selected}
            token={token}
            isOffline={offlineIds.has(selected.id)}
            onClose={() => setSelected(null)}
            onToggleOffline={() => handleToggleOffline(selected)}
          />
        ) : (
          <>
            <div className="sd-topbar">
              <div className="sd-search-wrap">
                <svg className="sd-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  className="sd-search-input"
                  type="text"
                  placeholder="Rechercher un document ou un auteur…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="sd-search-clear" onClick={() => setSearch('')} aria-label="Effacer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <span className="sd-result-count">
                {isLoading ? '…' : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {error && <div className="sd-error-banner">{error}</div>}

            {isLoading && (
              <div className="sd-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="sd-skeleton" />
                ))}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="sd-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>Aucun document trouvé</p>
                {hasFilters && (
                  <button className="sd-reset-btn" onClick={resetFilters}>Effacer les filtres</button>
                )}
              </div>
            )}

            {!isLoading && filtered.length > 0 && (
              <div className="sd-grid">
                {filtered.map(doc => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    token={token!}
                    isOffline={offlineIds.has(doc.id)}
                    onRead={() => setSelected(doc)}
                    onToggleOffline={() => handleToggleOffline(doc)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function DocCard({ doc, token, isOffline, onRead, onToggleOffline }: {
  doc: Document
  token: string
  isOffline: boolean
  onRead: () => void
  onToggleOffline: () => void
}) {
  const { label, cls } = docTypeMeta(doc.doc_type)
  const [savingOffline, setSavingOffline] = useState(false)

  const handleDownload = useCallback(() => {
    downloadWithAuth(doc.id, doc.title, token)
  }, [doc.id, doc.title, token])

  async function handleOffline() {
    setSavingOffline(true)
    await onToggleOffline()
    setSavingOffline(false)
  }

  return (
    <article className="sd-card">
      <div className="sd-card-top">
        <span className={`sd-chip ${cls}`}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isOffline && (
            <span className="sd-offline-badge" title="Disponible hors-ligne">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 16 12 13 21 11 3 8 12 2 12"/></svg>
              Hors-ligne
            </span>
          )}
          <span className="sd-card-date">
            {new Date(doc.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </span>
        </div>
      </div>

      <h3 className="sd-card-title">{doc.title}</h3>

      {doc.description && (
        <p className="sd-card-desc">{doc.description}</p>
      )}

      <div className="sd-card-tags">
        <span className="sd-tag">{doc.subject}</span>
        <span className="sd-tag">{doc.level}</span>
      </div>

      <p className="sd-card-author">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        {doc.author.full_name}
      </p>

      <div className="sd-card-actions">
        <button className="sd-btn-primary" onClick={onRead}>
          Lire
        </button>
        <button className="sd-btn-ghost" onClick={handleDownload}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Télécharger
        </button>
      </div>

      <button
        className={`sd-btn-offline ${isOffline ? 'sd-btn-offline-active' : ''}`}
        onClick={handleOffline}
        disabled={savingOffline}
        title={isOffline ? 'Supprimer de la lecture hors-ligne' : 'Sauvegarder pour lire hors-ligne'}
      >
        {savingOffline ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
        ) : isOffline ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM9 17h6M9 13h6M9 9h1"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        )}
        {savingOffline ? 'Sauvegarde…' : isOffline ? 'Disponible hors-ligne' : 'Lire hors-ligne'}
      </button>
    </article>
  )
}

function ViewerPanel({ doc, token, isOffline, onClose, onToggleOffline }: {
  doc: Document
  token: string
  isOffline: boolean
  onClose: () => void
  onToggleOffline: () => void
}) {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [offlineBlobUrl, setOfflineBlobUrl] = useState<string | null>(null)
  const [savingOffline, setSavingOffline] = useState(false)
  const { label, cls } = docTypeMeta(doc.doc_type)

  useEffect(() => {
    if (isOffline) {
      getPDFOffline(doc.id).then(blob => {
        if (blob) setOfflineBlobUrl(URL.createObjectURL(blob))
      })
    } else {
      setOfflineBlobUrl(null)
    }
    return () => {
      if (offlineBlobUrl) URL.revokeObjectURL(offlineBlobUrl)
    }
  }, [doc.id, isOffline])

  const pdfOptions = useMemo(() => ({
    httpHeaders: { Authorization: `Bearer ${token}` },
  }), [token])

  const pdfUrl = useMemo(() => (
    `http://localhost:8000/documents/${doc.id}/download`
  ), [doc.id])

  const handleDownload = useCallback(() => {
    downloadWithAuth(doc.id, doc.title, token)
  }, [doc.id, doc.title, token])

  async function handleOffline() {
    setSavingOffline(true)
    await onToggleOffline()
    setSavingOffline(false)
    if (!isOffline) {
      const blob = await getPDFOffline(doc.id)
      if (blob) setOfflineBlobUrl(URL.createObjectURL(blob))
    } else {
      setOfflineBlobUrl(null)
    }
  }

  return (
    <div className="sd-viewer">
      <div className="sd-viewer-header">
        <button className="sd-viewer-back" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <div className="sd-viewer-info">
          <span className={`sd-chip ${cls}`}>{label}</span>
          <h2 className="sd-viewer-title">{doc.title}</h2>
          <p className="sd-viewer-sub">{doc.subject} · {doc.level} · {doc.author.full_name}</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`sd-btn-ghost ${isOffline ? 'sd-btn-ghost-active' : ''}`}
            onClick={handleOffline}
            disabled={savingOffline}
            title={isOffline ? 'Retirer du mode hors-ligne' : 'Sauvegarder pour lire hors-ligne'}
          >
            {savingOffline ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                Sauvegarde…
              </>
            ) : isOffline ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Hors-ligne
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Hors-ligne
              </>
            )}
          </button>

          <button className="sd-btn-ghost" onClick={handleDownload}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger
          </button>
        </div>
      </div>

      <div className="sd-viewer-toolbar">
        <button
          className="sd-page-btn"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(p => p - 1)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="sd-page-label">
          Page <strong>{pageNumber}</strong> / <strong>{numPages || '—'}</strong>
        </span>
        <button
          className="sd-page-btn"
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber(p => p + 1)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="sd-viewer-pdf">
        <PDFDocument
          file={offlineBlobUrl ?? pdfUrl}
          options={offlineBlobUrl ? undefined : pdfOptions}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={pageNumber} width={760} />
        </PDFDocument>
      </div>
    </div>
  )
}

export default StudentDashboard