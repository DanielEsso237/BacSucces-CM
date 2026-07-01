import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, getFilters, uploadDocument, coverUrl } from '../api/documents'
import type { Document, Filters } from '../api/documents'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import PhoneInput, { toFullCameroonPhone, stripCameroonPrefix } from '../components/PhoneInput'
import ImageLightbox from '../components/ImageLightbox'
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
    case 'CORRECTION': return { label: 'Correction', cls: 'chip-correction' }
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
          <button className={`td-nav-item ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Mes documents
          </button>
          <button className={`td-nav-item ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Uploader un document
          </button>
        </nav>

        {/* Lien WhatsApp corrigé */}
        <a
          href="https://chat.whatsapp.com/HhDBK5j5f9sCsiYxrD8VUj?s=sh&p=a&ilr=0&amv=2"
          target="_blank"
          rel="noopener noreferrer"
          className="td-wa-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          Rejoindre la communauté
        </a>

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
        {tab === 'upload' && token && user && (
          <UploadForm token={token} teacherContact={user.contact ?? null} onSuccess={() => setTab('docs')} />
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
          <div><h1 className="td-page-title">Mes documents</h1><p className="td-page-sub">Tous vos documents publiés</p></div>
        </div>
        <div className="td-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="td-skeleton" />)}</div>
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
  const [showLightbox, setShowLightbox] = useState(false)
  const handleDownload = useCallback(() => downloadWithAuth(doc.id, doc.title, token), [doc.id, doc.title, token])

  return (
    <article className="td-card">
      {doc.doc_type === 'ANNALES' && doc.has_cover && (
        <div className="td-card-cover">
          <img src={coverUrl(doc.id, token)} alt="" className="td-card-cover-img" />
        </div>
      )}
      <div className="td-card-body">
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
        {doc.doc_type === 'ANNALES' && doc.annales_contacts && doc.annales_contacts.length > 0 && (
          <div className="td-card-contacts">
            <span className="td-card-contacts-label">Numéros de contact</span>
            <div className="td-card-contacts-list">
              {doc.annales_contacts.map((c, i) => (
                <span key={i} className="td-contact-chip">{c}</span>
              ))}
            </div>
          </div>
        )}
        {doc.doc_type === 'ANNALES' ? (
          <button className="td-btn-download" onClick={() => setShowLightbox(true)} disabled={!doc.has_cover}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            Agrandir la photo
          </button>
        ) : (
          <button className="td-btn-download" onClick={handleDownload}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger le PDF
          </button>
        )}
      </div>
      {showLightbox && doc.has_cover && (
        <ImageLightbox src={coverUrl(doc.id, token)} onClose={() => setShowLightbox(false)} />
      )}
    </article>
  )
}

function UploadForm({ token, teacherContact, onSuccess }: { token: string; teacherContact: string | null; onSuccess: () => void }) {
  const [filters, setFilters] = useState<Filters | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [docType, setDocType] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [contacts, setContacts] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const needsCover = docType === 'ANNALES'
  const needsPdf = docType === 'EXAM' || docType === 'CORRECTION'

  useEffect(() => { getFilters().then(setFilters) }, [])

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [pdfPreviewUrl, coverPreview])

  useEffect(() => {
    if (!needsCover && coverFile) {
      setCoverFile(null)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverPreview(null)
    }
    if (!needsPdf && pdfFile) {
      setPdfFile(null)
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }, [needsCover, needsPdf, coverFile, pdfFile, coverPreview, pdfPreviewUrl])

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (!f) return
    if (!f.type.startsWith('image/')) { 
      setError('Image de couverture : JPG, PNG ou WEBP uniquement'); 
      return 
    }
    setCoverFile(f)
    setError(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(f))
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (f && f.type !== 'application/pdf') { 
      setError('Seuls les fichiers PDF sont acceptés'); 
      return 
    }
    setPdfFile(f)
    setError(null)
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
    setPdfPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  function addContact() { setContacts(prev => [...prev, '']) }
  function removeContact(i: number) { setContacts(prev => prev.filter((_, idx) => idx !== i)) }
  function updateContact(i: number, val: string) { setContacts(prev => prev.map((c, idx) => idx === i ? val : c)) }
  function useMyNumber() {
    if (!teacherContact) return
    const digits = stripCameroonPrefix(teacherContact)
    setContacts(prev => {
      const already = prev.includes(digits)
      if (already) return prev
      const withoutEmpty = prev.filter(c => c.trim() !== '')
      return [...withoutEmpty, digits]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (needsPdf && !pdfFile) { setError('Sélectionne un fichier PDF'); return }
    if (needsCover && !coverFile) { setError("Sélectionne une image de couverture"); return }
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('subject', subject)
    formData.append('level', level)
    formData.append('doc_type', docType)
    if (needsPdf && pdfFile) formData.append('file', pdfFile)
    if (needsCover && coverFile) formData.append('cover_image', coverFile)
    if (needsCover) {
      const validContacts = contacts.filter(c => c.trim() !== '').map(c => toFullCameroonPhone(c))
      if (validContacts.length > 0) {
        formData.append('annales_contacts', JSON.stringify(validContacts))
      }
    }

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
          <p className="td-page-sub">Choisissez d'abord un type, le formulaire s'adapte automatiquement</p>
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
              <textarea className="td-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Quelques mots pour décrire le contenu…" />
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
                  <option value="CORRECTION">Correction</option>
                </select>
              </div>
            </div>

            {needsCover && (
              <div className="td-field">
                <label className="td-label">Image de couverture</label>
                <p className="td-field-hint">Pour une annale, seule une photo de couverture est nécessaire.</p>
                <label className="td-cover-drop">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
                  {coverPreview ? (
                    <div className="td-cover-preview-wrap">
                      <img src={coverPreview} alt="Aperçu couverture" className="td-cover-preview-img" />
                      <span className="td-cover-change-hint">Cliquer pour changer</span>
                    </div>
                  ) : (
                    <div className="td-file-placeholder">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span>Cliquer pour ajouter une image de couverture</span>
                      <span className="td-file-hint">JPG, PNG ou WEBP</span>
                    </div>
                  )}
                </label>
              </div>
            )}

            {needsCover && (
              <div className="td-field">
                <label className="td-label">Numéros de contact pour acquérir</label>
                <p className="td-field-hint">Les élèves verront ces numéros sur la carte pour vous contacter.</p>
                <div className="td-contacts-list">
                  {contacts.map((c, i) => (
                    <div key={i} className="td-contact-row">
                      <PhoneInput className="td-input" value={c} onChange={val => updateContact(i, val)} />
                      {contacts.length > 1 && (
                        <button type="button" className="td-contact-remove" onClick={() => removeContact(i)} title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="td-contacts-actions">
                  <button type="button" className="td-contact-add" onClick={addContact}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter un numéro
                  </button>
                  {teacherContact && (
                    <button type="button" className="td-contact-use-mine" onClick={useMyNumber}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>
                      Utiliser mon numéro ({teacherContact})
                    </button>
                  )}
                </div>
              </div>
            )}

            {needsPdf && (
              <div className="td-field">
                <label className="td-label">Fichier PDF</label>
                <label className="td-file-drop">
                  <input type="file" accept=".pdf" onChange={handlePdfChange} style={{ display: 'none' }} />
                  {pdfFile ? (
                    <div className="td-file-selected">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span>{pdfFile.name}</span>
                      <span className="td-file-size">{(pdfFile.size / 1024).toFixed(0)} KB</span>
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
            )}

            <button className="td-btn-submit" type="submit" disabled={isLoading || !docType}>
              {isLoading ? 'Publication en cours…' : 'Publier le document'}
            </button>
          </form>
        </div>

        {needsPdf && pdfPreviewUrl && (
          <div className="td-preview-card">
            <p className="td-preview-title">Aperçu PDF</p>
            <div className="td-preview-pdf">
              <PDFDocument file={pdfPreviewUrl} options={previewOptions}>
                <Page pageNumber={1} width={280} />
              </PDFDocument>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard