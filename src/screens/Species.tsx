import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, FRENCH_MONTHS, type PlantSpecies } from "../db";
import { Card, EmptyState, SectionTitle } from "../components/ui";

const CATEGORY_ICONS: Record<PlantSpecies["category"], string> = {
  légume: "🥕",
  aromate: "🌿",
  fruit: "🍎",
  fleur: "🌸",
  arbuste: "🌳",
};

export function SpeciesScreen() {
  const species = useLiveQuery(() => db.plant_species.toArray());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  const filtered = useMemo(() => {
    return (species ?? []).filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.commonName.toLowerCase().includes(q) || s.latinName.toLowerCase().includes(q);
      const matchCat = !category || s.category === category;
      const matchMonth = !month || s.sowingMonths.includes(Number(month));
      return matchSearch && matchCat && matchMonth;
    });
  }, [species, search, category, month]);

  return (
    <div>
      <SectionTitle>📖 Référentiel botanique</SectionTitle>
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
            {Object.keys(CATEGORY_ICONS).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Semis : tout l'année</option>
            {FRENCH_MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
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
                  <span className="muted latin">{s.latinName}</span>
                </summary>
                <div className="species-detail">
                  <p className="muted">
                    ☀️ {s.sun} · 💧 environ {s.waterNeedMmPerWeek} mm/semaine
                    {s.frostSensitive ? " · ❄️ sensible au gel" : " · résiste au gel"}
                  </p>
                  <p>
                    <span className="chip-label">Semis :</span>
                    {s.sowingMonths.map((m) => <span key={m} className="chip">{FRENCH_MONTHS[m - 1]}</span>)}
                  </p>
                  <p>
                    <span className="chip-label">Récolte :</span>
                    {s.harvestMonths.map((m) => <span key={m} className="chip chip-green">{FRENCH_MONTHS[m - 1]}</span>)}
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
