import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, FRENCH_MONTHS, type PlantSpecies } from "../db";
import { Card, EmptyState, SectionTitle } from "../components/ui";
import { isPotagerSpecies } from "./Assistant";

const CATEGORY_ICONS: Record<PlantSpecies["category"], string> = {
  légume: "🥕",
  aromate: "🌿",
  fruit: "🍎",
  fleur: "🌸",
  "engrais vert": "🌱",
  arbuste: "🌳",
};

function monthsLabel(months: number[]): string {
  return months.length === 0 ? "—" : months.map((m) => FRENCH_MONTHS[m - 1]).join(", ");
}

export function SpeciesScreen() {
  const species = useLiveQuery(() => db.plant_species.toArray());
  const gardens = useLiveQuery(() => db.gardens.toArray());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  const climat = (gardens ?? []).find(
    (g) => g.climateType !== undefined || g.winterTempMinC !== undefined ||
      g.summerTempMaxC !== undefined || g.avgRainMmPerYear !== undefined,
  );
  const climatFroid = Boolean(
    climat && (climat.climateType === "montagne" ||
      (climat.winterTempMinC !== undefined && climat.winterTempMinC <= -5)),
  );
  const climatChaudSec = Boolean(
    climat && (climat.climateType === "méditerranéen" ||
      (climat.summerTempMaxC !== undefined && climat.summerTempMaxC >= 35) ||
      (climat.avgRainMmPerYear !== undefined && climat.avgRainMmPerYear < 600)),
  );

  const filtered = useMemo(() => {
    return (species ?? []).filter((s) => {
      if (!isPotagerSpecies(s) && s.category !== "fleur" && s.category !== "engrais vert") return false;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.commonName.toLowerCase().includes(q) ||
        s.latinName.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q);
      const matchCat = !category || s.category === category;
      const matchMonth =
        !month ||
        s.sowingMonths.includes(Number(month)) ||
        s.underCoverMonths.includes(Number(month));
      return matchSearch && matchCat && matchMonth;
    });
  }, [species, search, category, month]);

  return (
    <div>
      <SectionTitle>📖 Référentiel botanique ({(species ?? []).filter((s) => isPotagerSpecies(s) || s.category === "fleur" || s.category === "engrais vert").length} espèces)</SectionTitle>
      <Card>
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher… (ex. tomate)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes catégories</option>
            {Object.keys(CATEGORY_ICONS).filter((c) => c !== "arbuste").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Semis : toute l'année</option>
            {FRENCH_MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <p className="muted chip-label">🌱 Engrais verts : semez-les sur les parcelles vides pour enrichir le sol (rotation, jachère). Ils sont intégrés au planning de l'onglet Objectifs.</p>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState text="Aucune espèce ne correspond." />
      ) : (
        <div className="list">
          {filtered.map((s) => (
            <Card key={s.id}>
              <details>
                <summary>
                  <span>{CATEGORY_ICONS[s.category]} <strong>{s.commonName}</strong></span>
                  <span className="muted latin">{s.latinName} · {s.family}</span>
                </summary>
                <div className="species-detail">
                  {s.category === "engrais vert" && (
                    <p>
                      <span className="chip-label">Période d'établissement :</span>
                      {s.sowingMonths.some((m) => m >= 2 && m <= 6) && (
                        <span className="chip chip-green" style={{ margin: "0 4px" }}>🌱 Printemps</span>
                      )}
                      {s.sowingMonths.some((m) => m >= 8 && m <= 10) && (
                        <span className="chip chip-orange">🍂 Automne</span>
                      )}
                    </p>
                  )}
                  {climatFroid && s.frostSensitive && (
                    <p><span className="chip chip-red">❄️ À protéger l'hiver dans votre climat</span></p>
                  )}
                  {climatChaudSec && s.waterNeedMmPerWeek >= 25 && (
                    <p><span className="chip chip-orange">💧 Gourmande en eau : à déconseiller en été sec (paillage + ombre)</span></p>
                  )}
                  <p className="muted">
                    ☀️ {s.sun} · 💧 environ {s.waterNeedMmPerWeek} mm/semaine
                    {s.spacingCm ? ` · ≈ ${s.spacingCm} cm entre pieds` : ""}
                    {s.yieldPerPlantKg ? ` · 🧺 ≈ ${s.yieldPerPlantKg} kg par pied` : ""}
                    {s.frostSensitive ? " · ❄️ sensible au gel" : " · résiste au gel"}
                  </p>
                  <p>
                    <span className="chip-label">Semis sous abri :</span>
                    {s.underCoverMonths.length === 0
                      ? <span className="muted"> non nécessaire</span>
                      : s.underCoverMonths.map((m) => <span key={m} className="chip chip-blue">{FRENCH_MONTHS[m - 1]}</span>)}
                  </p>
                  <p>
                    <span className="chip-label">Semis en pleine terre :</span>
                    {s.sowingMonths.length === 0
                      ? <span className="muted"> par repiquage uniquement</span>
                      : s.sowingMonths.map((m) => <span key={m} className="chip">{FRENCH_MONTHS[m - 1]}</span>)}
                  </p>
                  {s.transplantMonths.length > 0 && (
                    <p>
                      <span className="chip-label">Repiquage :</span>
                      {s.transplantMonths.map((m) => <span key={m} className="chip chip-orange">{FRENCH_MONTHS[m - 1]}</span>)}
                    </p>
                  )}
                  <p>
                    <span className="chip-label">Récolte :</span>
                    <span className="muted"> {monthsLabel(s.harvestMonths)}</span>
                  </p>
                  {s.companionGood.length > 0 && (
                    <p><span className="chip-label">♥ S'associe bien avec :</span> <span className="muted">{s.companionGood.join(", ")}</span></p>
                  )}
                  {s.companionBad.length > 0 && (
                    <p><span className="chip-label">⚠ Éviter à côté de :</span> <span className="muted">{s.companionBad.join(", ")}</span></p>
                  )}
                  <p>💡 {s.careAdvice}</p>
                </div>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
