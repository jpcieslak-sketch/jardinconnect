import { useLiveQuery } from "dexie-react-hooks";
import { db, FRENCH_MONTHS } from "../db";
import { Card, EmptyState, SectionTitle } from "../components/ui";

export const RITUALS: Record<number, string[]> = {
  1: [
    "Planifier la saison : rotations par famille et plan des parcelles",
    "Commander ou trier les graines",
    "Ne jamais laisser le sol nu : paillage ou engrais vert",
  ],
  2: [
    "Premiers semis sous abri : tomate, aubergine, poivron",
    "Préparer le compost et aérer les planches",
  ],
  3: [
    "Semis de primeurs sous abri : laitue, poireau, basilic",
    "Aérer la serre les beaux jours",
  ],
  4: [
    "Derniers semis sous abri : courgette, concombre, melon",
    "Diviser les aromates vivaces (ciboulette, menthe)",
  ],
  5: [
    "Saints de glace (11-13 mai) : planter les plantes sensibles au gel après le 13",
    "Pailler les fraisiers avant la fructification",
  ],
  6: [
    "Pailler toutes les planches (paille, tontes sèches, BRF)",
    "Arroser au pied, le soir, en profondeur",
    "Soigner avec les purins : purin d'ortie en fortifiant, décoction de prêle contre le mildiou",
  ],
  7: [
    "Surveiller mildiou et oïdium, aérer la serre",
    "Récolter régulièrement pour relancer la production",
  ],
  8: [
    "Semer l'automne : épinards, mâche, radis",
    "Récolter et trier les graines",
  ],
  9: [
    "Semer les engrais verts d'automne : phacélie, trèfle incarnat",
    "Récolter et stocker les courges au sec",
  ],
  10: [
    "Ramasser les feuilles mortes : compost + mulch",
    "Planter l'ail et l'échalote",
    "Tailler les pommiers et poiriers une fois la sève arrêtée",
  ],
  11: [
    "Mettre le jardin au repos : mulch épais de feuilles mortes, carton sur sol nu",
    "Planter ail et fèves sous climat doux",
    "Protéger la serre : la nettoyer et l'aérer",
  ],
  12: [
    "Repos hivernal : ne laissez jamais le sol nu",
    "Bilan de la saison et plan des rotations pour l'an prochain",
  ],
};

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function PlanningContent() {
  const speciesAll = useLiveQuery(() => db.plant_species.toArray());
  const plants = useLiveQuery(() => db.plants.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const needs = useLiveQuery(() => db.harvest_needs.toArray());

  if (!speciesAll || !plants || !zones || !needs) {
    return <EmptyState text="Chargement du planning…" />;
  }

  const currentMonth = new Date().getMonth() + 1;
  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));

  const interestIds = new Set<number>();
  for (const n of needs) interestIds.add(n.speciesId);
  for (const p of plants) {
    if (p.status === "pousse" || p.status === "mature") interestIds.add(p.speciesId);
  }
  const interested = [...interestIds]
    .map((id) => speciesById.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const zoneById = new Map(zones.map((z) => [z.id!, z]));
  const familiesByZone = new Map<number, Set<string>>();
  for (const p of plants) {
    if (p.status !== "pousse" && p.status !== "mature") continue;
    const sp = speciesById.get(p.speciesId);
    if (!sp) continue;
    if (!familiesByZone.has(p.zoneId)) familiesByZone.set(p.zoneId, new Set());
    familiesByZone.get(p.zoneId)!.add(sp.family);
  }

  return (
    <div>
      <Card>
        <p className="muted">
          Voici votre planning permaculture mois par mois, construit à partir de vos besoins de récolte
          et de vos plantations actives. Les conseils généraux (paillage, repos hivernal, rotations)
          sont rappelés pour chaque mois.
        </p>
      </Card>

      {familiesByZone.size > 0 && (
        <SectionTitle>🔄 Rotations conseillées</SectionTitle>
      )}
      {[...familiesByZone.entries()].map(([zoneId, families]) => {
        const zone = zoneById.get(zoneId);
        return (
          <Card key={zoneId}>
            <strong>{zone?.name ?? "Parcelle"}</strong>
            <p className="muted">
              Familles cultivées actuellement : {[...families].join(", ")}.
              {" "}L'an prochain, changez de famille sur cette parcelle (ex. après des Solanacées,
              plantez des Fabacées (haricots, fèves) qui enrichissent le sol).
            </p>
          </Card>
        );
      })}
      {familiesByZone.size === 0 && (
        <Card>
          <p className="muted">
            Astuce rotation : si une parcelle se libère, semez un engrais vert (phacélie, trèfle,
            vesce) plutôt que de la laisser nue. Elle sera enrichie pour la culture suivante.
          </p>
        </Card>
      )}

      <SectionTitle>🗓️ Plan mensuel</SectionTitle>
      {ALL_MONTHS.map((m) => {
        const semisAbri = interested.filter((s) => s.underCoverMonths.includes(m));
        const semisField = interested.filter((s) => s.sowingMonths.includes(m));
        const transplant = interested.filter((s) => s.transplantMonths.includes(m));
        const harvest = interested.filter((s) => s.harvestMonths.includes(m));
        const nothing =
          semisAbri.length === 0 && semisField.length === 0 &&
          transplant.length === 0 && harvest.length === 0;
        return (
          <Card key={m} className={m === currentMonth ? "month-current" : ""}>
            <p><strong>{FRENCH_MONTHS[m - 1].charAt(0).toUpperCase() + FRENCH_MONTHS[m - 1].slice(1)}</strong>
              {m === currentMonth && <span className="chip chip-green">mois en cours</span>}</p>
            {semisAbri.length > 0 && (
              <p><span className="chip-label">Semis sous abri :</span>
                {semisAbri.map((s) => <span key={s.id} className="chip chip-blue">{s.commonName}</span>)}</p>
            )}
            {semisField.length > 0 && (
              <p><span className="chip-label">Semis en pleine terre :</span>
                {semisField.map((s) => <span key={s.id} className="chip">{s.commonName}</span>)}</p>
            )}
            {transplant.length > 0 && (
              <p><span className="chip-label">Repiquage :</span>
                {transplant.map((s) => <span key={s.id} className="chip chip-orange">{s.commonName}</span>)}</p>
            )}
            {harvest.length > 0 && (
              <p><span className="chip-label">Récolte :</span>
                {harvest.map((s) => <span key={s.id} className="chip chip-green">{s.commonName}</span>)}</p>
            )}
            {nothing && (
              <p className="muted">Rien à semer ou récolter ce mois-ci pour vos choix actuels.</p>
            )}
            <p className="chip-label">Rituel permaculture :</p>
            {(RITUALS[m] ?? []).map((r, i) => (
              <p key={i} className="muted ritual">{r}</p>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
