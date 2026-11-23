import { db, daysSince } from "./db";
import { plantsForNeed, needLabel } from "./permaculture";

export interface GardenTask {
  key: string;
  title: string;
  detail: string;
}

export async function dailyTasks(): Promise<GardenTask[]> {
  const [plantsAll, speciesAll, needsAll] = await Promise.all([
    db.plants.toArray(),
    db.plant_species.toArray(),
    db.harvest_needs.toArray(),
  ]);
  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));
  const month = new Date().getMonth() + 1;
  const tasks: GardenTask[] = [];

  for (const p of plantsAll.filter((p) => p.status === "pousse" || p.status === "mature")) {
    const sp = speciesById.get(p.speciesId);
    if (!sp) continue;
    const name = p.nickname ?? sp.commonName;
    const since = daysSince(p.plantingDate);
    if (since === null) continue;

    if (p.status !== "mature" && since >= 14 && since <= 35) {
      tasks.push({
        key: `weed-${p.id}`,
        title: `Désherber autour de : ${name}`,
        detail: `Installé depuis ${since} jours : désherbez maintenant pour que les jeunes plants ne soient pas étouffés par les mauvaises herbes.`,
      });
    }

    if (sp.cycleDays) {
      const remaining = sp.cycleDays - since;
      if (remaining < 0 && sp.harvestMonths.includes(month)) {
        tasks.push({
          key: `harvest-${p.id}`,
          title: `À récolter : ${name}`,
          detail: `Le cycle (${sp.cycleDays} jours) est terminé : récoltez, idéalement le matin.`,
        });
      } else if (remaining >= 0 && remaining <= 7) {
        tasks.push({
          key: `harvest-soon-${p.id}`,
          title: `Récolte imminente : ${name}`,
          detail: `Environ ${remaining} jour(s) avant la récolte (${sp.cycleDays} jours de cycle). Préparez vos paniers !`,
        });
      }
    }
  }

  for (const need of needsAll) {
    const sp = speciesById.get(need.speciesId);
    if (!sp) continue;
    const count = plantsForNeed(sp, need);
    const installed = plantsAll.filter((p) => p.speciesId === need.speciesId && (p.status === "pousse" || p.status === "mature")).reduce((total, p) => total + p.quantity, 0);
    if (count !== null && installed >= count) continue;
    const undercover = sp.underCoverMonths.includes(month);
    const direct = sp.sowingMonths.includes(month);
    if (!undercover && !direct) continue;
    const how = undercover && !direct
      ? "Semez sous abri maintenant"
      : direct && !undercover
        ? "Semez en pleine terre maintenant"
        : "Semez sous abri ou en pleine terre maintenant";
    tasks.push({
      key: `sow-${need.id}`,
      title: `Période idéale : ${sp.commonName}`,
      detail: `${how} (${needLabel(sp, need)} visés). C'est le bon moment selon le calendrier.`,
    });
  }

  return tasks;
}

export async function tasksDigest(max = 3): Promise<string> {
  const tasks = await dailyTasks();
  return tasks.slice(0, max).map((t) => `• ${t.title}`).join("\n");
}
