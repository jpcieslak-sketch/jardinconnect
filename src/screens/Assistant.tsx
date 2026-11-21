import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, today, type GardenZone, type HarvestNeed, type Plant, type PlantSpecies } from "../db";
import { PlanningContent } from "./Planning";
import { plantsForNeed, plantsForKg, plantsForUnits, needLabel, surfaceFor, conflictsInParcel, rotationProblems } from "../permaculture";
import { Button, Card, EmptyState, Field, Modal, SectionTitle } from "../components/ui";

function installableSpecies(list: PlantSpecies[]): PlantSpecies[] {
  return list
    .filter((s) => s.category === "légume" || s.category === "fruit" || s.category === "aromate")
    .sort((a, b) => a.commonName.localeCompare(b.commonName, "fr"));
}

type NeedMode = "kg" | "unités";

function areaOf(sp: PlantSpecies | undefined, qty: number): number {
  return sp ? surfaceFor(sp, qty) ?? 0 : 0;
}

function squareSize(surfaceM2: number): number {
  return Math.max(26, Math.min(64, 20 + Math.sqrt(Math.max(1, surfaceM2)) * 3));
}

export function AssistantScreen() {
  const [view, setView] = useState<"besoins" | "planning">("besoins");

  return (
    <div>
      <div className="seg">
        <button
          className={`seg-btn ${view === "besoins" ? "seg-active" : ""}`}
          onClick={() => setView("besoins")}
        >
          🎯 Mes besoins
        </button>
        <button
          className={`seg-btn ${view === "planning" ? "seg-active" : ""}`}
          onClick={() => setView("planning")}
        >
          🗓️ Planning du potager
        </button>
      </div>
      {view === "besoins" ? <HarvestNeedsView /> : <PlanningContent />}
    </div>
  );
}

function HarvestNeedsView() {
  const speciesAll = useLiveQuery(() => db.plant_species.toArray());
  const needs = useLiveQuery(() => db.harvest_needs.toArray());
  const plants = useLiveQuery(() => db.plants.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());

  const [adding, setAdding] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [openedZone, setOpenedZone] = useState<GardenZone | null>(null);

  if (!speciesAll || !needs || !plants || !zones) {
    return <EmptyState text="Chargement…" />;
  }

  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));
  const activePlants = plants.filter((p) => p.status === "pousse" || p.status === "mature");

  const usedSurface = activePlants.reduce((acc, p) => {
    const sp = speciesById.get(p.speciesId);
    if (!sp) return acc;
    const area = surfaceFor(sp, p.quantity);
    return acc + (area ?? 0);
  }, 0);

  const needsSurface = needs.reduce((acc, need) => {
    const sp = speciesById.get(need.speciesId);
    if (!sp) return acc;
    const count = plantsForNeed(sp, need);
    return acc + (count !== null ? (surfaceFor(sp, count) ?? 0) : 0);
  }, 0);

  const availableSurface = zones
    .filter((z) => z.type === "potager" || z.type === "serre")
    .reduce((acc, z) => acc + (z.surfaceM2 ?? 0), 0);
  const zonesWithoutSurface = zones
    .filter((z) => (z.type === "potager" || z.type === "serre") && !z.surfaceM2).length;

  return (
    <div>
      <Card>
        <p>
          <strong>Comment ça marche :</strong> cochez toutes les plantes que vous voulez récolter et
          pour chacune la quantité désirée <strong>en kg par an ou en unités</strong> (têtes de
          salade, bottes de radis…). JardinConnect calcule le nombre de pieds à planter, vérifie que
          ça tient dans vos parcelles et vous signale les plantes incompatibles entre elles.
        </p>
      </Card>

      {zonesWithoutSurface > 0 && (
        <Card className="note-warning">
          <p className="muted">
            Certaines parcelles n'ont pas de surface renseignée : complétez-la dans l'onglet
            Jardins pour un calcul précis de la place disponible.
          </p>
        </Card>
      )}

      {(availableSurface > 0 || needs.length > 0) && (
        <Card>
          <p className="muted">
            📏 Parcelles déclarées : <strong>{Math.round(availableSurface)} m²</strong>
            <br />
            🎯 Surface nécessaire pour vos besoins : <strong>{Math.round(needsSurface)} m²</strong>
            {usedSurface > 0 && (
              <><br />🌿 Plantations en place : <strong>{Math.round(usedSurface)} m²</strong></>
            )}
          </p>
        </Card>
      )}

      {availableSurface > 0 && needsSurface > availableSurface && (
        <Card className="note-alert">
          <p>
            <strong>⚠️ Attention, vous avez dépassé la surface souhaitée !</strong> Vos besoins de
            récolte demandent ~{Math.round(needsSurface)} m² alors que vos parcelles n'en font que{" "}
            {Math.round(availableSurface)} m². Réduisez certains besoins, agrandissez une parcelle
            ou installez en contenants.
          </p>
        </Card>
      )}
      {availableSurface > 0 && needsSurface <= availableSurface && usedSurface > availableSurface && (
        <Card className="note-alert">
          <p>
            <strong>⚠️ Attention, vos plantations en place dépassent la surface déclarée.</strong>{" "}
            {Math.round(usedSurface)} m² occupés pour {Math.round(availableSurface)} m² disponibles.
          </p>
        </Card>
      )}

      <div className="head-row">
        <SectionTitle>🎯 Besoins de récolte</SectionTitle>
        <div className="row-actions">
          <Button variant="ghost" onClick={() => setWizard(true)}>✓ Cocher mes récoltes</Button>
          <Button onClick={() => setAdding(true)}>+ Ajouter</Button>
        </div>
      </div>

      {needs.length === 0 ? (
        <EmptyState text="Aucun besoin enregistré. Cliquez sur « ✓ Cocher mes récoltes » pour cocher d'un coup tout ce que vous voulez produire." />
      ) : (
        <div className="list">
          {needs.map((need) => {
            const sp = speciesById.get(need.speciesId);
            if (!sp) return null;
            const count = plantsForNeed(sp, need);
            const surface = count !== null ? surfaceFor(sp, count) : null;
            const installed = (need.installedPlantIds ?? []).length;
            return (
              <Card key={need.id}>
                <div className="list-text">
                  <strong>{sp.commonName}</strong>
                  <span className="muted">Objectif : {needLabel(sp, need)}</span>
                </div>
                <p>
                  {count !== null ? (
                    <>→ {'~'}{count} pieds à planter
                      {surface !== null && <> (≈ {surface} m²{sp.spacingCm ? `, espacement ${sp.spacingCm} cm` : ""})</>}
                    </>
                  ) : (
                    <>→ rendement inconnu pour cette espèce</>
                  )}
                </p>
                <p className="muted">
                  Installés : {installed} / {count ?? "?"} pieds{installed >= (count ?? 999) && installed > 0 ? " ✓ objectif couvert" : ""}
                  {count !== null && installed < count ? " · ouvrez une parcelle (carré) pour installer" : ""}
                </p>
                <div className="row-actions">
                  <Button variant="small" onClick={async () => { await db.harvest_needs.delete(need.id!); }}>
                    🗑️
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="head-row">
        <SectionTitle>📐 Mes parcelles</SectionTitle>
      </div>
      {zones.filter((z) => z.type === "potager" || z.type === "serre").length === 0 ? (
        <EmptyState text="Aucune parcelle potager ou serre. Créez vos parcelles dans l'onglet Jardins (avec leur surface) pour les voir ici." />
      ) : (
        <div className="list">
          {zones
            .filter((z) => z.type === "potager" || z.type === "serre")
            .map((z) => {
              const planted = activePlants
                .filter((p) => p.zoneId === z.id)
                .reduce((acc, p) => acc + areaOf(speciesById.get(p.speciesId), p.quantity), 0);
              const free = (z.surfaceM2 ?? 0) - planted;
              const side = squareSize(z.surfaceM2 ?? 10);
              return (
                <Card key={z.id}>
                  <button className="list-row-btn" onClick={() => setOpenedZone(z)}>
                    <span
                      className="zone-square"
                      style={{ width: side, height: side }}
                      title={z.name}
                    />
                    <div className="list-text">
                      <strong>{z.name}</strong>
                      <span className="muted">
                        {z.surfaceM2 ? `${z.surfaceM2} m²` : "surface ?"}
                        {z.surfaceM2 ? ` · libère : ${free >= 0 ? Math.round(free) + " m²" : "déborde !"}` : ""}
                        {z.sunExposure ? ` · ${z.sunExposure}` : ""}
                      </span>
                    </div>
                    <span className="chev">›</span>
                  </button>
                </Card>
              );
            })}
        </div>
      )}

      {adding && <AddNeedForm speciesList={installableSpecies(speciesAll)} onClose={() => setAdding(false)} />}
      {wizard && <QuickStartForm speciesList={installableSpecies(speciesAll)} onClose={() => setWizard(false)} />}
      {openedZone && (
        <ParcelModal
          zone={openedZone}
          needs={needs}
          speciesAll={speciesAll}
          plants={activePlants}
          onClose={() => setOpenedZone(null)}
        />
      )}
    </div>
  );
}

function ParcelModal({
  zone, needs, speciesAll, plants, onClose,
}: {
  zone: GardenZone;
  needs: HarvestNeed[];
  speciesAll: PlantSpecies[];
  plants: Plant[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [qty, setQty] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));
  const zonePlants = plants.filter((p) => p.zoneId === zone.id);
  const plantedArea = zonePlants.reduce((acc, p) => acc + areaOf(speciesById.get(p.speciesId), p.quantity), 0);
  const free = (zone.surfaceM2 ?? 0) - plantedArea;

  const zoneSpecies = zonePlants
    .map((p) => speciesById.get(p.speciesId))
    .filter((s): s is PlantSpecies => Boolean(s));

  const currentYear = new Date().getFullYear();
  const lastYearNames = [...new Set(
    plants
      .filter((p) => p.zoneId === zone.id && p.plantingDate.startsWith(String(currentYear - 1)))
      .map((p) => speciesById.get(p.speciesId)?.commonName)
      .filter((n): n is string => Boolean(n)),
  )];
  const lastYearFamilies = [...new Set(
    plants
      .filter((p) => p.zoneId === zone.id && p.plantingDate.startsWith(String(currentYear - 1)))
      .map((p) => speciesById.get(p.speciesId)?.family)
      .filter((f): f is string => Boolean(f)),
  )];

  const remainingFor = (n: HarvestNeed) => {
    const sp = speciesById.get(n.speciesId);
    const count = sp ? plantsForNeed(sp, n) : null;
    const installed = (n.installedPlantIds ?? []).length;
    return count !== null ? Math.max(0, count - installed) : 0;
  };
  const chosenFor = (n: HarvestNeed) => {
    const remaining = remainingFor(n);
    const parsed = Number(qty[n.id!]);
    if (!Number.isFinite(parsed) || parsed <= 0) return remaining;
    return Math.min(remaining, Math.floor(parsed));
  };

  const selectedNeeds = needs.filter((n) => selected.has(n.id!));
  const selectedSpecies = selectedNeeds
    .map((n) => speciesById.get(n.speciesId))
    .filter((s): s is PlantSpecies => Boolean(s));
  const conflicts = conflictsInParcel(selectedSpecies, zoneSpecies.filter((s) => !selectedSpecies.includes(s)));
  const rotation = rotationProblems(zone.id!, selectedSpecies, plants, speciesById, currentYear);
  const selectedArea = selectedNeeds.reduce((acc, n) => {
    const sp = speciesById.get(n.speciesId);
    if (!sp) return acc;
    const chosen = chosenFor(n);
    return acc + (chosen > 0 ? surfaceFor(sp, chosen) ?? 0 : 0);
  }, 0);
  const afterFree = free - selectedArea;

  const toggle = (id: number) => {
    const willCheck = !selected.has(id);
    const need = needs.find((n) => n.id === id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (need && willCheck) {
      setQty((prev) => ({ ...prev, [id]: String(remainingFor(need)) }));
    }
  };

  const install = async () => {
    if (selectedNeeds.length === 0) {
      setError("Cochez au moins une récolte à installer.");
      return;
    }
    setBusy(true);
    try {
      for (const need of selectedNeeds) {
        const sp = speciesById.get(need.speciesId);
        if (!sp) continue;
        const count = plantsForNeed(sp, need);
        if (count === null) continue;
        const q = chosenFor(need);
        if (q <= 0) continue;
        const newPlantId = await db.plants.add({
          zoneId: zone.id!,
          speciesId: sp.id!,
          quantity: q,
          plantingDate: today(),
          status: "pousse",
          notes: "Installé via l'assistant de récolte",
        });
        await db.harvest_needs.update(need.id!, {
          installedPlantIds: [...(need.installedPlantIds ?? []), newPlantId],
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`📐 ${zone.name}`} onClose={onClose}>
      <div className="zone-square zone-square-large" />
      <p className="muted">
        Surface : <strong>{zone.surfaceM2 ?? "?"} m²</strong>
        {zone.surfaceM2 ? (
          <>
            {" "}· plantée : <strong>{Math.round(plantedArea)} m²</strong>
            {" "}· libre : <strong style={free < 0 ? { color: "var(--danger)" } : undefined}>{Math.round(free)} m²</strong>
          </>
        ) : null}
      </p>

      {zoneSpecies.length > 0 && (
        <p className="muted">
          Déjà ici : {zoneSpecies.map((s) => `${s.commonName} (×${zonePlants.filter((p) => p.speciesId === s.id).reduce((a, p) => a + p.quantity, 0)})`).join(", ")}
        </p>
      )}
      {lastYearNames.length > 0 && (
        <p className="muted">
          🕘 Ici l'an dernier : {lastYearNames.join(", ")}{lastYearFamilies.length > 0 ? ` (famille${lastYearFamilies.length > 1 ? "s" : ""} : ${lastYearFamilies.join(", ")})` : ""} — le mieux est de changer de famille cette année.
        </p>
      )}

      <div className="head-row">
        <SectionTitle>Qu'y installer ?</SectionTitle>
      </div>
      {needs.length === 0 ? (
        <EmptyState text="Aucun besoin déclaré : cochez d'abord vos récoltes (écran précédent)." />
      ) : (
        <div className="form wizard-list">
          {needs.map((need) => {
            const sp = speciesById.get(need.speciesId);
            if (!sp) return null;
            const count = plantsForNeed(sp, need);
            const installed = (need.installedPlantIds ?? []).length;
            const remaining = count !== null ? Math.max(0, count - installed) : 0;
            const area = remaining > 0 ? surfaceFor(sp, remaining) : 0;
            const covered = installed >= (count ?? 0);
            return (
              <div key={need.id} className="wizard-row">
                <label className="wizard-check">
                  <input type="checkbox" checked={selected.has(need.id!)} onChange={() => toggle(need.id!)} />
                  <strong>{sp.commonName}</strong>
                  <span className="muted">{needLabel(sp, need)}</span>
                </label>
                <p className="muted" style={{ marginLeft: 30 }}>
                  {count === null
                    ? "rendement inconnu"
                    : covered
                      ? "✓ déjà installé dans vos parcelles"
                      : `à installer : ${remaining} pieds ≈ ${area} m²${area ? " (surface déduite automatiquement)" : ""}`}
                </p>
                {selected.has(need.id!) && remaining > 0 && (
                  <div className="wizard-inputs" style={{ marginLeft: 30 }}>
                    <input
                      type="number"
                      min={1}
                      max={remaining}
                      value={qty[need.id!] ?? String(remaining)}
                      onChange={(e) => setQty((prev) => ({ ...prev, [need.id!]: e.target.value }))}
                    />
                    <span className="muted">pieds ici, sur {remaining} à installer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="note-alert" style={{ marginTop: 10 }}>
          <p>
            <strong>⚠️ Attention, problème de compatibilité :</strong>
          </p>
          {conflicts.map((c, i) => <p key={i} className="muted">• {c}</p>)}
          <p className="muted">Ces plantes se gênent (maladies communes, exsudats) : déplacez-les dans des parcelles séparées ou espacez-les au maximum.</p>
        </div>
      )}

      {rotation.length > 0 && (
        <div className="note-alert" style={{ marginTop: 10 }}>
          <p>
            <strong>⚠️ Attention, problème au niveau de la rotation :</strong>
          </p>
          <p className="muted">
            La famille {rotation.join(", ")} a déjà été cultivée dans {zone.name} l'an dernier. En permaculture, on ne replante pas la même famille deux années de suite : changez ces plantes de parcelle.
          </p>
        </div>
      )}

      {selectedNeeds.length > 0 && zone.surfaceM2 && (
        <p className={afterFree < 0 ? "field-hint" : "muted"} style={{ marginTop: 10 }}>
          {afterFree < 0
            ? `⚠️ Cette parcelle ne peut pas tout contenir : ${Math.round(selectedArea)} m² voulus pour ${Math.round(free)} m² libres. Installez une partie ici (réduisez les quantités), le reste pourra être posé dans une autre parcelle ou dans une nouvelle.`
            : `Après installation : ${Math.round(afterFree)} m² encore libres sur ${zone.name}.`}
        </p>
      )}
      {selectedNeeds.length > 0 && !zone.surfaceM2 && (
        <p className="field-hint" style={{ marginTop: 10 }}>
          Renseignez la surface de <strong>{zone.name}</strong> dans l'onglet Jardins pour que l'appli puisse comparer.
        </p>
      )}
      {selectedSpecies.length > 0 && conflicts.length === 0 && (
        <p className="muted" style={{ marginTop: 6 }}>✓ Aucune incompatibilité avec les plantes déjà en place.</p>
      )}
      {error && <p className="field-hint">{error}</p>}

      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={install} disabled={busy}>
          {busy ? "Installation…" : `Installer (${selectedNeeds.length})`}
        </Button>
      </div>
    </Modal>
  );
}

function AddNeedForm({ speciesList, onClose }: { speciesList: PlantSpecies[]; onClose: () => void }) {
  const [speciesId, setSpeciesId] = useState("");
  const [mode, setMode] = useState<NeedMode>("kg");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");

  const species = speciesList.find((s) => s.id === Number(speciesId));
  const unitsAvailable = Boolean(species?.yieldPerPlantUnits);

  const submit = async () => {
    if (!species) {
      setError("Choisissez une espèce.");
      return;
    }
    if (!target || Number(target) <= 0) {
      setError("Indiquez la quantité souhaitée.");
      return;
    }
    const qty = Number(target);
    await db.harvest_needs.add({
      speciesId: species.id!,
      ...(mode === "unités" ? { targetUnitsPerYear: qty } : { targetKgPerYear: qty }),
      installedPlantIds: [],
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  const preview = (() => {
    if (!species || !target || Number(target) <= 0) return null;
    const qty = Number(target);
    const count = mode === "unités"
      ? plantsForUnits(species, qty) ?? plantsForKg(species, qty)
      : plantsForKg(species, qty) ?? plantsForUnits(species, qty);
    if (count === null) return null;
    const surface = surfaceFor(species, count);
    const detail =
      mode === "kg"
        ? `rendement ${species.yieldPerPlantKg ?? "?"} kg/pied`
        : `${species.yieldPerPlantUnits ?? "?"} ${species.unitName ?? "pièce"}${(species.yieldPerPlantUnits ?? 1) > 1 ? "s" : ""} par pied`;
    return (
      <p className="muted">
        ↳ Calcul : {'~'}{count} pieds{surface !== null ? ` ≈ ${surface} m²` : ""} (espacement {species.spacingCm ?? "?"} cm, {detail})
      </p>
    );
  })();

  return (
    <Modal title="Ce que je veux récolter" onClose={onClose}>
      <div className="form">
        <Field label="Espèce *" help="Exemples : 8 kg de tomates nourrissent 4 personnes, 20 têtes de salade, 10 bottes de radis. Vous pourrez ajuster à tout moment.">
          <select value={speciesId} onChange={(e) => {
            setSpeciesId(e.target.value);
            const sp = speciesList.find((s) => s.id === Number(e.target.value));
            setMode(sp?.yieldPerPlantUnits ? "unités" : "kg");
          }}>
            <option value="">— choisir —</option>
            {speciesList.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.commonName}
                {s.yieldPerPlantUnits ? ` (${s.yieldPerPlantUnits} ${s.unitName ?? "pièce"}${s.yieldPerPlantUnits > 1 ? "s" : ""}/pied)` : s.yieldPerPlantKg ? ` (≈ ${s.yieldPerPlantKg} kg/pied)` : ""}
              </option>
            ))}
          </select>
        </Field>
        {unitsAvailable && (
          <Field label="Je compte en…" help="Les salades, radis, choux et racines se comptent plus naturellement en unités (têtes, bottes, pièces). Tout le reste se compte en kilos récoltés.">
            <div className="row-actions">
              <button className={`seg-btn ${mode === "kg" ? "seg-active" : ""}`} style={{ flex: 1 }} onClick={() => setMode("kg")}>kg/an</button>
              <button className={`seg-btn ${mode === "unités" ? "seg-active" : ""}`} style={{ flex: 1 }} onClick={() => setMode("unités")}>unités</button>
            </div>
          </Field>
        )}
        <Field
          label={mode === "unités" ? `Objectif (${species ? species.unitName ?? "pièce" : "pièce"} par an) *` : "Objectif (kg par an) *"}
          help="Ce que vous espérez récolter sur l'année. L'appli en déduit le nombre de pieds à planter."
        >
          <input type="number" min={1} step={0.5} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={mode === "unités" ? "ex. 20" : "ex. 10"} />
        </Field>
        {preview}
        {error && <p className="field-hint">{error}</p>}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>Créer</Button>
      </div>
    </Modal>
  );
}

function QuickStartForm({ speciesList, onClose }: { speciesList: PlantSpecies[]; onClose: () => void }) {
  const [picks, setPicks] = useState<Record<number, { on: boolean; qty: string; mode: NeedMode }>>({});

  const pickOf = (id?: number) => picks[id ?? -1] ?? { on: false, qty: "", mode: "kg" as NeedMode };

  const setPick = (id: number, patch: Partial<{ on: boolean; qty: string; mode: NeedMode }>) =>
    setPicks((prev) => ({ ...prev, [id]: { ...pickOf(id), ...patch } }));

  const submit = async () => {
    const rows = speciesList.filter((s) => pickOf(s.id).on && Number(pickOf(s.id).qty) > 0);
    if (rows.length === 0) return;
    await db.harvest_needs.bulkAdd(
      rows.map((s) => {
        const p = pickOf(s.id);
        const qty = Number(p.qty);
        return {
          speciesId: s.id!,
          ...(p.mode === "unités" ? { targetUnitsPerYear: qty } : { targetKgPerYear: qty }),
          installedPlantIds: [],
          createdAt: new Date().toISOString(),
        } satisfies HarvestNeed;
      }),
    );
    onClose();
  };

  const checked = speciesList.filter((s) => pickOf(s.id).on && Number(pickOf(s.id).qty) > 0).length;

  return (
    <Modal title="Ce que je veux récolter" onClose={onClose}>
      <p className="muted">
        Cochez chaque plante voulue et tapez la quantité par an. Pour les salades, radis, choux…
        vous pouvez compter en unités (têtes, bottes, pièces) plutôt qu'en kg : cochez puis
        sélectionnez l'unité à côté du champ.
      </p>
      <div className="form wizard-list">
        {speciesList.map((s) => {
          const p = pickOf(s.id);
          const hasUnits = Boolean(s.yieldPerPlantUnits);
          const mode = hasUnits ? p.mode : "kg";
          return (
            <div key={s.id} className="wizard-row">
              <label className="wizard-check">
                <input
                  type="checkbox"
                  checked={p.on}
                  onChange={(e) => setPick(s.id!, { on: e.target.checked })}
                />
                <strong>{s.commonName}</strong>
              </label>
              {p.on && (
                <div className="wizard-inputs">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={p.qty}
                    onChange={(e) => setPick(s.id!, { qty: e.target.value })}
                    placeholder="quantité"
                  />
                  {hasUnits ? (
                    <select value={mode} onChange={(e) => setPick(s.id!, { mode: e.target.value as NeedMode })}>
                      <option value="unités">{s.unitName}/an</option>
                      <option value="kg">kg/an</option>
                    </select>
                  ) : (
                    <span className="muted">kg/an</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={checked === 0}>
          {checked === 0 ? "Cochez au moins 1 récolte" : `Ajouter ${checked} besoin(s)`}
        </Button>
      </div>
    </Modal>
  );
}

