import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { EntityList, refOptions } from "../components/EntityList";

const typeOpts = [
  { value: "potager", label: "Potager" },
  { value: "serre", label: "Serre / tunnel" },
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

const typeLabels: Record<string, string> = {
  potager: "Potager",
  serre: "Serre / tunnel",
  verger: "Verger",
  massif: "Massif",
  pelouse: "Pelouse",
  autre: "Autre",
};

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
          {
            name: "latitude", label: "Latitude", type: "number", step: 0.0001,
            help: "Indispensable pour la météo réelle. Comment l'obtenir : ouvrez Google Maps, appuyez longuement (ou clic droit) sur votre jardin — un petit menu montre deux nombres comme 43,6047 ; 1,4442. Le premier est la latitude, le second la longitude. Tapez-les ici avec un point (43.6047).",
          },
          {
            name: "longitude", label: "Longitude", type: "number", step: 0.0001,
            help: "Indispensable pour la météo réelle. C'est le deuxième nombre donné par Google Maps (ex. 1.4442 pour Toulouse, négatif à l'ouest de Greenwich, ex. -1.55 pour Nantes).",
          },
          {
            name: "surfaceM2", label: "Surface (m²)", type: "number", step: 0.1,
            help: "Surface totale du jardin. Une longueur × largeur : par exemple 10 m × 4 m = 40 m². L'appli l'utilise pour dire combien de plants vous pouvez accueillir.",
          },
          {
            name: "climateType", label: "Type de climat (optionnel)", type: "select",
            options: [
              { value: "", label: "— ne précise pas —" },
              { value: "océanique", label: "Océanique (hivers doux, étés tempérés)" },
              { value: "continental", label: "Continental (hivers froids, étés chauds)" },
              { value: "méditerranéen", label: "Méditerranéen (étés secs et chauds)" },
              { value: "montagne", label: "Montagne (gelées fortes et longues)" },
              { value: "tropical", label: "Tropical / subtropical" },
            ],
            help: "Optionnel. Il sert à déconseiller les plantes inadaptées à votre région : montagne = attention aux gelées, méditerranéen = attention aux plantes très gourmandes en eau en été.",
          },
          {
            name: "avgRainMmPerYear", label: "Précipitations moyennes (mm/an, optionnel)", type: "number",
            help: "Optionnel. Cherchez « précipitations mm par an » + votre ville. Repères : 600 mm = sec, 800-1000 mm = moyen, plus de 1200 mm = humide.",
          },
          {
            name: "summerTempMaxC", label: "Température max estivale (°C, optionnel)", type: "number",
            help: "Optionnel. Le maximum habituel en plein été (ex. 32). Au-dessus de 35 °C, l'appli vous préviendra pour les plantes qui souffrent en canicule.",
          },
          {
            name: "winterTempMinC", label: "Température min hivernale (°C, optionnel)", type: "number",
            help: "Optionnel. Le minimum habituel en hiver (ex. -5). L'appli l'utilise pour prévenir quelles plantes gèleront chez vous.",
          },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        defaultValues={{ createdAt: new Date().toISOString() }}
      />

      <EntityList
        table={db.garden_zones}
        title="▦ Parcelles et surfaces"
        emptyText="Découpez un jardin en parcelles : potager, serre, verger…"
        toTitle={(z) => z.name}
        toSubtitle={(z) => `${typeLabels[z.type] ?? z.type}${z.surfaceM2 ? ` · ${z.surfaceM2} m²` : ""}${z.sunExposure ? ` · ${z.sunExposure}` : ""}`}
        fields={[
          { name: "gardenId", label: "Jardin", type: "select", required: true, options: gardenOpts },
          { name: "name", label: "Nom de la parcelle", type: "text", required: true },
          { name: "type", label: "Type", type: "select", required: true, options: typeOpts },
          { name: "surfaceM2", label: "Surface (m²)", type: "number", step: 0.1, help: "Longueur × largeur de la parcelle (ex. 4 m × 1,2 m = 4,8 m²). Comparée à la place nécessaire de vos besoins de récolte dans l'onglet Objectifs." },
          { name: "sunExposure", label: "Exposition", type: "select", options: sunOpts, help: "Plein soleil : + de 6 h de soleil direct par jour. Mi-ombre : 3 à 6 h. Ombre : moins de 3 h. Observez la parcelle une journée entière avant de répondre." },
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
          {
            name: "texture", label: "Texture", type: "select", required: true, options: textureOpts,
            help: "Deux tests faciles, sans analyse payante :\n\n🫙 LE TEST DU BOCAL — Remplissez un bocal transparent aux 2/3 d'eau, ajoutez une tasse de terre prise à 10 cm de profondeur (sans racines ni cailloux). Secouez énergiquement 2 minutes, laissez reposer 1 à 2 jours. Les couches se forment : sable en bas (dépôt immédiat), limon au milieu (2 h), argile en haut (1 à 2 jours). Mesurez les 3 épaisseurs (photo = plus facile) : plus de 45 % de sable = sol sableux, plus de 30 % d'argile = argileux, milieu dominé par le limon = limoneux.\n\n✋ LE TEST DU BOUDIN — Humectez un peu de terre et roulez-la dans la main : elle ne tient pas = sableux ; un boudin fragile qui casse vite = limoneux ; un boudin long, lisse, qui se plie sans casser = argileux.\n\nEn cas de doute, choisissez « Mixte » : la plupart des jardins sont des mélanges.",
          },
          {
            name: "ph", label: "pH", type: "number", step: 0.1, hint: "Entre 0 et 14 (7 = neutre)",
            help: "Mesure l'acidité du sol : 7 = neutre, en dessous = acide, au-dessus = calcaire. Un potager aime un pH entre 6 et 7,5. Mesure : kits pH vendus en jardinerie ou analyse de laboratoire (ex. analyses de terre en ligne, 20-30 €). Pas de valeur ? Laissez vide, ce n'est pas bloquant.",
          },
          { name: "drainage", label: "Drainage", type: "select", options: drainageOpts, help: "À quelle vitesse l'eau s'écoule ? Test simple : creusez un trou de 30 cm, remplissez-le d'eau. Vide en moins de 4 h = bon. Encore plein le lendemain = mauvais." },
          {
            name: "organicMatterPct", label: "Matière organique (%)", type: "number", step: 0.1,
            help: "La part de matière vivante (compost, humus) dans votre sol, donnée par une analyse de terre. Repère : 2 à 3 % est courant, plus de 5 % est excellent. En dessous de 2 %, apportez du compost. Pas d'analyse ? Laissez vide.",
          },
          { name: "lastAnalysisDate", label: "Dernière analyse", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
