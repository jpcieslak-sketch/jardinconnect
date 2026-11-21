import Dexie, { type Table } from "dexie";

export interface Garden {
  id?: number;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  surfaceM2?: number;
  notes?: string;
  createdAt: string;
}

export interface GardenZone {
  id?: number;
  gardenId: number;
  name: string;
  type: "potager" | "serre" | "verger" | "massif" | "pelouse" | "autre";
  surfaceM2?: number;
  sunExposure?: "plein soleil" | "mi-ombre" | "ombre";
  notes?: string;
}

export interface SoilProfile {
  id?: number;
  gardenId: number;
  name: string;
  texture: "argileux" | "limoneux" | "sableux" | "caillouteux" | "humifère" | "mixte";
  ph?: number;
  drainage?: "bon" | "moyen" | "mauvais";
  organicMatterPct?: number;
  lastAnalysisDate?: string;
  notes?: string;
}

export type SpeciesCategory =
  | "légume"
  | "aromate"
  | "fruit"
  | "fleur"
  | "engrais vert"
  | "arbuste";

export interface PlantSpecies {
  id?: number;
  commonName: string;
  latinName: string;
  category: SpeciesCategory;
  family: string;
  waterNeedMmPerWeek: number;
  sowingMonths: number[];
  underCoverMonths: number[];
  transplantMonths: number[];
  harvestMonths: number[];
  sun: "plein soleil" | "mi-ombre" | "ombre";
  spacingCm?: number;
  yieldPerPlantKg?: number;
  companionGood: string[];
  companionBad: string[];
  frostSensitive: boolean;
  cycleDays?: number;
  careAdvice: string;
}

export interface Plant {
  id?: number;
  zoneId: number;
  speciesId: number;
  nickname?: string;
  quantity: number;
  plantingDate: string;
  status: "pousse" | "mature" | "récolté" | "mort";
  lastWateredAt?: string;
  wateringIntervalDays?: number;
  notes?: string;
}

export interface HarvestNeed {
  id?: number;
  speciesId: number;
  targetKgPerYear: number;
  installedPlantIds?: number[];
  createdAt: string;
}

export interface WaterAsset {
  id?: number;
  gardenId: number;
  name: string;
  type: "citerne" | "puits" | "bassin" | "récupération pluie" | "robinet" | "autre";
  capacityL?: number;
  currentLevelL?: number;
  notes?: string;
}

export interface WaterReading {
  id?: number;
  waterAssetId: number;
  date: string;
  levelL: number;
  note?: string;
}

export interface IrrigationZone {
  id?: number;
  gardenId: number;
  zoneId?: number;
  name: string;
  method: "gomme-goutte" | "arroseur" | "micro-aspersion" | "manuel";
  waterAssetId?: number;
  flowLMin?: number;
  active: boolean;
}

export interface IrrigationEvent {
  id?: number;
  irrigationZoneId: number;
  date: string;
  durationMin: number;
  volumeL?: number;
  note?: string;
}

export interface Sensor {
  id?: number;
  gardenId: number;
  name: string;
  type: "humidité sol" | "température" | "humidité air" | "pluviomètre" | "niveau eau" | "autre";
  zoneId?: number;
  model?: string;
  active: boolean;
  lastReadingAt?: string;
  lastValue?: number;
}

export interface SensorReading {
  id?: number;
  sensorId: number;
  date: string;
  value: number;
  unit: string;
}

export interface WeatherRecord {
  id?: number;
  date: string;
  tempMinC?: number;
  tempMaxC?: number;
  rainMm: number;
  sunnyHours?: number;
  frost: boolean;
  source: string;
}

export interface PlantDiagnostic {
  id?: number;
  plantId: number;
  date: string;
  status: "sain" | "maladie" | "ravageur" | "carence" | "stress hydrique" | "autre";
  severity: "faible" | "modérée" | "élevée";
  description: string;
  conclusion?: string;
}

export interface DiagnosticImage {
  id?: number;
  diagnosticId: number;
  imageDataUrl: string;
  caption?: string;
}

export interface PlantTreatment {
  id?: number;
  diagnosticId?: number;
  plantId: number;
  date: string;
  product: string;
  type: "bio" | "préventif" | "mécanique";
  dose: string;
  repeatAfterDays?: number;
  nextDueDate?: string;
  notes?: string;
}

export interface AlertRecord {
  id?: number;
  key: string;
  date: string;
  severity: "info" | "attention" | "urgent";
  title: string;
  detail: string;
  dismissed: boolean;
}

export interface DataSource {
  id?: number;
  name: string;
  kind: "référentiel botanique" | "météo" | "capteur" | "autre";
  origin: string;
  licence: string;
  importedAt: string;
  notes?: string;
}

export class JardinConnectDB extends Dexie {
  gardens!: Table<Garden, number>;
  garden_zones!: Table<GardenZone, number>;
  soil_profiles!: Table<SoilProfile, number>;
  plant_species!: Table<PlantSpecies, number>;
  plants!: Table<Plant, number>;
  harvest_needs!: Table<HarvestNeed, number>;
  water_assets!: Table<WaterAsset, number>;
  water_readings!: Table<WaterReading, number>;
  irrigation_zones!: Table<IrrigationZone, number>;
  irrigation_events!: Table<IrrigationEvent, number>;
  sensors!: Table<Sensor, number>;
  sensor_readings!: Table<SensorReading, number>;
  weather_records!: Table<WeatherRecord, number>;
  plant_diagnostics!: Table<PlantDiagnostic, number>;
  diagnostic_images!: Table<DiagnosticImage, number>;
  plant_treatments!: Table<PlantTreatment, number>;
  alerts!: Table<AlertRecord, number>;
  data_sources!: Table<DataSource, number>;

  constructor() {
    super("jardinconnect");
    this.version(2).stores({
      gardens: "++id, name",
      garden_zones: "++id, gardenId, name",
      soil_profiles: "++id, gardenId",
      plant_species: "++id, commonName, category, family",
      plants: "++id, zoneId, speciesId, status",
      harvest_needs: "++id, speciesId",
      water_assets: "++id, gardenId",
      water_readings: "++id, waterAssetId, date",
      irrigation_zones: "++id, gardenId, zoneId",
      irrigation_events: "++id, irrigationZoneId, date",
      sensors: "++id, gardenId, zoneId",
      sensor_readings: "++id, sensorId, date",
      weather_records: "++id, &date",
      plant_diagnostics: "++id, plantId, date",
      diagnostic_images: "++id, diagnosticId",
      plant_treatments: "++id, plantId, diagnosticId",
      alerts: "++id, &key, date",
      data_sources: "++id, kind",
    });
  }
}

export const db = new JardinConnectDB();

export const today = () => new Date().toISOString().slice(0, 10);

export function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, n: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function monthOf(iso: string): number {
  return new Date(iso).getMonth() + 1;
}

export const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
