import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, today, type HarvestNeed, type PlantSpecies } from "../db";
import { PlanningContent } from "./Planning";
import { Button, Card, EmptyState, Field, Modal, SectionTitle } from "../components/ui";

const DENSITY_FACTOR = 1.5;

function plantsForKg(sp: PlantSpecies, targetKg: number): number | null {
  if (!sp.yieldPerPlantKg || sp.yieldPerPlantKg <= 0) return null;
  return Math.max(1, Math.ceil(targetKg / sp.yieldPerPlantKg));
}

function surfaceFor(sp: PlantSpecies, count: number): number | null {
  if (!sp.spacingCm || sp.spacingCm <= 0) return null;
  const w = sp.spacingCm / 100;
  return Math.round(count * w * w * DENSITY_FACTOR * 10) / 10;
}

function installableSpecies(list: PlantSpecies[]): PlantSpecies[] {
  return list
    .filter((s) => s.category === "légume" || s.category === "fruit" || s.category === "aromate")
    .sort((a, b) => a.commonName.localeCompare(b.commonName, "fr"));
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
  const [installing, setInstalling] = useState<{ need: HarvestNeed; species: PlantSpecies } | null>(null);

  if (!speciesAll || !needs || !plants || !zones) {
    return <EmptyState text="Chargement…" />;
  }

  const speciesById = new Map(speciesAll.map((s) => [s.id!, s]));

  const activePlants = plants.filter((p) => p.status === "pousse" || p.status === "mature");
  const usedSurface = activePlants.reduce((acc, p) => {
    const sp = speciesById.get(p.speciesId);
    if (!sp || !sp.spacingCm) return acc;
    const w = sp.spacingCm / 100;
    return acc + p.quantity * w * w * DENSITY_FACTOR;
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
          <strong>Comment ça marche :</strong> dites simplement combien de kilos vous voulez récolter
          par an (ex. 10 kg de tomates). JardinConnect calcule le nombre de pieds à installer et la
          place nécessaire, puis vous aide à installer dans vos parcelles.
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
      {availableSurface > 0 && (
        <Card>
          <p className="muted">
            📏 Place disponible (parcelles potager et serre) : <strong>{Math.round(availableSurface)} m²</strong>
            {usedSurface > 0 && <> — déjà utilisée par vos plantations : <strong>{Math.round(usedSurface)} m²</strong></>}
            {availableSurface - usedSurface < 0 && " ⚠️ vous dépassez la surface disponible !"}
          </p>
        </Card>
      )}

      <div className="head-row">
        <SectionTitle>🎯 Besoins de récolte</SectionTitle>
        <Button onClick={() => setAdding(true)}>+ Ajouter</Button>
      </div>

      {needs.length === 0 ? (
        <EmptyState text="Aucun besoin enregistré. Ex. : 10 kg de tomates, 5 kg de fraises…" />
      ) : (
        <div className="list">
          {needs.map((need) => {
            const sp = speciesById.get(need.speciesId);
            if (!sp) return null;
            const count = plantsForKg(sp, need.targetKgPerYear);
            const surface = count !== null ? surfaceFor(sp, count) : null;
            const installed = (need.installedPlantIds ?? []).length;
            return (
              <Card key={need.id}>
                <div className="list-text">
                  <strong>{sp.commonName}</strong>
                  <span className="muted">Objectif : {need.targetKgPerYear} kg par an</span>
                </div>
                <p>
                  {count !== null ? (
                    <>→ {'~'}{count} pieds à planter
                      {surface !== null && <> (≈ {surface} m², espacement {sp.spacingCm} cm)</>}
                    </>
                  ) : (
                    <>→ rendement inconnu pour cette espèce</>
                  )}
                </p>
                <p className="muted">
                  Installés : {installed} / {count ?? "?"} pieds{installed >= (count ?? 999) && installed > 0 ? " ✓ objectif couvert" : ""}
                </p>
                <div className="row-actions">
                  <Button variant="small" onClick={() => setInstalling({ need, species: sp })}>
                    🌱 Installer dans une parcelle
                  </Button>
                  <Button variant="small" onClick={async () => { await db.harvest_needs.delete(need.id!); }}>
                    🗑️
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {adding && <AddNeedForm speciesList={installableSpecies(speciesAll)} onClose={() => setAdding(false)} />}
      {installing && (
        <InstallForm
          need={installing.need}
          species={installing.species}
          zoneOpts={zones
            .filter((z) => z.type === "potager" || z.type === "serre")
            .map((z) => ({ value: String(z.id), label: `${z.name}${z.surfaceM2 ? ` (${z.surfaceM2} m²)` : ""}` }))}
          onClose={() => setInstalling(null)}
        />
      )}
    </div>
  );
}

function AddNeedForm({ speciesList, onClose }: { speciesList: PlantSpecies[]; onClose: () => void }) {
  const [speciesId, setSpeciesId] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!speciesId || !target) {
      setError("Choisissez une espèce et un objectif en kg.");
      return;
    }
    const species = speciesList.find((s) => s.id === Number(speciesId));
    if (!species) return;
    const count = plantsForKg(species, Number(target));
    if (count === null) {
      setError("Rendement inconnu pour cette espèce : choisissez-en une autre.");
      return;
    }
    await db.harvest_needs.add({
      speciesId: Number(speciesId),
      targetKgPerYear: Number(target),
      installedPlantIds: [],
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal title="Ce que je veux récolter" onClose={onClose}>
      <div className="form">
        <Field label="Espèce *" help="Exemples : 8 kg de tomates nourrissent 4 personnes, 5 kg de fraises, 2 kg de radis. Vous pourrez ajuster à tout moment.">
          <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
            <option value="">— choisir —</option>
            {speciesList.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.commonName}
                {s.yieldPerPlantKg ? ` (≈ ${s.yieldPerPlantKg} kg/pied)` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Objectif (kg par an) *" help="Le poids total que vous espérez récolter sur l'année pour cette espèce. L'appli en déduit le nombre de pieds.">
          <input type="number" min={0.5} step={0.5} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="ex. 10" />
        </Field>
        {target && speciesId && (() => {
          const sp = speciesList.find((s) => s.id === Number(speciesId));
          if (!sp || !sp.yieldPerPlantKg) return null;
          const count = plantsForKg(sp, Number(target));
          const surface = count ? surfaceFor(sp, count) : null;
          return (
            <p className="muted">
              ↳ Calcul : {'~'}{count} pieds{surface !== null ? ` ≈ ${surface} m²` : ""} (espacement {sp.spacingCm} cm, rendement {sp.yieldPerPlantKg} kg/pied)
            </p>
          );
        })()}
        {error && <p className="field-hint">{error}</p>}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>Créer</Button>
      </div>
    </Modal>
  );
}

function InstallForm({
  need, species, zoneOpts, onClose,
}: {
  need: HarvestNeed;
  species: PlantSpecies;
  zoneOpts: { value: string; label: string }[];
  onClose: () => void;
}) {
  const suggested = plantsForKg(species, need.targetKgPerYear);
  const [zoneId, setZoneId] = useState("");
  const [quantity, setQuantity] = useState(String(suggested ?? 1));
  const [plantingDate, setPlantingDate] = useState(today());
  const [error, setError] = useState("");

  const submit = async () => {
    if (!zoneId) {
      setError("Choisissez une parcelle.");
      return;
    }
    const q = Math.max(1, Math.floor(Number(quantity) || 1));
    const newPlantId = await db.plants.add({
      zoneId: Number(zoneId),
      speciesId: species.id!,
      quantity: q,
      plantingDate,
      status: "pousse",
      notes: "Installé via l'assistant de récolte",
    });
    const installed = [...(need.installedPlantIds ?? []), newPlantId];
    await db.harvest_needs.update(need.id!, { installedPlantIds: installed });
    onClose();
  };

  return (
    <Modal title={`Installer : ${species.commonName}`} onClose={onClose}>
      <div className="form">
        <p className="muted">
          {'~'}{suggested ?? "?"} pieds conseillés pour atteindre {need.targetKgPerYear} kg/an
          (espacement {species.spacingCm ?? "?"} cm). Vous pouvez ajuster le nombre.
        </p>
        <Field label="Parcelle *" help="Où planter ? Choisissez une parcelle de type potager ou serre. Créez-la dans l'onglet Jardins si besoin.">
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">— choisir —</option>
            {zoneOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Nombre de pieds *" help="Le nombre de plants individuels (ex. 6 pieds de tomates). En permaculture on sème en poquets : 2-3 graines par trou, un seul plant retenu.">
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Date de plantation">
          <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} />
        </Field>
        {quantity && suggested && (
          <p className="muted">
            ↳ Surface approximative : {surfaceFor(species, Number(quantity) || 1) ?? "?"} m²
          </p>
        )}
        {error && <p className="field-hint">{error}</p>}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>Installer</Button>
      </div>
    </Modal>
  );
}
