import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeAlerts } from "./alerts";
import { Home } from "./screens/Home";
import { AssistantScreen } from "./screens/Assistant";
import { GardensScreen } from "./screens/Gardens";
import { PlantsScreen } from "./screens/Plants";
import { SpeciesScreen } from "./screens/Species";
import { WaterScreen } from "./screens/Water";
import { AboutScreen } from "./screens/About";

const TABS = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "gardens", label: "Terrain", icon: "▦" },
  { id: "assistant", label: "Objectifs", icon: "◎" },
  { id: "plants", label: "Cultures", icon: "♧" },
];
const MORE = [
  { id: "water", label: "Mes réserves d'eau", icon: "💧" },
  { id: "species", label: "Catalogue des espèces", icon: "📖" },
  { id: "about", label: "À propos de JardinConnect", icon: "ℹ️" },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);

  const alertCount = useLiveQuery(
    async () => (await computeAlerts()).length,
    [],
    0,
  );

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand-button" onClick={() => { setTab("home"); setMoreOpen(false); }} aria-label="Retour à l’accueil"><span className="brand-mark">✳</span><span><strong>JardinConnect</strong><small>Mon potager, simplement</small></span></button>
        {alertCount > 0 && (
          <button className="alert-pip" onClick={() => setTab("home")} title="Voir les alertes">
            {alertCount}
          </button>
        )}
      </header>

      <main className="app-main">
        {moreOpen && <div className="more-panel"><strong>Autres outils</strong><p className="muted">Retrouvez ici les fonctions complémentaires.</p>{MORE.map(item => <button key={item.id} onClick={() => {setTab(item.id);setMoreOpen(false)}}><span>{item.icon}</span>{item.label}<span className="more-chevron">›</span></button>)}</div>}
        {tab === "home" && <Home onGo={setTab} />}
        {tab === "assistant" && <AssistantScreen />}
        {tab === "gardens" && <GardensScreen />}
        {tab === "plants" && <PlantsScreen />}
        {tab === "water" && <WaterScreen />}
        {tab === "species" && <SpeciesScreen />}
        {tab === "about" && <AboutScreen />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => { setTab(t.id); setMoreOpen(false); }}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
        <button className={`tab ${moreOpen || MORE.some(item => item.id === tab) ? "tab-active" : ""}`} onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen}><span className="tab-icon">☷</span><span className="tab-label">Plus</span></button>
      </nav>
    </div>
  );
}
