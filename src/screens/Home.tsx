import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, today } from "../db";
import { computeAlerts, type Alert } from "../alerts";
import { Badge, Card, EmptyState, SectionTitle } from "../components/ui";

export function Home({ onGo }: { onGo: (tab: string) => void }) {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    const run = async () => setAlerts(await computeAlerts());
    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, []);

  const gardens = useLiveQuery(() => db.gardens.count()) ?? 0;
  const plants = useLiveQuery(() => db.plants.count()) ?? 0;
  const zones = useLiveQuery(() => db.garden_zones.count()) ?? 0;
  const sensors = useLiveQuery(() => db.sensors.count()) ?? 0;
  const weatherToday = useLiveQuery(() => db.weather_records.where("date").equals(today()).first());

  return (
    <div>
      <SectionTitle>Bonjour 🌱</SectionTitle>
      <div className="stats">
        <Card className="stat"><strong>{gardens}</strong><span>jardin(s)</span></Card>
        <Card className="stat"><strong>{zones}</strong><span>parcelles</span></Card>
        <Card className="stat"><strong>{plants}</strong><span>plantations</span></Card>
        <Card className="stat"><strong>{sensors}</strong><span>capteurs</span></Card>
      </div>

      {weatherToday && (
        <Card>
          <strong>Météo du jour</strong>
          <p className="muted">
            {weatherToday.tempMinC !== undefined && `${weatherToday.tempMinC} °C – `}
            {weatherToday.tempMaxC !== undefined && `${weatherToday.tempMaxC} °C · `}
            {weatherToday.rainMm} mm de pluie {weatherToday.frost ? "· ⚠️ gel" : ""}
          </p>
        </Card>
      )}

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
        <Card className="stat link" onClick={() => onGo("assistant")}><span>🌱</span><span>Assistant</span></Card>
        <Card className="stat link" onClick={() => onGo("plants")}><span>🌿</span><span>Plantes</span></Card>
        <Card className="stat link" onClick={() => onGo("water")}><span>💧</span><span>Eau</span></Card>
        <Card className="stat link" onClick={() => onGo("sensors")}><span>📡</span><span>Capteurs</span></Card>
        <Card className="stat link" onClick={() => onGo("species")}><span>📖</span><span>Espèces</span></Card>
      </div>
    </div>
  );
}

function sevRank(s: Alert["severity"]): number {
  return s === "urgent" ? 3 : s === "attention" ? 2 : 1;
}
