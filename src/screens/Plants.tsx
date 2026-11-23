import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, daysSince, today, FRENCH_MONTHS, type PlantSpecies } from "../db";
import { surfaceFor } from "../permaculture";
import { refOptions } from "../components/EntityList";
import { ParcelInstallPanel, isPotagerSpecies } from "./Assistant";
import { Button, Card, EmptyState, Field, Modal, SectionTitle } from "../components/ui";

const NATURAL_REMEDIES: Record<string, string[]> = {
  maladie: [
    "Décoction de prêle (10 g/L, bouillir 20 min) contre le mildiou — pulvériser tous les 10 jours",
    "Bicarbonate de soude (5 g/L) + une cuillère de savon noir contre l'oïdium (poudre blanche)",
    "Purin d'ortie dilué à 5 % en arrosage pour renforcer les plantes",
  ],
  ravageur: [
    "Savon noir dilué (10 ml/L) contre pucerons, cochenilles et acariens — pulvériser le soir",
    "Barrières anti-limaces : cendre, coquilles d'œufs concassées, planches à retourner le matin",
    "Bacillus thuringiensis (bio) contre les chenilles",
    "Planter des capucines ou œillets d'Inde comme plantes pièges",
  ],
  carence: [
    "Purin de consoude dilué à 10 % (riche en potassium — feuilles jaunes/violettes)",
    "Purin d'ortie dilué à 5 % (azote — plante pâle qui pousse lentement)",
    "Compost mûr en surface + paillage pour nourrir le sol durablement",
  ],
  "stress hydrique": [
    "Arroser en profondeur le soir, au pied, 2 jours de suite pour réhydrater",
    "Pailler épais immédiatement (paille, tontes sèches) pour garder la fraîcheur",
    "Installer une olla ou du goutte-à-goutte pour un arrosage lent et régulier",
  ],
  sain: [
    "Tout va bien ! Continuez le paillage et un purin d'ortie préventif une fois par mois",
  ],
  autre: [
    "Observez quotidiennement et ajoutez une photo : les détails (taches, dessous des feuilles) aident au diagnostic",
  ],
};

export function PlantsScreen() {
  const plants = useLiveQuery(() => db.plants.toArray());
  const species = useLiveQuery(() => db.plant_species.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const needs = useLiveQuery(() => db.harvest_needs.toArray());
  const diagnostics = useLiveQuery(() => db.plant_diagnostics.toArray());
  const treatments = useLiveQuery(() => db.plant_treatments.toArray());
  const images = useLiveQuery(() => db.diagnostic_images.toArray());

  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const speciesById = new Map((species ?? []).map((s) => [s.id!, s]));
  const zoneById = new Map((zones ?? []).map((z) => [z.id!, z]));

  const detailPlant = plants?.find((p) => p.id === detailId);
  const detailDiagnostics = (diagnostics ?? []).filter((d) => d.plantId === detailId);

  const waterNow = async (plantId: number) => {
    await db.plants.update(plantId, { lastWateredAt: today() });
  };


  const activePlants = (plants ?? []).filter((p) => p.status === "pousse" || p.status === "mature");
  const parcelles = (zones ?? []).filter((z) => z.type === "potager" || z.type === "serre");
  const selectedZoneId = selectedZone !== null ? zoneById.get(selectedZone) ?? null : null;
  const installedInZone = selectedZoneId ? activePlants.filter((p) => p.zoneId === selectedZoneId.id) : [];
  const plantedArea = installedInZone.reduce((acc, p) => {
    const sp = speciesById.get(p.speciesId);
    return acc + (sp ? surfaceFor(sp, p.quantity > 0 ? p.quantity : 1) ?? 0 : 0);
  }, 0);
  const free = selectedZoneId ? (selectedZoneId.surfaceM2 ?? 0) - plantedArea : 0;

  return (
    <div>
      <div className="cultures-intro">
        <span className="cultures-eyebrow">MON POTAGER</span>
        <h2>Mes cultures 🌿</h2>
        <p>Choisissez une parcelle pour voir sa place disponible, puis retrouvez ses plantations en un coup d'œil.</p>
      </div>

      <div className="head-row">
        <SectionTitle>Mes parcelles</SectionTitle>
        {selectedZone !== null && <button type="button" className="cultures-reset" onClick={() => setSelectedZone(null)}>Tout voir</button>}
      </div>
      {parcelles.length === 0 ? (
        <EmptyState text="Créez votre première parcelle dans Terrain pour commencer." />
      ) : (
        <div className="parcel-grid">
          {parcelles.map((z) => {
            const area = activePlants.filter(p => p.zoneId === z.id).reduce((sum, p) =>
              sum + (speciesById.has(p.speciesId) ? surfaceFor(speciesById.get(p.speciesId)!, p.quantity) ?? 0 : 0), 0);
            const surface = z.surfaceM2;
            const known = typeof surface === "number" && surface > 0;
            const remaining = known ? surface - area : null;
            const occupancy = known ? Math.min(100, Math.max(0, area / surface * 100)) : 0;
            const count = activePlants.filter(p => p.zoneId === z.id).length;
            return (
              <button type="button" key={z.id} className={`parcel-tile ${selectedZone === z.id ? "parcel-tile-active" : ""}`} onClick={() => setSelectedZone(z.id!)} aria-pressed={selectedZone === z.id}>
                <span className="parcel-tile-top"><span className="parcel-tile-icon">{z.type === "serre" ? "🏡" : "🌱"}</span><span className="parcel-tile-name">{z.name}</span></span>
                <span className="parcel-tile-number">{remaining === null ? "—" : `${remaining.toFixed(1)} m²`}</span>
                <span className="parcel-tile-sub">{remaining === null ? "Surface à renseigner" : remaining < 0 ? "Surface dépassée" : "encore disponibles"}</span>
                <span className="parcel-progress"><span style={{ width: `${occupancy}%`, background: remaining !== null && remaining < 0 ? "var(--danger)" : undefined }} /></span>
                <span className="parcel-tile-footer">{known ? `${area.toFixed(1)} / ${surface} m² occupés` : "Surface inconnue"} · {count} culture{count > 1 ? "s" : ""}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedZoneId && (
        <div className="parcel-workspace">
          <div className="head-row"><SectionTitle>📍 {selectedZoneId.name}</SectionTitle></div>
          <p className="muted">Les surfaces sont estimées à partir de l'espacement des plantes. Elles se mettent à jour après chaque installation.</p>
          <div className="parcel-metrics">
            <div><span>Plantée</span><strong>{plantedArea.toFixed(1)} <small>m²</small></strong></div>
            <div><span>Libre</span><strong className={free < 0 ? "surface-negative" : ""}>{selectedZoneId.surfaceM2 === undefined ? "—" : free.toFixed(1)} <small>m²</small></strong></div>
            <div><span>Surface totale</span><strong>{selectedZoneId.surfaceM2 ?? "—"} <small>m²</small></strong></div>
          </div>
          <details className="parcel-install">
            <summary>＋ Installer des plantes dans cette parcelle</summary>
            {needs && species && (
              <ParcelInstallPanel zone={selectedZoneId} needs={needs} speciesAll={species} plants={activePlants} />
            )}
          </details>
        </div>
      )}

      <div className="head-row">
        <SectionTitle>🌿 {selectedZoneId ? `Cultures · ${selectedZoneId.name}` : "Toutes mes cultures"}</SectionTitle>
        <span className="cultures-count">{selectedZoneId ? (plants ?? []).filter(p => p.zoneId === selectedZoneId.id).length : (plants ?? []).length}</span>
      </div>
      {(() => {
        const visiblePlants = selectedZoneId ? (plants ?? []).filter(p => p.zoneId === selectedZoneId.id) : (plants ?? []);
        return visiblePlants.length === 0 ? (
          <EmptyState text={selectedZoneId ? "Aucune culture dans cette parcelle. Utilisez « Installer des plantes » ci-dessus." : "Pas encore de plantations. Choisissez une parcelle pour commencer."} />
        ) : (
          <div className="cultures-grid">
            {visiblePlants.map((p) => {
              const sp = speciesById.get(p.speciesId);
              const zone = zoneById.get(p.zoneId);
              const since = daysSince(p.lastWateredAt);
              const plantArea = sp ? surfaceFor(sp, p.quantity) : null;
              return (
                <article key={p.id} className="culture-tile">
                  <button type="button" className="culture-tile-main" onClick={() => setDetailId(p.id!)} aria-label={`Voir ${p.nickname ?? sp?.commonName ?? "la plante"}`}>
                    <span className="culture-icon">{sp?.category === "aromate" ? "🌿" : sp?.category === "fruit" ? "🍓" : sp?.category === "fleur" ? "🌼" : "🥬"}</span>
                    <span className="culture-tile-info">
                      <strong>{p.nickname ?? sp?.commonName ?? "Plante"}</strong>
                      <span>{zone?.name ?? "Parcelle inconnue"}</span>
                    </span>
                    <span className="culture-chevron">›</span>
                  </button>
                  <div className="culture-tile-stats">
                    <span><b>{p.quantity}</b> pied{p.quantity > 1 ? "s" : ""}</span>
                    {plantArea !== null && <span>≈ {plantArea.toFixed(1)} m²</span>}
                    <span className={`culture-status culture-status-${p.status === "pousse" || p.status === "mature" ? "active" : "past"}`}>{p.status}</span>
                  </div>
                  <div className="culture-tile-actions">
                    <button type="button" onClick={() => void waterNow(p.id!)}>💧 {since === 0 ? "Arrosée" : "J'ai arrosé"}</button>
                    <button type="button" onClick={() => setEditing({ ...p })}>✎ Modifier</button>
                  </div>
                </article>
              );
            })}
          </div>
        );
      })()}

      {editing && (
        <PlantForm
          row={editing}
          zoneOpts={refOptions(zones)}
          speciesOpts={refOptions((species ?? []).filter(isPotagerSpecies), "commonName")}
          speciesList={species ?? []}
          onClose={() => setEditing(null)}
        />
      )}


      {detailPlant && (
        <Modal title={detailPlant.nickname ?? speciesById.get(detailPlant.speciesId)?.commonName ?? "Détail plante"} onClose={() => setDetailId(null)}>
          <PlantDetail
            plant={detailPlant}
            diagnostics={detailDiagnostics}
            treatments={treatments ?? []}
            images={images ?? []}
            speciesAdvice={speciesById.get(detailPlant.speciesId)}
          />
        </Modal>
      )}
    </div>
  );
}

function PlantForm({
  row, zoneOpts, speciesOpts, speciesList, onClose,
}: {
  row: Record<string, unknown>;
  zoneOpts: { value: string; label: string }[];
  speciesOpts: { value: string; label: string }[];
  speciesList: PlantSpecies[];
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...row });
  const isNew = row.id === undefined;
  const [quantityMode, setQuantityMode] = useState<"pieds" | "kg">("pieds");
  const [kgInstalled, setKgInstalled] = useState("");
  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));
  const speciesMap = new Map(speciesList.map((s) => [s.id!, s]));
  const selectedSpecies = (values.speciesId === "" || values.speciesId === undefined)
    ? undefined
    : speciesMap.get(Number(values.speciesId));

  const submit = async () => {
    if (!values.zoneId || !values.speciesId) return;
    const clean = { ...values };
    if (quantityMode === "kg") {
      const kg = Number(kgInstalled);
      if (!selectedSpecies?.yieldPerPlantKg || !Number.isFinite(kg) || kg <= 0) return;
      clean.quantity = Math.ceil(kg / selectedSpecies.yieldPerPlantKg);
    }
    if (!Number.isFinite(Number(clean.quantity)) || Number(clean.quantity) <= 0) return;
    clean.quantity = Math.floor(Number(clean.quantity));
    for (const k of ["quantity", "wateringIntervalDays"]) {
      if (clean[k] === "" || clean[k] === undefined) delete clean[k];
    }
    if (isNew) await db.plants.add(clean as any);
    else await db.plants.update(row.id as number, clean as any);
    onClose();
  };

  return (
    <Modal title={isNew ? "Nouvelle plantation" : "Modifier la plantation"} onClose={onClose}>
      <div className="form">
        <Field label="Parcelle *">
          <select value={String(values.zoneId ?? "")} onChange={(e) => set("zoneId", e.target.value)}>
            <option value="">— choisir —</option>
            {zoneOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Espèce *">
          <select value={String(values.speciesId ?? "")} onChange={(e) => set("speciesId", e.target.value)}>
            <option value="">— choisir —</option>
            {speciesOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        {selectedSpecies && (selectedSpecies.companionGood.length > 0 || selectedSpecies.companionBad.length > 0) && (
          <div className="form-note">
            <p className="chip-label">♥ À installer à côté : bon compagnon</p>
            {selectedSpecies.companionGood.length > 0 && (
              <p>{selectedSpecies.companionGood.map((n) => <span key={n} className="chip chip-green">{n}</span>)}</p>
            )}
            {selectedSpecies.companionBad.length > 0 && (
              <p><span className="chip-label">⚠ À éviter à côté :</span></p>
            )}
            {selectedSpecies.companionBad.length > 0 && (
              <p>{selectedSpecies.companionBad.map((n) => <span key={n} className="chip chip-red">{n}</span>)}</p>
            )}
          </div>
        )}
        <Field label="Surnom" hint="ex. « Tomates cerises du mur »">
          <input type="text" value={String(values.nickname ?? "")} onChange={(e) => set("nickname", e.target.value)} />
        </Field>
        <Field label="Quantité installée" help="Choisissez le nombre de pieds réellement plantés, ou une quantité en kg à convertir en nombre estimé de pieds selon le rendement de cette espèce. Vous pouvez ajouter la même espèce sur plusieurs parcelles.">
          <select value={quantityMode} onChange={(e) => setQuantityMode(e.target.value as "pieds" | "kg")}>
            <option value="pieds">Nombre de pieds</option>
            {selectedSpecies?.yieldPerPlantKg ? <option value="kg">Kilogrammes prévus (estimation)</option> : null}
          </select>
        </Field>
        {quantityMode === "kg" && selectedSpecies?.yieldPerPlantKg ? (
          <Field label="Récolte prévue (kg)">
            <input type="number" min={0.1} step={0.1} value={kgInstalled} onChange={(e) => setKgInstalled(e.target.value)} />
            <p className="muted">≈ {Math.ceil((Number(kgInstalled) || 0) / selectedSpecies.yieldPerPlantKg)} pieds, sur la base de {selectedSpecies.yieldPerPlantKg} kg/pied. Il s’agit d’une estimation, pas d’une récolte pesée.</p>
          </Field>
        ) : (
        <Field label="Nombre de pieds">
          <input type="number" min={1} step={1} value={String(values.quantity ?? 1)} onChange={(e) => set("quantity", e.target.value)} />
        </Field>
        )}
        <Field label="Date de plantation">
          <input type="date" value={String(values.plantingDate ?? today())} onChange={(e) => set("plantingDate", e.target.value)} />
        </Field>
        <Field label="Statut">
          <select value={String(values.status ?? "pousse")} onChange={(e) => set("status", e.target.value)}>
            <option value="pousse">En pousse</option>
            <option value="mature">Mature</option>
            <option value="récolté">Récolté</option>
            <option value="mort">Mort</option>
          </select>
        </Field>
        <Field label="Dernier arrosage">
          <input type="date" value={String(values.lastWateredAt ?? "")} onChange={(e) => set("lastWateredAt", e.target.value)} />
        </Field>
        <Field
          label="Rythme d'arrosage (jours)"
          help="Ne remplissez pas ce champ : l'appli calcule le bon rythme à partir des besoins en eau de l'espèce et de la météo. Ne le touchez que si vous avez constaté une situation particulière (sol très drainant, pot très exposé…)."
          hint={selectedSpecies ? `Recommandé pour ${selectedSpecies.commonName} : ${selectedSpecies.waterNeedMmPerWeek} mm/semaine (≈ tous les ${Math.max(1, Math.round(selectedSpecies.waterNeedMmPerWeek / 4))} jours)` : "Laisser vide : l'appli utilise les besoins de l'espèce"}
        >
          <input type="number" min={1} value={String(values.wateringIntervalDays ?? "")} onChange={(e) => set("wateringIntervalDays", e.target.value)} placeholder="Auto" />
        </Field>
        <Field label="Notes">
          <textarea value={String(values.notes ?? "")} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      <div className="form-actions">
        {!isNew && <Button variant="danger" onClick={async () => { await db.plants.delete(row.id as number); onClose(); }}>Supprimer</Button>}
        <div className="spacer" />
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>{isNew ? "Créer" : "Enregistrer"}</Button>
      </div>
    </Modal>
  );
}

function PlantDetail({
  plant, diagnostics, treatments, images, speciesAdvice,
}: {
  plant: any;
  diagnostics: any[];
  treatments: any[];
  images: any[];
  speciesAdvice?: any;
}) {
  const [diagOpen, setDiagOpen] = useState(false);
  const [treatmentOpen, setTreatmentOpen] = useState(false);

  const plantTreatments = treatments.filter((t) => t.plantId === plant.id);
  const imgByDiag = new Map<number, any[]>();
  for (const img of images) {
    if (!imgByDiag.has(img.diagnosticId)) imgByDiag.set(img.diagnosticId, []);
    imgByDiag.get(img.diagnosticId)!.push(img);
  }

  return (
    <div>
      {speciesAdvice && (
        <Card>
          <strong>Conseils — {speciesAdvice.commonName}</strong>
          <p className="muted">{speciesAdvice.careAdvice}</p>
          <p className="muted">
            Semis : {speciesAdvice.sowingMonths.map((m: number) => FRENCH_MONTHS[m - 1]).join(", ")} ·
            Récolte : {speciesAdvice.harvestMonths.map((m: number) => FRENCH_MONTHS[m - 1]).join(", ")}
          </p>
        </Card>
      )}

      <SectionTitle>🩺 Diagnostics</SectionTitle>
      {diagnostics.length === 0 ? (
        <EmptyState text="Aucun diagnostic enregistré." />
      ) : (
        <div className="list">
          {diagnostics.map((d) => (
            <Card key={d.id}>
              <strong>{d.status}</strong> <span className="muted">({d.severity}) · {d.date}</span>
              <p className="muted">{d.description}{d.conclusion ? ` — ${d.conclusion}` : ""}</p>
              <div className="thumbs">
                {(imgByDiag.get(d.id!) ?? []).map((img) => (
                  <img key={img.id} src={img.imageDataUrl} alt={img.caption ?? "photo diagnostic"} />
                ))}
              </div>
              {plantTreatments.filter((t) => t.diagnosticId === d.id).map((t) => (
                <p key={t.id} className="muted">💊 {t.product} ({t.type}) · {t.date}{t.nextDueDate ? ` · À refaire le ${t.nextDueDate}` : ""}</p>
              ))}
            </Card>
          ))}
        </div>
      )}

      <div className="row-actions">
        <Button onClick={() => setDiagOpen(true)}>+ Diagnostic</Button>
        <Button variant="ghost" onClick={() => setTreatmentOpen(true)}>+ Traitement</Button>
      </div>

      {diagOpen && <DiagnosticForm plantId={plant.id} onClose={() => setDiagOpen(false)} />}
      {treatmentOpen && <TreatmentForm plantId={plant.id} onClose={() => setTreatmentOpen(false)} />}
    </div>
  );
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 800 / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DiagnosticForm({ plantId, onClose }: { plantId: number; onClose: () => void }) {
  const [status, setStatus] = useState("sain");
  const [severity, setSeverity] = useState("faible");
  const [description, setDescription] = useState("");
  const [dateVal, setDateVal] = useState(today());
  const [photos, setPhotos] = useState<string[]>([]);

  const submit = async () => {
    const diagId = await db.plant_diagnostics.add({
      plantId, date: dateVal, status, severity, description,
    } as any);
    if (photos.length) {
      await db.diagnostic_images.bulkAdd(photos.map((imageDataUrl) => ({ diagnosticId: diagId as number, imageDataUrl })));
    }
    onClose();
  };

  return (
    <Modal title="Nouveau diagnostic" onClose={onClose}>
      <div className="form">
        <Field label="Date"><input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)} /></Field>
        <Field label="État constaté">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="sain">Sain</option>
            <option value="maladie">Maladie</option>
            <option value="ravageur">Ravageur</option>
            <option value="carence">Carence</option>
            <option value="stress hydrique">Stress hydrique</option>
            <option value="autre">Autre</option>
          </select>
        </Field>
        <Field label="Gravité">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="faible">Faible</option>
            <option value="modérée">Modérée</option>
            <option value="élevée">Élevée</option>
          </select>
        </Field>
        <div className="form-note">
          <p className="chip-label">💡 Solutions naturelles possibles (100 % permaculture) :</p>
          {(NATURAL_REMEDIES[status] ?? []).map((r, i) => (
            <p key={i} className="muted ritual">• {r}</p>
          ))}
          <p className="field-hint">Aucun produit chimique : JardinConnect ne propose que des remèdes naturels et préventifs.</p>
        </div>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Symptômes observés…" />
        </Field>
        <Field label="Photos" hint="Ajoutez une ou plusieurs photos de la plante">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              const urls = await Promise.all(files.map(resizeImage));
              setPhotos((prev) => [...prev, ...urls]);
            }}
          />
        </Field>
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={!description}>Créer</Button>
      </div>
    </Modal>
  );
}

function TreatmentForm({ plantId, onClose }: { plantId: number; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, unknown>>({
    plantId, date: today(), type: "bio",
  });
  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const submit = async () => {
    if (!values.product || !values.date) return;
    const clean = { ...values };
    for (const k of ["repeatAfterDays"]) {
      if (clean[k] === "" || clean[k] === undefined) delete clean[k];
      else {
        const n = Number(clean[k]);
        clean[k] = n;
        (clean as any).nextDueDate = new Date(new Date(String(values.date)).getTime() + n * 86_400_000).toISOString().slice(0, 10);
      }
    }
    if (clean.repeatAfterDays === undefined) delete clean.nextDueDate;
    await db.plant_treatments.add(clean as any);
    onClose();
  };

  return (
    <Modal title="Nouveau traitement" onClose={onClose}>
      <div className="form">
        <Field label="Date"><input type="date" value={String(values.date ?? today())} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Produit *">
          <input type="text" value={String(values.product ?? "")} onChange={(e) => set("product", e.target.value)} placeholder="ex. Purin d'ortie" />
        </Field>
        <Field label="Type" help="JardinConnect est une application 100 % naturelle : seuls les remèdes bio, préventifs ou mécaniques sont proposés (purin d'ortie, savon noir, décoction de prêle, paillage, barrières physiques…). Aucun produit chimique n'est accepté en permaculture.">
          <select value={String(values.type ?? "bio")} onChange={(e) => set("type", e.target.value)}>
            <option value="bio">Bio</option>
            <option value="préventif">Préventif</option>
            <option value="mécanique">Mécanique</option>
          </select>
        </Field>
        <Field label="Dose">
          <input type="text" value={String(values.dose ?? "")} onChange={(e) => set("dose", e.target.value)} placeholder="ex. 5 ml/L" />
        </Field>
        <Field label="À renouveler après (jours)" hint="Générera automatiquement une alerte de renouvellement">
          <input type="number" min={1} value={String(values.repeatAfterDays ?? "")} onChange={(e) => set("repeatAfterDays", e.target.value)} />
        </Field>
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={!values.product}>Créer</Button>
      </div>
    </Modal>
  );
}
