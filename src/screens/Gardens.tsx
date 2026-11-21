import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { EntityList, refOptions } from "../components/EntityList";

const typeOpts = [
  { value: "potager", label: "Potager" },
  { value: "serre", label: "Serre" },
  { value: "verger", label: "Verger" },
  { value: "massif", label: "Massif" },
  { value: "pelouse", label: "Pelouse" },
  { value: "autre", label: "Autre" },
];

const sunOpts = [
  { value: "plein soleil", label: "Plein soleil" },
  { value: "mi-ombre", label: "Mi-ombre" },
  { value: "ombre", label: "Ombre" },
];

const textureOpts = [
  { value: "argileux", label: "Argileux" },
  { value: "limoneux", label: "Limoneux" },
  { value: "sableux", label: "Sableux" },
  { value: "caillouteux", label: "Caillouteux" },
  { value: "humifère", label: "Humifère" },
  { value: "mixte", label: "Mixte" },
];

const drainageOpts = [
  { value: "bon", label: "Bon" },
  { value: "moyen", label: "Moyen" },
  { value: "mauvais", label: "Mauvais" },
];

export function GardensScreen() {
  const gardens = useLiveQuery(() => db.gardens.toArray());
  const gardenOpts = refOptions(gardens);

  return (
    <div>
      <EntityList
        table={db.gardens}
        title="🌍 Mes jardins"
        emptyText="Ajoutez votre premier jardin : nom, lieu, surface."
        toTitle={(g) => g.name}
        toSubtitle={(g) => [g.location, g.surfaceM2 ? `${g.surfaceM2} m²` : null].filter(Boolean).join(" · ")}
        fields={[
          { name: "name", label: "Nom du jardin", type: "text", required: true },
          { name: "location", label: "Localisation", type: "text", placeholder: "ex. Toulouse" },
          { name: "latitude", label: "Latitude", type: "number", step: 0.0001 },
          { name: "longitude", label: "Longitude", type: "number", step: 0.0001 },
          { name: "surfaceM2", label: "Surface (m²)", type: "number", step: 0.1 },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        defaultValues={{ createdAt: new Date().toISOString() }}
      />

      <EntityList
        table={db.garden_zones}
        title="▦ Parcelles et surfaces"
        emptyText="Découpez un jardin en parcelles : potager, serre, verger…"
        toTitle={(z) => z.name}
        toSubtitle={(z) => `${z.type}${z.surfaceM2 ? ` · ${z.surfaceM2} m²` : ""}${z.sunExposure ? ` · ${z.sunExposure}` : ""}`}
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "name", label: "Nom de la parcelle", type: "text", required: true },
          { name: "type", label: "Type", type: "select", required: true, options: typeOpts },
          { name: "surfaceM2", label: "Surface (m²)", type: "number", step: 0.1 },
          { name: "sunExposure", label: "Exposition", type: "select", options: sunOpts },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />

      <EntityList
        table={db.soil_profiles}
        title="🧪 Profils de sol"
        emptyText="Décrivez la nature du sol (idéal après une analyse)."
        toTitle={(s) => s.name}
        toSubtitle={(s) => [s.texture, s.ph ? `pH ${s.ph}` : null, s.drainage ? `drainage ${s.drainage}` : null].filter(Boolean).join(" · ")}
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "name", label: "Nom du profil", type: "text", required: true },
          { name: "texture", label: "Texture", type: "select", required: true, options: textureOpts },
          { name: "ph", label: "pH", type: "number", step: 0.1, hint: "Entre 0 et 14 (7 = neutre)" },
          { name: "drainage", label: "Drainage", type: "select", options: drainageOpts },
          { name: "organicMatterPct", label: "Matière organique (%)", type: "number", step: 0.1 },
          { name: "lastAnalysisDate", label: "Dernière analyse", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
