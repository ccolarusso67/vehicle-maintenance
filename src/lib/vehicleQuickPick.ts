import type { MakeIndex } from '@/data/types';

export interface PopularVehicle {
  make: string;
  model: string;
  label: string;
}

export const POPULAR_VEHICLES = [
  { make: 'Ford', model: 'F-150', label: 'Ford F-150' },
  { make: 'Chevrolet', model: 'Silverado 1500', label: 'Chevy Silverado' },
  { make: 'Ram', model: '1500', label: 'Ram 1500' },
  { make: 'Toyota', model: 'Camry', label: 'Toyota Camry' },
  { make: 'Toyota', model: 'RAV4', label: 'Toyota RAV4' },
  { make: 'Honda', model: 'Civic XI', label: 'Honda Civic' },
  { make: 'Honda', model: 'CR-V', label: 'Honda CR-V' },
  { make: 'Tesla', model: 'Model 3', label: 'Tesla Model 3' },
  { make: 'Jeep', model: 'Grand Cherokee', label: 'Jeep Grand Cherokee' },
  { make: 'Nissan', model: 'Rogue', label: 'Nissan Rogue' },
] satisfies readonly PopularVehicle[];

function normalizeMakeName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLocaleLowerCase('en-US');
}

function normalizeModelName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
}

function isModelFamilyMatch(modelName: string, requestedModel: string): boolean {
  const candidate = normalizeModelName(modelName);
  const requested = normalizeModelName(requestedModel);

  return candidate === requested
    || candidate.startsWith(`${requested} (`)
    || candidate.startsWith(`${requested},`)
    || candidate.startsWith(`${requested} /`);
}

interface NamedModel {
  name: string;
}

interface ModelRecency {
  openEnded: boolean;
  startYear: number;
  latestYear: number;
}

function modelRecency(name: string): ModelRecency {
  const years = name.match(/\b(?:19|20)\d{2}\b/g)?.map(Number) ?? [];
  return {
    openEnded: /\(\s*(?:19|20)\d{2}\s*-\s*\)/.test(name),
    startYear: years[0] ?? 0,
    latestYear: years.length > 0 ? Math.max(...years) : 0,
  };
}

function isMoreRecent(candidate: NamedModel, best: NamedModel): boolean {
  const candidateRecency = modelRecency(candidate.name);
  const bestRecency = modelRecency(best.name);

  if (candidateRecency.startYear !== bestRecency.startYear) {
    return candidateRecency.startYear > bestRecency.startYear;
  }
  if (candidateRecency.openEnded !== bestRecency.openEnded) {
    return candidateRecency.openEnded;
  }
  return candidateRecency.latestYear > bestRecency.latestYear;
}

export function findQuickPickMake(makes: MakeIndex[], requestedMake: string): MakeIndex | undefined {
  const normalizedRequest = normalizeMakeName(requestedMake);
  return makes.find(make => normalizeMakeName(make.name) === normalizedRequest);
}

export function findQuickPickModel<Model extends NamedModel>(
  models: Model[],
  requestedModel: string,
): Model | undefined {
  return models
    .filter(model => isModelFamilyMatch(model.name, requestedModel))
    .reduce<Model | undefined>((best, candidate) => {
      if (!best || isMoreRecent(candidate, best)) {
        return candidate;
      }
      return best;
    }, undefined);
}
