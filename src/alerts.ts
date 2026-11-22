import { db, daysSince, addDays, today, type Plant } from "./db";
import { rainForecastDays, rainLastDays } from "./weather";
import { plantsForNeed, surfaceFor, conflictsInParcel, rotationProblems, weeklyWaterNeedL } from "./permaculture";

export interface Alert {
  key: string;
  severity: "info" | "attention" | "urgent";
  title: string;
  detail: string;
}

export async function computeAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const [plantsAll, speciesAll, waterAssets, treatments, weather, zones, needsAll] = await Promise.all([
    db.plants.toArray(),
    db.plant_species.toArray(),
    db.water_assets.toArray(),
    db.plant_treatments.toArray(),
    db.weather_records.toArray(),
    db.garden_zones.toArray(),
    db.harvest_needs.toArray(),
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
    const where = zone
      ? (zone.type === "serre" ? `${zone.name} (sous serre : la pluie n'y entre pas)` : zone.name)
      : "parcelle inconnue";

    const sincePlanting = daysSince(plant.plantingDate);
    if (since === null) {
      if (sincePlanting !== null && sincePlanting < 2) continue;
      alerts.push({
        key: `water-never-${plant.id}`,
        severity: "attention",
        title: `Premier arrosage à faire : ${plant.nickname ?? species.commonName}`,
        detail: `Installé(e) il y a ${sincePlanting ?? "?"} jour(s) et jamais arrosé(e) (${where}). Arrosez au pied, en profondeur, puis appuyez sur le bouton « J'ai arrosé » ci-dessous.`,
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
      if (pct <= 30 && weather.length > 0 && rainForecastDays(weather, 7) < 5) {
        alerts.push({
          key: `tank-dry-spell-${asset.id}`,
          severity: "urgent",
          title: `Cuve basse sans pluie prévue : ${asset.name}`,
          detail: `${pct} % de la capacité reste, et aucune pluie significative n'est prévue dans les 7 prochains jours. Économisez l'eau et maintenez le paillage.`,
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
        key: `storm-${w.date}`,
        severity: "attention",
        title: `Orage ou fortes pluies prévues le ${w.date} (${w.rainMm} mm)`,
        detail: "Sécurisez les cuves de récupération (couvercles fermés, contre-poids) et reportez vos arrosages ce jour-là.",
      });
    }
  }

  const activePlants = plants.filter((p) => p.status === "pousse" || p.status === "mature");
  const rainSumLast7 =
    weather.length > 0
      ? rainLastDays(weather, 7)
      : 0;
  if (activePlants.length > 0 && weather.length > 0 && rainSumLast7 < 1) {
    alerts.push({
      key: "no-rain-7d",
      severity: "attention",
      title: "Pas de pluie depuis 7 jours",
      detail: "Pensez à arroser : vérifiez le paillage et arrosez en profondeur, au pied des plantes, de préférence le soir.",
    });
  }

  const serreIds = new Set(zones.filter((z) => z.type === "serre").map((z) => z.id!));
  const serreActive = activePlants.filter((p) => serreIds.has(p.zoneId));
  if (serreActive.length > 0) {
    const dueSerre = serreActive.filter((p) => {
      const sp = speciesById.get(p.speciesId);
      if (!sp) return false;
      const interval = p.wateringIntervalDays ?? Math.max(1, Math.round(sp.waterNeedMmPerWeek / 4));
      const s = daysSince(p.lastWateredAt);
      const sp2 = daysSince(p.plantingDate);
      return s === null ? (sp2 !== null && sp2 >= 2) : s > interval - 1;
    });
    if (dueSerre.length > 0) {
      alerts.push({
        key: "serre-arrosage-due",
        severity: "attention",
        title: "Serre : arrosage à prévoir, même s'il pleut",
        detail: "Sous serre, la pluie n'entre pas : vos plantes n'attendent que votre arrosage (au pied, de préférence le matin).",
      });
    } else {
      alerts.push({
        key: "serre-rain-not-counted",
        severity: "info",
        title: "Serre : la pluie n'y entre pas",
        detail: "Vos plantes sous serre ne boivent que l'eau que vous leur donnez : leurs temps d'arrosage ne profitent jamais de la pluie.",
      });
    }
  }

  const activeByZone = new Map<number, Plant[]>();
  for (const p of activePlants) {
    if (!activeByZone.has(p.zoneId)) activeByZone.set(p.zoneId, []);
    activeByZone.get(p.zoneId)!.push(p);
  }
  for (const [zoneId, zonePlants] of activeByZone) {
    const zoneSpecies = zonePlants
      .map((p) => speciesById.get(p.speciesId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const conflicts = conflictsInParcel(zoneSpecies, []);
    if (conflicts.length > 0) {
      const zone = zoneById.get(zoneId);
      alerts.push({
        key: `compat-zone-${zoneId}`,
        severity: "attention",
        title: `Compatibilité à revoir dans « ${zone?.name ?? "parcelle"} »`,
        detail: `${conflicts.join(", ")} : ces plantes se gênent (maladies communes, exsudats toxiques). Déplacez-les dans des parcelles séparées ou espacez-les au maximum.`,
      });
    }
  }

  const year = new Date().getFullYear();
  for (const zone of zones) {
    if (!zone.id) continue;
    const thisYearSpecies = plants
      .filter((p) => p.zoneId === zone.id && p.plantingDate.startsWith(String(year)))
      .map((p) => speciesById.get(p.speciesId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const rot = rotationProblems(zone.id, thisYearSpecies, plants, speciesById, year);
    if (rot.length > 0) {
      alerts.push({
        key: `rotation-zone-${zone.id}`,
        severity: "attention",
        title: `Rotation à respecter dans « ${zone.name} »`,
        detail: `Famille(s) déjà cultivée(s) ici l'an dernier : ${rot.join(", ")}. En permaculture, on ne replante pas la même famille deux années de suite : changez ces plantes de parcelle et variez les familles d'une année sur l'autre.`,
      });
    }
  }

  const totalCapacity = waterAssets.reduce((acc, w) => acc + (w.capacityL ?? 0), 0);
  const totalLevel = waterAssets.reduce((acc, w) => acc + (w.currentLevelL ?? 0), 0);
  const waterNeed = weeklyWaterNeedL(plants, speciesById);
  if (totalCapacity > 0 && waterNeed >= 5) {
    if (totalLevel < waterNeed) {
      alerts.push({
        key: "water-reserves-low",
        severity: "urgent",
        title: "Réserves d'eau insuffisantes",
        detail: `Vos plantations demandent environ ${Math.round(waterNeed)} L par semaine, mais vos réserves ne contiennent que ${Math.round(totalLevel)} L : à peine ${Math.max(0, Math.floor(totalLevel / (waterNeed / 7)))} jour(s) d'arrosage. Récupérez de l'eau de pluie et paillez pour économiser.`,
      });
    } else if (totalLevel < waterNeed * 2) {
      alerts.push({
        key: "water-reserves-low",
        severity: "attention",
        title: "Réserves d'eau à surveiller",
        detail: `Vos plantations demandent environ ${Math.round(waterNeed)} L par semaine ; vos réserves couvrent environ ${Math.floor(totalLevel / (waterNeed / 7))} jour(s). Mettez le niveau à jour dans l'onglet Eau et paillez.`,
      });
    }
  }

  let needsSurface = 0;
  for (const need of needsAll) {
    const sp = speciesById.get(need.speciesId);
    if (!sp) continue;
    const count = plantsForNeed(sp, need);
    const area = count !== null ? surfaceFor(sp, count) : null;
    if (area !== null) needsSurface += area;
  }
  const potagerSurface = zones
    .filter((z) => z.type === "potager" || z.type === "serre")
    .reduce((acc, z) => acc + (z.surfaceM2 ?? 0), 0);
  if (potagerSurface > 0 && needsSurface > potagerSurface) {
    alerts.push({
      key: "surface-exceeded",
      severity: "attention",
      title: "Vos besoins dépassent la surface déclarée",
      detail: `Vos objectifs de récolte coûtent ~${Math.round(needsSurface)} m² alors que vos parcelles font ${Math.round(potagerSurface)} m². Réduisez certains besoins, agrandissez une parcelle ou installez en contenants.`,
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
