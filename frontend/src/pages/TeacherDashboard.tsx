import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, getFilters, uploadDocument, downloadUrl } from '../api/documents';
import type { Document, Filters } from '../api/documents';
import '../styles/dashboard.css';

type Tab = 'mes-documents' | 'uploader';

function TeacherDashboard() {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('mes-documents');

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">BacSuccès-CM</div>
        <div className="dashboard-user">
          <span>👋 {user?.full_name}</span>
          <span className="badge badge-teacher">Enseignant</span>
          <button className="btn-logout" onClick={logout}>
            Déconnexion
          </button>
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
        {tab === 'mes-documents' && <MesDocuments token={token!} userId={user!.id} />}
        {tab === 'uploader' && <UploadForm token={token!} onSuccess={() => setTab('mes-documents')} />}
      </main>
    </div>
  );
}

function MesDocuments({ token, userId }: { token: string; userId: number }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocuments(token)
      .then((docs) => setDocuments(docs.filter((d) => d.author_id === userId)))
      .catch(() => setError('Erreur lors du chargement des documents'))
      .finally(() => setIsLoading(false));
  }, [token, userId]);

  if (isLoading) return <p className="loading">Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <p>Tu n'as pas encore uploadé de documents.</p>
      </div>
    );
  }

  return (
    <div className="documents-grid">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} token={token} />
      ))}
    </div>
  );
}

function UploadForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getFilters().then(setFilters);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Sélectionne un fichier PDF');

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('level', level);
    formData.append('doc_type', docType);
    formData.append('file', file);

    try {
      await uploadDocument(token, formData);
      setSuccess('Document uploadé avec succès !');
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l’upload');
    } finally {
      setIsLoading(false);
    }
  }

  if (!filters) return <p className="loading">Chargement des filtres...</p>;

  return (
    <div className="upload-form-container">
      <h2>Uploader un document</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Épreuve de Mathématiques Terminale 2023"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris brièvement le contenu..."
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subject">Matière</label>
            <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required>
              <option value="">Choisir...</option>
              {filters.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="level">Niveau</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} required>
              <option value="">Choisir...</option>
              {filters.levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="docType">Type</label>
            <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} required>
              <option value="">Choisir...</option>
              <option value="EXAM">Épreuve</option>
              <option value="COURSE">Cours</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="file">Fichier PDF</label>
          <input
            id="file"
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Upload en cours...' : 'Uploader le document'}
        </button>
      </form>
    </div>
  );
}

function DocumentCard({ doc, token }: { doc: Document; token: string }) {
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
      {doc.description && <p className="document-description">{doc.description}</p>}

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
  );
}

export default TeacherDashboard;