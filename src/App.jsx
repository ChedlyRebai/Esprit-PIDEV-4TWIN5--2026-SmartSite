import "./App.css";

const stats = [
  { value: "24/7", label: "Surveillance IA" },
  { value: "18%", label: "Gain de temps moyen" },
  { value: "92%", label: "Alertes détectées" },
];

const features = [
  {
    title: "Gestion de chantier",
    text: "Centralisez les projets, équipes, tâches et ressources dans une seule interface.",
    icon: "🏗️",
  },
  {
    title: "Analyse IA",
    text: "Détectez les risques, retards et anomalies grâce à l'intelligence artificielle.",
    icon: "🤖",
  },
  {
    title: "Rapports automatiques",
    text: "Générez des rapports clairs et instantanés pour vos clients et vos équipes.",
    icon: "📊",
  },
  {
    title: "Suivi en temps réel",
    text: "Visualisez l'état d'avancement, la productivité et les priorités du jour.",
    icon: "⚡",
  },
  {
    title: "Sécurité chantier",
    text: "Signalez les zones à risque et améliorez la prévention sur le terrain.",
    icon: "🛡️",
  },
  {
    title: "Pilotage intelligent",
    text: "Prenez des décisions plus rapides avec des indicateurs simples et utiles.",
    icon: "🧠",
  },
];

const insights = [
  { label: "Projets actifs", value: "12", trend: "+3 ce mois" },
  { label: "Tâches en retard", value: "04", trend: "-27%" },
  { label: "Risques détectés", value: "08", trend: "IA active" },
];

function App() {
  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">SmartSite</div>
            <div className="brand-sub">Construction Management IA</div>
          </div>
        </div>

        <nav className="topnav">
          <a href="#features">Fonctionnalités</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#demo">Démo</a>
        </nav>

        <a className="btn btn-primary btn-small" href="#demo">
          Commencer
        </a>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">IA pour le chantier</span>
            <h1>Gérez vos chantiers avec une plateforme intelligente et moderne.</h1>
            <p className="hero-text">
              Planifiez, suivez et automatisez vos opérations de construction avec
              une interface claire, des rapports instantanés et une analyse IA
              pensée pour les équipes terrain.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#features">
                Découvrir la plateforme
              </a>
              <a className="btn btn-secondary" href="#dashboard">
                Voir l'aperçu
              </a>
            </div>

            <div className="hero-stats">
              {stats.map((item) => (
                <article className="stat-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="glass-card dashboard-preview">
              <div className="preview-top">
                <div>
                  <p className="preview-label">Projet en cours</p>
                  <h3>Résidence Horizon</h3>
                </div>
                <span className="status-pill">IA en ligne</span>
              </div>

              <div className="preview-grid">
                {insights.map((item) => (
                  <div className="mini-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.trend}</small>
                  </div>
                ))}
              </div>

              <div className="timeline">
                <div className="timeline-item done">
                  <span className="dot" />
                  <div>
                    <strong>Validation du plan</strong>
                    <p>Terminée</p>
                  </div>
                </div>
                <div className="timeline-item active">
                  <span className="dot" />
                  <div>
                    <strong>Inspection terrain</strong>
                    <p>En cours avec analyse IA</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <span className="dot" />
                  <div>
                    <strong>Rapport automatique</strong>
                    <p>Prévu aujourd'hui</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section container">
          <div className="section-heading">
            <span className="eyebrow">Fonctionnalités clés</span>
            <h2>Tout ce qu'il faut pour piloter un chantier avec précision.</h2>
            <p>
              Une base visuelle moderne, pensée pour la lisibilité, la performance
              et l'impact métier.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="dashboard" className="section section-alt">
          <div className="container dashboard-section">
            <div className="section-heading">
              <span className="eyebrow">Aperçu dashboard</span>
              <h2>Une interface conçue pour décider vite.</h2>
              <p>
                Vue synthétique des indicateurs essentiels : avancement, retards,
                sécurité et performance.
              </p>
            </div>

            <div className="dashboard-cards">
              <article className="info-card">
                <h3>Progression globale</h3>
                <div className="progress-row">
                  <span>Lot gros œuvre</span>
                  <strong>78%</strong>
                </div>
                <div className="progress-bar">
                  <span style={{ width: "78%" }} />
                </div>
                <p>Avancement stable, délai maîtrisé.</p>
              </article>

              <article className="info-card">
                <h3>Alertes IA</h3>
                <ul className="list">
                  <li>2 zones à surveiller</li>
                  <li>1 retard critique détecté</li>
                  <li>3 photos à analyser</li>
                </ul>
              </article>

              <article className="info-card">
                <h3>Productivité équipe</h3>
                <ul className="list">
                  <li>Temps gagné sur reporting</li>
                  <li>Meilleure visibilité terrain</li>
                  <li>Priorités mises à jour en temps réel</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="demo" className="cta container">
          <div>
            <span className="eyebrow">Prêt à démarrer</span>
            <h2>Donnez une image premium à votre application dès la page d'accueil.</h2>
            <p>
              Cette base peut ensuite être reliée au backend, à l'authentification
              et aux modules métier.
            </p>
          </div>

          <a className="btn btn-primary" href="#top">
            Retour en haut
          </a>
        </section>
      </main>
    </div>
  );
}

export default App;
