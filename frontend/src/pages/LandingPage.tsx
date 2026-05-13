import { Link } from 'react-router-dom'
import '../styles/landing.css'

const DEMO_DOCS = [
  { type: 'exam', name: 'Baccalauréat Mathématiques 2023', meta: 'Terminale · Prof. Mbarga', chip: 'Épreuve' },
  { type: 'annales', name: 'Annales Physique-Chimie 2018–2023', meta: 'Terminale · Prof. Atanga', chip: 'Annales' },
  { type: 'exam', name: 'Épreuve de Français Série A 2022', meta: '1ère · Prof. Nkeng', chip: 'Épreuve' },
  { type: 'annales', name: 'Annales SVT BEPC 2015–2023', meta: '3ème · Prof. Ngo Biyong', chip: 'Annales' },
]

const FEATURES = [
  {
    icon: 'green',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    title: 'Épreuves officielles',
    desc: 'Accède aux sujets des examens officiels camerounais : BAC, BEPC, CEP, classés par matière et par niveau.',
  },
  {
    icon: 'violet',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    title: 'Annales complètes',
    desc: 'Des recueils d\'épreuves sur plusieurs années pour t\'entraîner intensément et identifier les tendances des examinateurs.',
  },
  {
    icon: 'blue',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    title: 'Recherche avancée',
    desc: 'Filtre par matière, niveau ou type de document pour trouver exactement ce dont tu as besoin en quelques secondes.',
  },
  {
    icon: 'teal',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    title: 'Téléchargement PDF',
    desc: 'Télécharge les documents en PDF pour les consulter hors ligne, les imprimer ou les partager avec tes camarades.',
  },
  {
    icon: 'amber',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Enseignants certifiés',
    desc: 'Tous les enseignants sont vérifiés par notre équipe. Chaque document publié provient d\'un professionnel de l\'éducation.',
  },
  {
    icon: 'red',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: 'Lecture en ligne',
    desc: 'Consulte les documents directement dans ton navigateur sans rien installer. Pagination intégrée pour une lecture fluide.',
  },
]

function LandingPage() {
  return (
    <div className="lp-root">
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-nav-icon">B</div>
          <span className="lp-nav-name">BacSuccès-CM</span>
        </div>
        <div className="lp-nav-links">
          <Link to="/login" className="lp-nav-link">Se connecter</Link>
          <Link to="/register/student" className="lp-nav-cta">Commencer gratuitement</Link>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-hero-badge">
            <div className="lp-hero-badge-dot" />
            La plateforme #1 pour le bac camerounais
          </div>
          <h1 className="lp-hero-title">
            Réussis ton bac avec les <span>meilleures ressources</span>
          </h1>
          <p className="lp-hero-desc">
            Des milliers d'épreuves et d'annales partagées par des enseignants certifiés. Cherche, lis, télécharge — gratuitement.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register/student" className="lp-btn-primary">
              Créer un compte élève
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/login" className="lp-btn-secondary">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-hero-float top">
            <span className="lp-hero-float-icon">📚</span>
            2 000+ documents
          </div>

          <div className="lp-hero-card">
            <div className="lp-hero-card-header">
              <span className="lp-hero-card-title">Documents récents</span>
              <span className="lp-hero-card-count">2 148 disponibles</span>
            </div>
            {DEMO_DOCS.map((doc, i) => (
              <div className="lp-hero-doc" key={i}>
                <div className={`lp-hero-doc-icon ${doc.type}`}>
                  {doc.type === 'exam'
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  }
                </div>
                <div className="lp-hero-doc-info">
                  <p className="lp-hero-doc-name">{doc.name}</p>
                  <p className="lp-hero-doc-meta">{doc.meta}</p>
                </div>
                <span className={`lp-hero-doc-chip ${doc.type}`}>{doc.chip}</span>
              </div>
            ))}
          </div>

          <div className="lp-hero-float bottom">
            <span className="lp-hero-float-icon">✅</span>
            Enseignants vérifiés
          </div>
        </div>
      </section>

      <section className="lp-stats">
        <div className="lp-stats-inner">
          <div>
            <p className="lp-stat-value">2 000<span>+</span></p>
            <p className="lp-stat-label">Documents disponibles</p>
          </div>
          <div>
            <p className="lp-stat-value">500<span>+</span></p>
            <p className="lp-stat-label">Enseignants certifiés</p>
          </div>
          <div>
            <p className="lp-stat-value">10k<span>+</span></p>
            <p className="lp-stat-label">Élèves inscrits</p>
          </div>
          <div>
            <p className="lp-stat-value">8</p>
            <p className="lp-stat-label">Matières couvertes</p>
          </div>
        </div>
      </section>

      <section className="lp-features">
        <div className="lp-section-tag">Fonctionnalités</div>
        <h2 className="lp-section-title">Tout ce qu'il te faut pour réussir</h2>
        <p className="lp-section-desc">
          Une plateforme pensée pour les élèves camerounais, avec des outils simples et efficaces pour préparer les examens.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card" key={i}>
              <div className={`lp-feature-icon ${f.icon}`}>{f.svg}</div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-how">
        <div className="lp-how-inner">
          <div className="lp-section-tag">Comment ça marche</div>
          <h2 className="lp-section-title">Prêt en 3 étapes</h2>
          <p className="lp-section-desc">
            Rejoins BacSuccès-CM en quelques minutes et commence à réviser immédiatement.
          </p>
          <div className="lp-how-grid">
            <div className="lp-how-step">
              <div className="lp-how-number">1</div>
              <h3 className="lp-how-title">Crée ton compte gratuitement</h3>
              <p className="lp-how-desc">
                Inscris-toi en tant qu'élève en moins de 2 minutes. Aucune carte bancaire requise, la plateforme est 100 % gratuite pour les élèves.
              </p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-number">2</div>
              <h3 className="lp-how-title">Cherche et filtre les documents</h3>
              <p className="lp-how-desc">
                Utilise les filtres par matière, niveau et type pour trouver les épreuves et annales qui correspondent exactement à tes besoins.
              </p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-number">3</div>
              <h3 className="lp-how-title">Lis en ligne ou télécharge</h3>
              <p className="lp-how-desc">
                Consulte les documents directement dans ton navigateur ou télécharge-les en PDF pour réviser même sans connexion internet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-ring" />
        <div className="lp-cta-ring" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">
            Prêt à <span>décrocher ton bac</span> ?
          </h2>
          <p className="lp-cta-desc">
            Rejoins des milliers d'élèves qui préparent leurs examens avec BacSuccès-CM. Inscription gratuite, accès immédiat.
          </p>
          <div className="lp-cta-actions">
            <Link to="/register/student" className="lp-btn-white">
              Créer un compte élève
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/register/teacher" className="lp-btn-outline-white">
              Je suis enseignant
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <div className="lp-footer-icon">B</div>
          <span className="lp-footer-name">BacSuccès-CM</span>
        </div>
        <p className="lp-footer-copy">© {new Date().getFullYear()} BacSuccès-CM. Tous droits réservés.</p>
      </footer>
    </div>
  )
}

export default LandingPage