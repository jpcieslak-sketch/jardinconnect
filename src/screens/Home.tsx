import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, today } from "../db";
import { computeAlerts, type Alert } from "../alerts";
import { plantsForNeed, surfaceFor } from "../permaculture";
import { Badge, Card, EmptyState, SectionTitle } from "../components/ui";

export function Home({ onGo }: { onGo: (tab: string) => void }) {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    const run = async () => setAlerts(await computeAlerts());
    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, []);

  const gardens = useLiveQuery(() => db.gardens.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const waters = useLiveQuery(() => db.water_assets.toArray());
  const needs = useLiveQuery(() => db.harvest_needs.toArray());
  const speciesAll = useLiveQuery(() => db.plant_species.toArray());
  const weatherToday = useLiveQuery(() => db.weather_records.where("date").equals(today()).first());

  const gardensCount = gardens?.length ?? 0;
  const potagerZones = zones?.filter((z) => z.type === "potager" || z.type === "serre") ?? [];
  const terrainSurface = potagerZones.reduce((acc, z) => acc + (z.surfaceM2 ?? 0), 0);

  const capacityL = (waters ?? []).reduce((acc, w) => acc + (w.capacityL ?? 0), 0);
  const levelL = (waters ?? []).reduce((acc, w) => acc + (w.currentLevelL ?? 0), 0);
  const waterPct = capacityL > 0 ? Math.round((levelL / capacityL) * 100) : null;

  const speciesById = new Map((speciesAll ?? []).map((s) => [s.id!, s]));
  const needsCount = needs?.length ?? 0;
  const needsSurface = (needs ?? []).reduce((acc, need) => {
    const sp = speciesById.get(need.speciesId);
    if (!sp) return acc;
    const count = plantsForNeed(sp, need);
    return acc + (count !== null ? surfaceFor(sp, count) ?? 0 : 0);
  }, 0);
  const loading = !gardens || !zones || !waters || !needs || !speciesAll;

  return (
    <div>
      <SectionTitle>Votre jardin en un coup d'œil</SectionTitle>

      <div className="list">
        <Card>
          <button className="list-row-btn" onClick={() => onGo("gardens")}>
            <span className="hb-icon">🏡</span>
            <div className="list-text">
              <strong>Mon terrain</strong>
              <span className="muted">
                {loading
                  ? "…"
                  : `${gardensCount} jardin${gardensCount > 1 ? "s" : ""} · ${potagerZones.length} parcelle${potagerZones.length !== 1 ? "s" : ""}${terrainSurface > 0 ? ` · ${Math.round(terrainSurface)} m²` : " · surface à renseigner"}`}
                {!loading && weatherToday && weatherToday.tempMaxC !== undefined
                  ? ` · aujourd'hui ${weatherToday.tempMinC !== undefined ? `${weatherToday.tempMinC}–` : ""}${weatherToday.tempMaxC} °C, ${weatherToday.rainMm} mm`
                  : ""}
              </span>
            </div>
            <span className="chev">›</span>
          </button>
        </Card>

        <Card>
          <button className="list-row-btn" onClick={() => onGo("water")}>
            <span className="hb-icon">💧</span>
            <div className="list-text">
              <strong>Mon eau</strong>
              <span className="muted">
                {loading
                  ? "…"
                  : waters.length === 0
                    ? "Aucune réserve : ajoutez cuves et récupérateurs"
                    : `${waters.length} réserve${waters.length > 1 ? "s" : ""} · ${capacityL} L stockés${waterPct !== null ? ` · ${waterPct} % restants` : ""}`}
              </span>
            </div>
            <span className="chev">›</span>
          </button>
        </Card>

        <Card>
          <button className="list-row-btn" onClick={() => onGo("assistant")}>
            <span className="hb-icon">🎯</span>
            <div className="list-text">
              <strong>Mes objectifs</strong>
              <span className="muted">
                {loading
                  ? "…"
                  : needsCount === 0
                    ? "Cochez les récoltes que vous voulez faire"
                    : `${needsCount} récolte${needsCount > 1 ? "s" : ""} cochée${needsCount > 1 ? "s" : ""} · ~${Math.round(needsSurface)} m² nécessaires${terrainSurface > 0 ? ` / ${Math.round(terrainSurface)} m² disponibles` : ""}`}
              </span>
            </div>
            <span className="chev">›</span>
          </button>
        </Card>
      </div>

      <SectionTitle>Alertes du moment</SectionTitle>
      {alerts === null ? (
        <EmptyState text="Chargement…" />
      ) : alerts.length === 0 ? (
        <EmptyState text="Aucune alerte, tout va bien ✨" />
      ) : (
        <div className="list">
          {[...alerts]
            .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
            .map((a) => (
              <Card key={a.key}>
                <div className="alert-row">
                  <div>
                    <strong>{a.title}</strong>
                    <p className="muted">{a.detail}</p>
                  </div>
                  <Badge severity={a.severity} />
                </div>
              </Card>
            ))}
        </div>
      )}

      <SectionTitle>Raccourcis</SectionTitle>
      <div className="stats">
        <Card className="stat link" onClick={() => onGo("plants")}><span>🌿</span><span>Plantes</span></Card>
        <Card className="stat link" onClick={() => onGo("sensors")}><span>📡</span><span>Capteurs</span></Card>
        <Card className="stat link" onClick={() => onGo("species")}><span>📖</span><span>Espèces</span></Card>
        <Card className="stat link" onClick={() => onGo("about")}><span>ℹ️</span><span>À propos</span></Card>
      </div>
    </div>
  );
}

function sevRank(s: Alert["severity"]): number {
  return s === "urgent" ? 3 : s === "attention" ? 2 : 1;
}
