import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeAlerts } from "./alerts";
import { Home } from "./screens/Home";
import { AssistantScreen } from "./screens/Assistant";
import { GardensScreen } from "./screens/Gardens";
import { PlantsScreen } from "./screens/Plants";
import { SpeciesScreen } from "./screens/Species";
import { WaterScreen } from "./screens/Water";
import { SensorsScreen } from "./screens/Sensors";
import { AboutScreen } from "./screens/About";

const TABS = [
  { id: "home", label: "Accueil", icon: "🏠" },
  { id: "assistant", label: "Assistant", icon: "🌱" },
  { id: "gardens", label: "Jardins", icon: "🌍" },
  { id: "plants", label: "Plantes", icon: "🌿" },
  { id: "water", label: "Eau", icon: "💧" },
  { id: "sensors", label: "Capteurs", icon: "📡" },
  { id: "species", label: "Espèces", icon: "📖" },
  { id: "about", label: "À propos", icon: "ℹ️" },
];

export default function App() {
  const [tab, setTab] = useState("home");

  const alertCount = useLiveQuery(
    async () => (await computeAlerts()).length,
    [],
    0,
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌱 JardinConnect</h1>
        {alertCount > 0 && (
          <button className="alert-pip" onClick={() => setTab("home")} title="Voir les alertes">
            {alertCount}
          </button>
        )}
      </header>

      <main className="app-main">
        {tab === "home" && <Home onGo={setTab} />}
        {tab === "assistant" && <AssistantScreen />}
        {tab === "gardens" && <GardensScreen />}
        {tab === "plants" && <PlantsScreen />}
        {tab === "water" && <WaterScreen />}
        {tab === "sensors" && <SensorsScreen />}
        {tab === "species" && <SpeciesScreen />}
        {tab === "about" && <AboutScreen />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
