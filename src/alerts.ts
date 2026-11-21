import { db, daysSince, addDays, today, type Plant } from "./db";

export interface Alert {
  key: string;
  severity: "info" | "attention" | "urgent";
  title: string;
  detail: string;
}

export async function computeAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const [plantsAll, speciesAll, waterAssets, treatments, weather, zones, sensorsAll, readingsAll] = await Promise.all([
    db.plants.toArray(),
    db.plant_species.toArray(),
    db.water_assets.toArray(),
    db.plant_treatments.toArray(),
    db.weather_records.toArray(),
    db.garden_zones.toArray(),
    db.sensors.toArray(),
    db.sensor_readings.toArray(),
  ]);

  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));
  const zoneById = new Map(zones.map((z) => [z.id!, z]));
  const plants = plantsAll as Plant[];

  for (const plant of plants.filter((p) => p.status === "pousse" || p.status === "mature")) {
    const species = speciesById.get(plant.speciesId);
    if (!species) continue;
    const interval = plant.wateringIntervalDays ?? Math.max(1, Math.round(species.waterNeedMmPerWeek / 4));
    const since = daysSince(plant.lastWateredAt);
    const zone = zoneById.get(plant.zoneId);
    const where = zone ? zone.name : "parcelle inconnue";

    if (since === null) {
      alerts.push({
        key: `water-never-${plant.id}`,
        severity: "attention",
        title: `Premier arrosage non enregistré : ${plant.nickname ?? species.commonName}`,
        detail: `Aucun arrosage enregistré depuis la plantation (${where}).`,
      });
    } else if (since > interval + 2) {
      alerts.push({
        key: `water-late-${plant.id}`,
        severity: "urgent",
        title: `Arrosage en retard : ${plant.nickname ?? species.commonName}`,
        detail: `Dernier arrosage il y a ${since} jours (rythme conseillé : tous les ${interval} jours). Zone : ${where}.`,
      });
    } else if (since > interval - 1) {
      alerts.push({
        key: `water-soon-${plant.id}`,
        severity: "attention",
        title: `Arrosage à prévoir : ${plant.nickname ?? species.commonName}`,
        detail: `À arroser aujourd'hui ou demain (rythme : tous les ${interval} jours). Zone : ${where}.`,
      });
    }
  }

  for (const asset of waterAssets) {
    if (asset.capacityL && asset.currentLevelL !== undefined && asset.capacityL > 0) {
      const pct = Math.round((asset.currentLevelL / asset.capacityL) * 100);
      if (pct <= 10) {
        alerts.push({
          key: `water-level-${asset.id}`,
          severity: "urgent",
          title: `Niveau critique : ${asset.name}`,
          detail: `${pct} % de la capacité reste dans cette réserve.`,
        });
      } else if (pct <= 30) {
        alerts.push({
          key: `water-level-${asset.id}`,
          severity: "attention",
          title: `Niveau bas : ${asset.name}`,
          detail: `${pct} % de la capacité reste dans cette réserve.`,
        });
      }
    }
  }

  for (const t of treatments) {
    if (t.nextDueDate && t.nextDueDate <= today()) {
      const plant = plants.find((p) => p.id === t.plantId);
      const species = plant ? speciesById.get(plant.speciesId) : undefined;
      alerts.push({
        key: `treatment-due-${t.id}`,
        severity: "attention",
        title: `Traitement à renouveler : ${t.product}`,
        detail: `Prévu le ${t.nextDueDate}${species ? ` — plante : ${plant?.nickname ?? species.commonName}` : ""}.`,
      });
    }
  }

  const forecast = weather
    .filter((w) => w.date >= today() && w.date <= addDays(today(), 3))
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const w of forecast) {
    if (w.frost) {
      alerts.push({
        key: `frost-${w.date}`,
        severity: "urgent",
        title: `Gel prévu le ${w.date}`,
        detail: "Protéger ou rentrer les plantes sensibles au gel.",
      });
    }
    if ((w.rainMm ?? 0) >= 15) {
      alerts.push({
        key: `rain-${w.date}`,
        severity: "info",
        title: `Fortes précipitations le ${w.date} (${w.rainMm} mm)`,
        detail: "Reporter les arrosages programmés ce jour-là.",
      });
    }
  }

  for (const sensor of sensorsAll.filter((s) => s.active && s.type === "humidité sol")) {
    if (sensor.lastValue === undefined) continue;
    if (sensor.lastValue < 20) {
      alerts.push({
        key: `sensor-dry-${sensor.id}`,
        severity: "urgent",
        title: `Sol trop sec : ${sensor.name}`,
        detail: `Mesure ${sensor.lastValue} % d'humidité. Vérifier l'arrosage de la zone.`,
      });
    }
  }

  const lastMonth = addDays(today(), -30);
  const rainSum = readingsAll
    .filter((r) => r.unit === "mm" && r.date >= lastMonth)
    .reduce((acc, r) => acc + r.value, 0);
  if (rainSum === 0 && weather.filter((w) => w.date >= lastMonth).reduce((a, w) => a + (w.rainMm ?? 0), 0) === 0) {
    alerts.push({
      key: "no-rain-30d",
      severity: "info",
      title: "Aucune pluie enregistrée depuis 30 jours",
      detail: "Surveillez les réserves d'eau et le paillage.",
    });
  }

  return alerts;
}

export async function syncAlertsToDb(alerts: Alert[]): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction("rw", db.alerts, async () => {
    const existing = await db.alerts.toArray();
    const existingKeys = new Set(existing.map((a) => a.key));
    const incomingKeys = new Set(alerts.map((a) => a.key));
    for (const existingAlert of existing) {
      if (!incomingKeys.has(existingAlert.key)) await db.alerts.delete(existingAlert.id!);
    }
    for (const a of alerts) {
      if (!existingKeys.has(a.key)) {
        await db.alerts.add({ ...a, date: now, dismissed: false });
      }
    }
  });
}
