import { db, type PlantSpecies } from "./db";

export const SEED_SPECIES: PlantSpecies[] = [
  {
    commonName: "Tomate", latinName: "Solanum lycopersicum", category: "légume",
    waterNeedMmPerWeek: 25, sowingMonths: [2, 3, 4], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Basilic", "Œillet d'Inde", "Carotte"], companionBad: ["Pomme de terre", "Chou"],
    frostSensitive: true, cycleDays: 100,
    careAdvice: "Arroser au pied sans mouiller le feuillage pour éviter le mildiou. Tailler les gourmands et tuteurer dès la plantation.",
  },
  {
    commonName: "Courgette", latinName: "Cucurbita pepo", category: "légume",
    waterNeedMmPerWeek: 30, sowingMonths: [4, 5], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Haricot", "œillet d'Inde"], companionBad: ["Concombre"],
    frostSensitive: true, cycleDays: 60,
    careAdvice: "Grosse consommatrice d'eau : pailler largement. Récolter jeune pour relancer la production.",
  },
  {
    commonName: "Carotte", latinName: "Daucus carota", category: "légume",
    waterNeedMmPerWeek: 20, sowingMonths: [3, 4, 5, 6], harvestMonths: [6, 7, 8, 9, 10, 11],
    sun: "plein soleil", companionGood: ["Poireau", "Tomate", "Oignon"], companionBad: ["Persil"],
    frostSensitive: false, cycleDays: 90,
    careAdvice: "Sol meuble et sans cailloux. Éclaircir à 3 cm pour donner de la place aux racines.",
  },
  {
    commonName: "Poireau", latinName: "Allium porrum", category: "légume",
    waterNeedMmPerWeek: 20, sowingMonths: [3, 4, 5], harvestMonths: [8, 9, 10, 11, 12],
    sun: "plein soleil", companionGood: ["Carotte", "Céleri"], companionBad: ["Haricot"],
    frostSensitive: false, cycleDays: 130,
    careAdvice: "Butter les plants pour blanchir le fût. Surveiller la teigne du poireau en été.",
  },
  {
    commonName: "Laitue", latinName: "Lactuca sativa", category: "légume",
    waterNeedMmPerWeek: 20, sowingMonths: [2, 3, 4, 5, 6, 8, 9], harvestMonths: [4, 5, 6, 7, 8, 9, 10],
    sun: "mi-ombre", companionGood: ["Radis", "Concombre", "Fraise"], companionBad: ["Persil"],
    frostSensitive: false, cycleDays: 60,
    careAdvice: "Arrosages réguliers et légers pour éviter la montaison. Planter en décalé pour étaler les récoltes.",
  },
  {
    commonName: "Haricot vert", latinName: "Phaseolus vulgaris", category: "légume",
    waterNeedMmPerWeek: 25, sowingMonths: [4, 5, 6, 7], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Courgette", "Pomme de terre", "Sarriette"], companionBad: ["Ail", "Oignon"],
    frostSensitive: true, cycleDays: 60,
    careAdvice: "Fixe l'azote : bon précédent cultural. Récolter tous les 2-3 jours pour maintenir la production.",
  },
  {
    commonName: "Pomme de terre", latinName: "Solanum tuberosum", category: "légume",
    waterNeedMmPerWeek: 25, sowingMonths: [3, 4], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Haricot vert", "Chou"], companionBad: ["Tomate", "Courgette"],
    frostSensitive: true, cycleDays: 100,
    careAdvice: "Butter lorsque les tiges atteignent 20 cm. Freiner l'arrosage en fin de cycle pour la conservation.",
  },
  {
    commonName: "Radis", latinName: "Raphanus sativus", category: "légume",
    waterNeedMmPerWeek: 20, sowingMonths: [3, 4, 5, 6, 8, 9], harvestMonths: [4, 5, 6, 7, 9, 10],
    sun: "plein soleil", companionGood: ["Laitue", "Carotte"], companionBad: ["Concombre"],
    frostSensitive: false, cycleDays: 30,
    careAdvice: "Arroser régulièrement : un manque d'eau rend le goût piquant. Semer tous les 15 jours.",
  },
  {
    commonName: "Concombre", latinName: "Cucumis sativus", category: "légume",
    waterNeedMmPerWeek: 30, sowingMonths: [4, 5], harvestMonths: [7, 8, 9],
    sun: "plein soleil", companionGood: ["Laitue", "Aneth"], companionBad: ["Courgette", "Tomate"],
    frostSensitive: true, cycleDays: 70,
    careAdvice: "Très gourmand en eau et en richesse. Palisser sur treillis pour gagner de la place.",
  },
  {
    commonName: "Épinard", latinName: "Spinacia oleracea", category: "légume",
    waterNeedMmPerWeek: 20, sowingMonths: [2, 3, 8, 9, 10], harvestMonths: [4, 5, 10, 11, 12],
    sun: "mi-ombre", companionGood: ["Fraise", "Chou"], companionBad: ["Betterave"],
    frostSensitive: false, cycleDays: 50,
    careAdvice: "Aime la fraîcheur : semer en fin d'été pour l'automne-hiver. Couper les feuilles plutôt que la plante entière.",
  },
  {
    commonName: "Basilic", latinName: "Ocimum basilicum", category: "aromate",
    waterNeedMmPerWeek: 15, sowingMonths: [3, 4], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Tomate", "Poivron"], companionBad: ["Sauge"],
    frostSensitive: true, cycleDays: 70,
    careAdvice: "Pincer les sommets pour ramifier. Protéger du froid : il stoppe sous 10 °C.",
  },
  {
    commonName: "Thym", latinName: "Thymus vulgaris", category: "aromate",
    waterNeedMmPerWeek: 5, sowingMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8, 9, 10],
    sun: "plein soleil", companionGood: ["Romarin", "Lavande"], companionBad: [],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Presque aucun arrosage une fois installé. Rabattre légèrement chaque printemps pour garder la plante compacte.",
  },
  {
    commonName: "Persil", latinName: "Petroselinum crispum", category: "aromate",
    waterNeedMmPerWeek: 15, sowingMonths: [3, 4, 5, 8, 9], harvestMonths: [5, 6, 7, 8, 9, 10, 11],
    sun: "mi-ombre", companionGood: ["Tomate", "Asperge"], companionBad: ["Carotte", "Laitue"],
    frostSensitive: false, cycleDays: 90,
    careAdvice: "Germination lente (2-3 semaines) : tremper les graines 24 h avant le semis.",
  },
  {
    commonName: "Menthe", latinName: "Mentha spicata", category: "aromate",
    waterNeedMmPerWeek: 20, sowingMonths: [4, 5, 6], harvestMonths: [5, 6, 7, 8, 9, 10],
    sun: "mi-ombre", companionGood: ["Chou", "Tomate"], companionBad: ["Parsley"],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Très envahissante : la planter en pot enterré pour limiter sa propagation.",
  },
  {
    commonName: "Fraise", latinName: "Fragaria × ananassa", category: "fruit",
    waterNeedMmPerWeek: 20, sowingMonths: [3, 4, 8, 9], harvestMonths: [5, 6, 7],
    sun: "plein soleil", companionGood: ["Laitue", "Épinard", "Ail"], companionBad: ["Chou", "Brocoli"],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Pailler pour garder le fruit propre et limiter le botrytis. Renouveler les plants tous les 3 ans.",
  },
  {
    commonName: "Pommier", latinName: "Malus domestica", category: "fruit",
    waterNeedMmPerWeek: 25, sowingMonths: [11, 12, 1, 2], harvestMonths: [8, 9, 10],
    sun: "plein soleil", companionGood: ["Nasturtium"], companionBad: ["Noyer"],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Tailler en hiver pour aérer le centre. Éclaircir les fruits en juin pour de plus grosses pommes.",
  },
  {
    commonName: "Nasturtium", latinName: "Tropaeolum majus", category: "fleur",
    waterNeedMmPerWeek: 10, sowingMonths: [4, 5], harvestMonths: [6, 7, 8, 9],
    sun: "plein soleil", companionGood: ["Tomate", "Courgette"], companionBad: [],
    frostSensitive: true, cycleDays: 60,
    careAdvice: "Dévore les pucerons et attire les pollinisateurs. Fleurs et jeunes feuilles comestibles.",
  },
  {
    commonName: "Œillet d'Inde", latinName: "Tagetes patula", category: "fleur",
    waterNeedMmPerWeek: 10, sowingMonths: [4, 5], harvestMonths: [6, 7, 8, 9, 10],
    sun: "plein soleil", companionGood: ["Tomate", "Courgette"], companionBad: [],
    frostSensitive: true, cycleDays: 60,
    careAdvice: "Repousse les nématodes au potager. Supprimer les fleurs fanées pour prolonger la floraison.",
  },
  {
    commonName: "Lavande", latinName: "Lavandula angustifolia", category: "arbuste",
    waterNeedMmPerWeek: 5, sowingMonths: [3, 4, 9], harvestMonths: [6, 7, 8],
    sun: "plein soleil", companionGood: ["Thym", "Romarin"], companionBad: [],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Aime les sols pauvres et secs. Tailler au printemps, jamais sur le vieux bois.",
  },
  {
    commonName: "Romarin", latinName: "Salvia rosmarinus", category: "arbuste",
    waterNeedMmPerWeek: 5, sowingMonths: [3, 4, 9], harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sun: "plein soleil", companionGood: ["Thym", "Lavande", "Sauge"], companionBad: [],
    frostSensitive: false, cycleDays: undefined,
    careAdvice: "Aucun arrosage en pleine terre une fois établi. Drainer absolument : il craint les racines mouillées.",
  },
];

// harmonisation des noms d'espèces dans les associations
function normalizeAssociations(list: PlantSpecies[]): PlantSpecies[] {
  const fix = (names: string[]) =>
    names.map((n) =>
      n === "œillet d'Inde" ? "Œillet d'Inde" :
      n === "Parsley" ? "Persil" :
      n
    );
  return list.map((s) => ({ ...s, companionGood: fix(s.companionGood), companionBad: fix(s.companionBad) }));
}

export async function seedIfNeeded(): Promise<void> {
  const count = await db.plant_species.count();
  if (count > 0) return;
  const species = normalizeAssociations(SEED_SPECIES);
  await db.transaction("rw", db.plant_species, db.data_sources, async () => {
    await db.plant_species.bulkAdd(species);
    await db.data_sources.add({
      name: "Référentiel botanique de départ",
      kind: "référentiel botanique",
      origin: "JardinConnect — données indicatives de jardinage général (tempérées, hémisphère nord)",
      licence: "Domaine applicatif — vérifiable et modifiable par l'utilisateur",
      importedAt: new Date().toISOString(),
      notes: "Valeurs indicatives (besoins en eau, calendriers, associations). À adapter à votre climat.",
    });
  });
}
