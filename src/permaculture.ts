import type { HarvestNeed, PlantSpecies } from "./db";

export const DENSITY_FACTOR = 1.5;

export function plantsForKg(sp: PlantSpecies, targetKg: number): number | null {
  if (!sp.yieldPerPlantKg || sp.yieldPerPlantKg <= 0) return null;
  return Math.max(1, Math.ceil(targetKg / sp.yieldPerPlantKg));
}

export function plantsForUnits(sp: PlantSpecies, targetUnits: number): number | null {
  if (!sp.yieldPerPlantUnits || sp.yieldPerPlantUnits <= 0) return null;
  return Math.max(1, Math.ceil(targetUnits / sp.yieldPerPlantUnits));
}

export function plantsForNeed(sp: PlantSpecies, need: HarvestNeed): number | null {
  if (need.targetUnitsPerYear != null) return plantsForUnits(sp, need.targetUnitsPerYear);
  if (need.targetKgPerYear != null) return plantsForKg(sp, need.targetKgPerYear);
  return null;
}

export function unitNameOf(sp: PlantSpecies): string {
  return sp.unitName ?? "pièce";
}

export function needLabel(sp: PlantSpecies, need: HarvestNeed): string {
  if (need.targetUnitsPerYear != null) {
    return `${need.targetUnitsPerYear} ${unitNameOf(sp)}${need.targetUnitsPerYear > 1 ? "s" : ""}/an`;
  }
  if (need.targetKgPerYear != null) return `${need.targetKgPerYear} kg/an`;
  return "objectif ?";
}

export function surfaceFor(sp: PlantSpecies, count: number): number | null {
  if (!sp.spacingCm || sp.spacingCm <= 0) return null;
  const w = sp.spacingCm / 100;
  return Math.round(count * w * w * DENSITY_FACTOR * 10) / 10;
}

export function areIncompatible(a: PlantSpecies, b: PlantSpecies): boolean {
  if (a.id !== undefined && b.id !== undefined && a.id === b.id) return false;
  return a.companionBad.includes(b.commonName) || b.companionBad.includes(a.commonName);
}

export function conflictsInParcel(candidates: PlantSpecies[], existing: PlantSpecies[]): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (const e of existing) {
      if (areIncompatible(candidates[i], e)) {
        conflicts.push(`${candidates[i].commonName} ✕ ${e.commonName}`);
      }
    }
    for (let j = i + 1; j < candidates.length; j++) {
      if (areIncompatible(candidates[i], candidates[j])) {
        conflicts.push(`${candidates[i].commonName} ✕ ${candidates[j].commonName}`);
      }
    }
  }
  return [...new Set(conflicts)];
}
