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

function plantsForUnits(sp: PlantSpecies, targetUnits: number): number | null {
  if (!sp.yieldPerPlantUnits || sp.yieldPerPlantUnits <= 0) return null;
  return Math.max(1, Math.ceil(targetUnits / sp.yieldPerPlantUnits));
}

function plantsForNeed(sp: PlantSpecies, need: HarvestNeed): number | null {
  if (need.targetUnitsPerYear != null) return plantsForUnits(sp, need.targetUnitsPerYear);
  if (need.targetKgPerYear != null) return plantsForKg(sp, need.targetKgPerYear);
  return null;
}

function unitNameOf(sp: PlantSpecies): string {
  return sp.unitName ?? "pièce";
}

function needLabel(sp: PlantSpecies, need: HarvestNeed): string {
  if (need.targetUnitsPerYear != null) return `${need.targetUnitsPerYear} ${unitNameOf(sp)}${need.targetUnitsPerYear > 1 ? "s" : ""}/an`;
  if (need.targetKgPerYear != null) return `${need.targetKgPerYear} kg/an`;
  return "objectif ?";
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

type NeedMode = "kg" | "unités";

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
          <strong>Comment ça marche :</strong> cochez toutes les plantes que vous voulez récolter et
          pour chacune la quantité désirée <strong>en kg par an ou en unités</strong> (têtes de
          salade, bottes de radis…). JardinConnect calcule le nombre de pieds à planter et la place
          nécessaire, puis vous aide à installer dans vos parcelles.
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
      {wizard && <QuickStartForm speciesList={installableSpecies(speciesAll)} onClose={() => setWizard(false)} />}
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

type Pick = { on: boolean; qty: string; mode: NeedMode };

function QuickStartForm({ speciesList, onClose }: { speciesList: PlantSpecies[]; onClose: () => void }) {
  const [picks, setPicks] = useState<Record<number, Pick>>({});

  const pickOf = (id?: number): Pick =>
    picks[id ?? -1] ?? { on: false, qty: "", mode: "kg" };

  const setPick = (id: number, patch: Partial<Pick>) =>
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
        vous pouvez compter en unités (têtes, bottes, pièces) plutôt qu'en kg.
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
    const count = mode === "unités" ? plantsForUnits(species, qty) : plantsForKg(species, qty);
    if (count === null) {
      setError("Rendement inconnu pour ce mode : l'appli ne connaît pas ce rendement pour cette espèce.");
      return;
    }
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
    const count = mode === "unités" ? plantsForUnits(species, qty) : plantsForKg(species, qty);
    if (count === null) return null;
    const surface = surfaceFor(species, count);
    const detail =
      mode === "kg"
        ? `rendement ${species.yieldPerPlantKg} kg/pied`
        : `${species.yieldPerPlantUnits} ${unitNameOf(species)}s par pied`;
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
                {s.yieldPerPlantUnits ? ` (${s.yieldPerPlantUnits} ${unitNameOf(s)}${s.yieldPerPlantUnits > 1 ? "s" : ""}/pied)` : s.yieldPerPlantKg ? ` (≈ ${s.yieldPerPlantKg} kg/pied)` : ""}
              </option>
            ))}
          </select>
        </Field>
        {unitsAvailable && (
          <Field label="Je compte en…" help="Les salades, radis, choux et racines se comptent plus naturellement en unités (têtes, bottes, pièces). Tout le reste se compte en kilos récoltés.">
            <div className="row-actions">
              <button className={`seg-btn ${mode === "kg" ? "seg-active" : ""}`} style={{ flex: 1 }} onClick={() => setMode("kg")}>kg/an</button>
              <button className={`seg-btn ${mode === "unités" ? "seg-active" : ""}`} style={{ flex: 1 }} onClick={() => setMode("unités")}>{unitNameOf(species!)}/an</button>
            </div>
          </Field>
        )}
        <Field
          label={mode === "unités" ? `Objectif (${unitNameOf(species ?? speciesList[0])} par an) *` : "Objectif (kg par an) *"}
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

function InstallForm({
  need, species, zoneOpts, onClose,
}: {
  need: HarvestNeed;
  species: PlantSpecies;
  zoneOpts: { value: string; label: string }[];
  onClose: () => void;
}) {
  const suggested = plantsForNeed(species, need);
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
          {'~'}{suggested ?? "?"} pieds conseillés pour atteindre {needLabel(species, need)}
          {species.spacingCm ? ` (espacement ${species.spacingCm} cm)` : ""}. Vous pouvez ajuster le nombre.
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
