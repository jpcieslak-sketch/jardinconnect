import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, today } from "../db";
import { computeAlerts, type Alert } from "../alerts";
import { plantsForNeed, surfaceFor, weeklyWaterNeedL, num } from "../permaculture";
import { tipOfTheDay } from "../tips";
import { refreshWeather } from "../weather";
import { dailyTasks, type GardenTask } from "../tasks";
import { Badge, Button, Card, EmptyState, SectionTitle } from "../components/ui";

type ReminderAction = "done" | "useless" | "later";

function addDaysIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function reminderState(): Record<string, { action: ReminderAction; until: string }> {
  try {
    return JSON.parse(localStorage.getItem("jc-reminders") ?? "{}");
  } catch {
    return {};
  }
}

function saveReminderState(state: Record<string, { action: ReminderAction; until: string }>) {
  localStorage.setItem("jc-reminders", JSON.stringify(state));
}

export function Home({ onGo }: { onGo: (tab: string) => void }) {
  const tip = tipOfTheDay();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [weatherState, setWeatherState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [weatherMsg, setWeatherMsg] = useState("");
  const [tasks, setTasks] = useState<GardenTask[] | null>(null);
  const [reminders, setReminders] = useState<Record<string, { action: ReminderAction; until: string }>>(reminderState);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  useEffect(() => {
    const run = async () => setAlerts(await computeAlerts());
    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const run = async () => {
      const list = await dailyTasks();
      setTasks(list);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const last = localStorage.getItem("jc-notified-date");
        if (last !== today() && list.length > 0) {
          try {
            new Notification("JardinConnect — à faire au jardin", {
              body: `💡 ${tip.title}\n${list.slice(0, 3).map((t) => `• ${t.title}`).join("\n")}`,
            });
          } catch {
            /* notification indisponible : la liste reste visible dans l'app */
          }
          localStorage.setItem("jc-notified-date", today());
        }
      }
    };
    run();
  }, []);

  const gardens = useLiveQuery(() => db.gardens.toArray());  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const waters = useLiveQuery(() => db.water_assets.toArray());
  const needs = useLiveQuery(() => db.harvest_needs.toArray());
  const plantsQ = useLiveQuery(() => db.plants.toArray());
  const speciesAll = useLiveQuery(() => db.plant_species.toArray());
  const weatherToday = useLiveQuery(() => db.weather_records.where("date").equals(today()).first());

  const gardensCount = gardens?.length ?? 0;
  const potagerZones = zones?.filter((z) => z.type === "potager" || z.type === "serre") ?? [];
  const terrainSurface = potagerZones.reduce((acc, z) => acc + num(z.surfaceM2), 0);

  const capacityL = (waters ?? []).reduce((acc, w) => acc + num(w.capacityL), 0);
  const levelL = (waters ?? []).reduce((acc, w) => acc + num(w.currentLevelL), 0);
  const waterPct = capacityL > 0 ? Math.round((levelL / capacityL) * 100) : null;

  const speciesById = new Map((speciesAll ?? []).map((s) => [s.id!, s]));
  const needsCount = needs?.length ?? 0;
  const needsSurface = (needs ?? []).reduce((acc, need) => {
    const sp = speciesById.get(need.speciesId);
    if (!sp) return acc;
    const count = plantsForNeed(sp, need);
    return acc + (count !== null ? surfaceFor(sp, count) ?? 0 : 0);
  }, 0);
  const activePlantsList = (plantsQ ?? []).filter((p) => p.status === "pousse" || p.status === "mature");
  const plantedNeedL = weeklyWaterNeedL(activePlantsList, speciesById);
  const remainingNeedL = (needs ?? []).reduce((acc, need) => {
    const sp = speciesById.get(need.speciesId);
    if (!sp) return acc;
    const count = plantsForNeed(sp, need);
    if (count === null) return acc;
    const installed = activePlantsList
      .filter((p) => p.speciesId === need.speciesId)
      .reduce((a, p) => a + p.quantity, 0);
    const remaining = count - installed;
    if (remaining <= 0) return acc;
    return acc + (surfaceFor(sp, remaining) ?? 0) * sp.waterNeedMmPerWeek;
  }, 0);
  const weeklyNeedL = Math.round(plantedNeedL + remainingNeedL);
  const daysCover = weeklyNeedL > 0 && capacityL > 0 ? Math.floor(levelL / (weeklyNeedL / 7)) : null;
  const loading = !gardens || !zones || !waters || !needs || !speciesAll || !plantsQ;

  const doRefresh = async () => {
    setWeatherState("loading");
    setWeatherMsg("");
    const result = await refreshWeather();
    if (result.error) {
      setWeatherState("error");
      setWeatherMsg(result.error);
    } else {
      setWeatherState("ok");
      setWeatherMsg(`7 derniers jours + 7 jours de prévisions enregistrés (record : ${result.updated} jours).`);
    }
  };

  const markWatered = async (plantId: number) => {
    await db.plants.update(plantId, { lastWateredAt: today() });
    setAlerts(await computeAlerts());
  };

  const remember = (key: string, action: ReminderAction, until: string) => {
    const s = { ...reminders, [key]: { action, until } };
    saveReminderState(s);
    setReminders(s);
  };

  const visibleTasks = (tasks ?? []).filter((t) => {
    const r = reminders[t.key];
    return !r || (r.action === "later" && r.until <= today());
  });
  const visibleAlerts = [...(alerts ?? [])]
    .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
    .filter((a) => {
      const r = reminders[a.key];
      return !r || (r.action === "later" && r.until <= today());
    });

  const gardenWithPosition = (gardens ?? []).find((g) => g.latitude !== undefined && g.longitude !== undefined);

  return (
    <div>
      <div className="home-hero"><span className="home-eyebrow">VOTRE ESPACE POTAGER</span><h2>Un jardin qui vous ressemble 🌱</h2><p>Décrivez votre terrain, choisissez vos légumes, puis organisez vos cultures à votre rythme.</p></div>
      <div className="home-steps"><strong>Par où commencer ?</strong><div><span>1</span> Configurez votre terrain</div><div><span>2</span> Choisissez vos objectifs</div><div><span>3</span> Organisez vos plantations</div></div>
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

      <Card>
        <strong>🌼 Météo réelle du jardin</strong>
        <p className="muted">
          Télécharge la météo passée et les prévisions à 7 jours (gratuit, sans compte). Les alertes
          arrosage, gel, orages et cuves s'appuient dessus.
        </p>
        {gardenWithPosition ? (
          <p className="muted">
            Position : {gardenWithPosition.name} (lat {gardenWithPosition.latitude}, lon {gardenWithPosition.longitude})
          </p>
        ) : (
          <p className="muted">
            Pour la météo de votre jardin : onglet Jardins → ouvrez votre jardin → renseignez latitude
            et longitude (astuce : appuyez longuement sur votre jardin dans Google Maps, les coordonnées s'affichent).
          </p>
        )}
        <div className="row-actions">
          <Button onClick={doRefresh} disabled={weatherState === "loading"}>
            {weatherState === "loading" ? "Chargement…" : "Actualiser la météo"}
          </Button>
          {weatherToday && <span className="muted">aujourd'hui enregistré</span>}
        </div>
        {weatherMsg && <p className={weatherState === "error" ? "field-hint" : "muted"}>{weatherMsg}</p>}
      </Card>

      <SectionTitle>💡 Le conseil du jour</SectionTitle>
      <Card>
        <strong>{tip.title}</strong>
        <p className="muted">{tip.text}</p>
        <p className="field-hint">Source : {tip.source}</p>
      </Card>

      <Card>
        <strong>💧 Besoin en eau vs vos réserves</strong>
        {weeklyNeedL < 1 ? (
          <p className="muted">
            Aucun besoin d'eau calculé pour l'instant : cochez vos récoltes dans « Mes objectifs », puis installez
            des plantes dans vos parcelles. L'appli calculera alors leur besoin en eau à la semaine.
          </p>
        ) : (
          <>
            <p className="muted">
              Vos plantations (et les objectifs pas encore installés) demandent environ
              <strong>{weeklyNeedL} litres par semaine</strong>.
              {capacityL > 0
                ? ` Vos réserves stockent ${capacityL} L, dont ${levelL} L disponibles : environ ${daysCover ?? 0} jour${(daysCover ?? 0) > 1 ? "s" : ""} d'autonomie sans pluie ni arrosage.`
                : " Vous n'avez aucune réserve déclarée : pensez à la récupération d'eau de pluie."}
            </p>
            {daysCover !== null && daysCover <= 7 && (
              <p className="field-hint">
                ⚠️ Peu d'autonomie en eau : remplissez vos cuves en cas de pluie et paillez généreusement pour
                réduire l'évaporation.
              </p>
            )}
          </>
        )}
      </Card>

      
      <SectionTitle>✅ À faire au jardin</SectionTitle>
      {tasks === null || alerts === null ? (
        <EmptyState text="Chargement…" />
      ) : visibleTasks.length === 0 && visibleAlerts.length === 0 ? (
        <EmptyState text="Rien de spécial aujourd'hui 🌱 Tout va bien." />
      ) : (
        <div className="list">
          {visibleTasks.map((t) => (
            <Card key={t.key}>
              <strong>{t.title}</strong>
              <p className="muted">{t.detail}</p>
              <div className="row-actions">
                <Button variant="small" onClick={() => remember(t.key, "done", today())}>
                  ✓ Fait
                </Button>
                <Button variant="small" onClick={() => remember(t.key, "useless", "")}>
                  ✕ Inutile
                </Button>
                <Button variant="small" onClick={() => remember(t.key, "later", addDaysIso(1))}>
                  ⏰ Dans 1 jour
                </Button>
                <Button variant="small" onClick={() => remember(t.key, "later", addDaysIso(7))}>
                  📅 Dans 1 semaine
                </Button>
              </div>
            </Card>
          ))}
          {visibleAlerts.map((a) => {
            const pid = waterPlantIdOf(a.key);
            return (
              <Card key={a.key}>
                <div className="alert-row">
                  <div>
                    <strong>{a.title}</strong>
                    <p className="muted">{a.detail}</p>
                  </div>
                  <Badge severity={a.severity} />
                </div>
                <div className="row-actions">
                  {pid !== null && (
                    <Button variant="small" onClick={() => void markWatered(pid)}>
                      💧 J'ai arrosé
                    </Button>
                  )}
                  <Button variant="small" onClick={() => remember(a.key, "done", today())}>
                    ✓ Fait
                  </Button>
                  <Button variant="small" onClick={() => remember(a.key, "useless", "")}>
                    ✕ Inutile
                  </Button>
                  <Button variant="small" onClick={() => remember(a.key, "later", addDaysIso(1))}>
                    ⏰ Dans 1 jour
                  </Button>
                  <Button variant="small" onClick={() => remember(a.key, "later", addDaysIso(7))}>
                    📅 Dans 1 semaine
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
{typeof Notification !== "undefined" && Notification.permission === "default" && (
        <div className="row-actions" style={{ marginBottom: 12 }}>
          <Button
            variant="ghost"
            onClick={async () => {
              const perm = await Notification.requestPermission();
              setNotifPerm(perm);
            }}
          >
            🔔 Me prévenir chaque jour
          </Button>
        </div>
      )}
      {notifPerm === "granted" && (
        <p className="muted" style={{ marginBottom: 12 }}>
          🔔 Notifications activées : vous serez prévenu une fois par jour des principales tâches.
        </p>
      )}

      <SectionTitle>Raccourcis</SectionTitle>
      <div className="stats">
        <Card className="stat link" onClick={() => onGo("plants")}><span>🌿</span><span>Plantes</span></Card>
        <Card className="stat link" onClick={() => onGo("gardens")}><span>🌍</span><span>Jardins</span></Card>
        <Card className="stat link" onClick={() => onGo("species")}><span>📖</span><span>Espèces</span></Card>
        <Card className="stat link" onClick={() => onGo("about")}><span>ℹ️</span><span>À propos</span></Card>
      </div>
    </div>
  );
}

function sevRank(s: Alert["severity"]): number {
  return s === "urgent" ? 3 : s === "attention" ? 2 : 1;
}

function waterPlantIdOf(key: string): number | null {
  const m = key.match(/^water-(?:never|late|soon)-(\d+)$/);
  return m ? Number(m[1]) : null;
}
