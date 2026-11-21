import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { EntityList, refOptions } from "../components/EntityList";
import { Card } from "../components/ui";

const typeOpts = [
  { value: "citerne", label: "Citerne" },
  { value: "puits", label: "Puits" },
  { value: "bassin", label: "Bassin" },
  { value: "récupération pluie", label: "Récupération d'eau de pluie" },
  { value: "robinet", label: "Robinet" },
  { value: "autre", label: "Autre" },
];

const methodOpts = [
  { value: "gomme-goutte", label: "Goutte-à-goutte" },
  { value: "arroseur", label: "Arroseur" },
  { value: "micro-aspersion", label: "Micro-aspersion" },
  { value: "manuel", label: "Manuel" },
];

export function WaterScreen() {
  const gardens = useLiveQuery(() => db.gardens.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const assets = useLiveQuery(() => db.water_assets.toArray());
  const irrigationZones = useLiveQuery(() => db.irrigation_zones.toArray());
  const gardenOpts = refOptions(gardens);
  const zoneOpts = refOptions(zones);
  const assetOpts = refOptions(assets);
  const irrOpts = refOptions(irrigationZones);

  return (
    <div>
      <Card>
        <strong>💧 À quoi sert cet onglet ?</strong>
        <p className="muted">
          <strong>1️⃣ L'appli calcule vos besoins d'eau :</strong> chaque plante a son besoin (en litres par
          m² et par semaine), multiplié par la surface qu'elle occupe. Le total s'affiche sur l'accueil,
          carte « Besoin en eau vs vos réserves ».
        </p>
        <p className="muted">
          <strong>2️⃣ Vous comparez avec vos réserves :</strong> notez ici vos cuves, puits et bassins, et
          mettez leur niveau à jour de temps en temps. L'appli vous dit combien de jours d'autonomie il
          reste, vous alerte quand une cuve est presque vide, et encore plus fort si aucune pluie n'est
          prévue dans la semaine.
        </p>
        <p className="muted field-hint">
          Astuce : une cuve pleine et un sol paillé, c'est une semaine d'arrosage tranquille.
        </p>
      </Card>

      <EntityList
        table={db.water_assets}
        title="💧 Réserves d'eau (citernes, puits, bassins)"
        emptyText="Ajoutez une réserve d'eau pour suivre son niveau."
        toTitle={(w) => `${w.name} (${w.type})`}
        toSubtitle={(w) => {
          if (!w.capacityL) return w.currentLevelL !== undefined ? `${w.currentLevelL} L actuels` : "";
          const pct = w.currentLevelL !== undefined ? Math.round((w.currentLevelL / w.capacityL) * 100) : null;
          return `Capacité ${w.capacityL} L${pct !== null ? ` · ${pct} %` : " · niveau non renseigné"}`;
        }}
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "name", label: "Nom", type: "text", required: true, placeholder: "ex. Citerne nord" },
          { name: "type", label: "Type", type: "select", required: true, options: typeOpts },
          { name: "capacityL", label: "Capacité (L)", type: "number", step: 1, help: "Le volume total que peut contenir la réserve (écrit dessus : « 1 000 L », « m³ » = ×1000). Une cuve IBC standard = 1 000 L, une cuve murale classique = 200 à 400 L." },
          { name: "currentLevelL", label: "Niveau actuel (L)", type: "number", step: 1, help: "Ce qui reste aujourd'hui. Intérêt : l'appli vous alerte quand la cuve est presque vide, surtout si aucune pluie n'est prévue — vous pouvez ainsi décider de la configuration : prioriser quelles plantes arroser, demander un ajout d'eau…" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />

      <EntityList
        table={db.water_readings}
        title="📏 Mesures de niveau"
        emptyText="Notez l'évolution du niveau des réserves dans le temps."
        toTitle={(r) => `${r.levelL} L · ${r.date}`}
        toSubtitle={(r) => {
          const asset = (assets ?? []).find((a) => a.id === r.waterAssetId);
          return `${asset?.name ?? "?"}${r.note ? ` — ${r.note}` : ""}`;
        }}
        fields={[
          { name: "waterAssetId", label: "Réserve d'eau", type: "select", required: true, options: assetOpts },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "levelL", label: "Niveau relevé (L)", type: "number", required: true, step: 1 },
          { name: "note", label: "Note", type: "text" },
        ]}
      />

      <EntityList
        table={db.irrigation_zones}
        title="🚿 Secteurs d'arrosage"
        emptyText="Définissez vos zones d'arrosage (goutte-à-goutte, aspersion…) et leur source."
        toTitle={(i) => `${i.name} (${i.method})`}
        toSubtitle={(i) => {
          const asset = (assets ?? []).find((a) => a.id === i.waterAssetId);
          const zone = (zones ?? []).find((z) => z.id === i.zoneId);
          return [
            zone ? `parcelle : ${zone.name}` : null,
            asset ? `source : ${asset.name}` : null,
            i.flowLMin ? `${i.flowLMin} L/min` : null,
            i.active ? "actif" : "inactif",
          ].filter(Boolean).join(" · ");
        }}
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "zoneId", label: "Parcelle desservie", type: "select", options: zoneOpts },
          { name: "name", label: "Nom du secteur", type: "text", required: true },
          { name: "method", label: "Méthode", type: "select", required: true, options: methodOpts },
          { name: "waterAssetId", label: "Source d'eau", type: "select", options: assetOpts },
          { name: "flowLMin", label: "Débit (L/min)", type: "number", step: 0.1 },
          { name: "active", label: "Actif", type: "checkbox" },
        ]}
        defaultValues={{ active: true }}
      />

      <EntityList
        table={db.irrigation_events}
        title="🗓️ Historique des arrosages"
        emptyText="Chaque arrosage effectué est consigné ici (volume et durée)."
        toTitle={(e) => `${e.durationMin} min${e.volumeL ? ` · ${e.volumeL} L` : ""} · ${e.date}`}
        toSubtitle={(e) => {
          const irr = (irrigationZones ?? []).find((z) => z.id === e.irrigationZoneId);
          return `${irr?.name ?? "?"}${e.note ? ` — ${e.note}` : ""}`;
        }}
        fields={[
          { name: "irrigationZoneId", label: "Secteur d'arrosage", type: "select", required: true, options: irrOpts },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "durationMin", label: "Durée (min)", type: "number", required: true, step: 1 },
          { name: "volumeL", label: "Volume (L)", type: "number", step: 0.1, hint: "Optionnel : durée × débit, sinon à mesurer" },
          { name: "note", label: "Note", type: "text" },
        ]}
      />
    </div>
  );
}
