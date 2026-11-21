import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { EntityList, refOptions } from "../components/EntityList";

const typeOpts = [
  { value: "humidité sol", label: "Humidité du sol" },
  { value: "température", label: "Température" },
  { value: "humidité air", label: "Humidité de l'air" },
  { value: "pluviomètre", label: "Pluviomètre" },
  { value: "niveau eau", label: "Niveau d'eau" },
  { value: "autre", label: "Autre" },
];

export function SensorsScreen() {
  const gardens = useLiveQuery(() => db.gardens.toArray());
  const zones = useLiveQuery(() => db.garden_zones.toArray());
  const sensors = useLiveQuery(() => db.sensors.toArray());
  const gardenOpts = refOptions(gardens);
  const zoneOpts = refOptions(zones);
  const sensorOpts = refOptions(sensors);

  return (
    <div>
      <EntityList
        table={db.sensors}
        title="📡 Capteurs connectés"
        emptyText="Déclarez vos capteurs (humidité du sol, température…) pour les suivre ici."
        toTitle={(s) => `${s.name} (${s.type})`}
        toSubtitle={(s) =>
          [
            (zones ?? []).find((z) => z.id === s.zoneId)?.name,
            s.lastValue !== undefined ? `dernière valeur : ${s.lastValue}` : null,
            s.active ? "actif" : "inactif",
          ].filter(Boolean).join(" · ")
        }
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "zoneId", label: "Parcelle", type: "select", options: zoneOpts },
          { name: "name", label: "Nom du capteur", type: "text", required: true },
          { name: "type", label: "Type", type: "select", required: true, options: typeOpts },
          { name: "model", label: "Modèle", type: "text" },
          { name: "active", label: "Actif", type: "checkbox" },
          { name: "lastValue", label: "Dernière valeur", type: "number", step: 0.1, hint: "Pour humidité du sol, en %" },
        ]}
        defaultValues={{ active: true }}
      />

      <EntityList
        table={db.sensor_readings}
        title="📈 Mesures des capteurs"
        emptyText="Chaque mesure prise (manuelle ou relevée) est consignée ici."
        toTitle={(r) => `${r.value} ${r.unit} · ${r.date}`}
        toSubtitle={(r) => {
          const sensor = (sensors ?? []).find((s) => s.id === r.sensorId);
          return sensor?.name ?? "?";
        }}
        fields={[
          { name: "sensorId", label: "Capteur", type: "select", required: true, options: sensorOpts },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "value", label: "Valeur", type: "number", required: true, step: 0.1 },
          { name: "unit", label: "Unité", type: "text", required: true, placeholder: "%, °C, mm…" },
        ]}
      />

      <EntityList
        table={db.weather_records}
        title="🌤️ Relevés météo"
        emptyText="Notez la météo : le moteur d'alertes l'utilise (gel, fortes pluies)."
        toTitle={(w) => `${w.date} · ${w.rainMm} mm`}
        toSubtitle={(w) =>
          [
            w.tempMinC !== undefined && w.tempMaxC !== undefined ? `${w.tempMinC}–${w.tempMaxC} °C` : null,
            w.sunnyHours !== undefined ? `${w.sunnyHours} h de soleil` : null,
            w.frost ? "gel" : null,
            w.source,
          ].filter(Boolean).join(" · ")
        }
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "tempMinC", label: "Température min (°C)", type: "number", step: 0.1 },
          { name: "tempMaxC", label: "Température max (°C)", type: "number", step: 0.1 },
          { name: "rainMm", label: "Pluie (mm)", type: "number", required: true, step: 0.1 },
          { name: "sunnyHours", label: "Heures de soleil", type: "number", step: 0.5 },
          { name: "frost", label: "Gel constaté/prévu", type: "checkbox" },
          { name: "source", label: "Source", type: "text", placeholder: "ex. station locale, Météo-France" },
        ]}
        defaultValues={{ frost: false, source: "saisie manuelle" }}
      />
    </div>
  );
}
