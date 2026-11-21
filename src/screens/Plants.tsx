import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, daysSince, today, FRENCH_MONTHS } from "../db";
import { refOptions } from "../components/EntityList";
import { Button, Card, EmptyState, Field, Modal, SectionTitle } from "../components/ui";

export function PlantsScreen() {
  const plants = useLiveQuery(() => db.plants.toArray());
  const species = useLiveQuery(() => db.plant_species.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const diagnostics = useLiveQuery(() => db.plant_diagnostics.toArray());
  const treatments = useLiveQuery(() => db.plant_treatments.toArray());
  const images = useLiveQuery(() => db.diagnostic_images.toArray());

  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const speciesById = new Map((species ?? []).map((s) => [s.id!, s]));
  const zoneById = new Map((zones ?? []).map((z) => [z.id!, z]));

  const detailPlant = plants?.find((p) => p.id === detailId);
  const detailDiagnostics = (diagnostics ?? []).filter((d) => d.plantId === detailId);

  const waterNow = async (plantId: number) => {
    await db.plants.update(plantId, { lastWateredAt: today() });
  };

  return (
    <div>
      <div className="head-row">
        <SectionTitle>🌿 Mes plantations</SectionTitle>
        <Button onClick={() => setEditing({ quantity: 1, status: "pousse", plantingDate: today() })}>+ Planter</Button>
      </div>

      {(plants ?? []).length === 0 ? (
        <EmptyState text="Aucune plantation. Ajoutez votre première plante !" />
      ) : (
        <div className="list">
          {(plants ?? []).map((p) => {
            const sp = speciesById.get(p.speciesId);
            const zone = zoneById.get(p.zoneId);
            const since = daysSince(p.lastWateredAt);
            return (
              <Card key={p.id}>
                <button className="list-row-btn" onClick={() => setDetailId(p.id!)}>
                  <div className="list-text">
                    <strong>{p.nickname ?? sp?.commonName ?? "Plante"}</strong>
                    <span className="muted">
                      {sp?.commonName ?? "?"} · {zone?.name ?? "?"} · {p.status} · plante le {p.plantingDate}
                      {since !== null ? ` · arrosé il y a ${since} j` : " · jamais arrosé"}
                    </span>
                  </div>
                  <span className="chev">›</span>
                </button>
                <div className="row-actions">
                  <Button variant="small" onClick={() => waterNow(p.id!)}>💧 Arrosé aujourd'hui</Button>
                  <Button variant="small" onClick={() => setEditing({ ...p })}>Modifier</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <PlantForm
          row={editing}
          zoneOpts={refOptions(zones)}
          speciesOpts={refOptions(species, "commonName")}
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
  row, zoneOpts, speciesOpts, onClose,
}: {
  row: Record<string, unknown>;
  zoneOpts: { value: string; label: string }[];
  speciesOpts: { value: string; label: string }[];
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...row });
  const isNew = row.id === undefined;
  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const submit = async () => {
    if (!values.zoneId || !values.speciesId) return;
    const clean = { ...values };
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
        <Field label="Surnom" hint="ex. « Tomates cerises du mur »">
          <input type="text" value={String(values.nickname ?? "")} onChange={(e) => set("nickname", e.target.value)} />
        </Field>
        <Field label="Quantité">
          <input type="number" min={1} value={String(values.quantity ?? 1)} onChange={(e) => set("quantity", e.target.value)} />
        </Field>
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
        <Field label="Rythme d'arrosage (jours)" hint="Laisser vide pour utiliser le besoin de l'espèce">
          <input type="number" min={1} value={String(values.wateringIntervalDays ?? "")} onChange={(e) => set("wateringIntervalDays", e.target.value)} />
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
        <Field label="Type">
          <select value={String(values.type ?? "bio")} onChange={(e) => set("type", e.target.value)}>
            <option value="bio">Bio</option>
            <option value="préventif">Préventif</option>
            <option value="mécanique">Mécanique</option>
            <option value="chimique">Chimique</option>
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
