import type { MakeIndex } from '@/data/types';

export interface PopularVehicle {
  makeId: string;
  makeLabel: string;
  modelKey: string;
  label: string;
}

export const POPULAR_VEHICLES = [
  { makeId: 'ford_coverage', makeLabel: 'Ford', modelKey: 'f-150:2021', label: 'Ford F-150' },
  { makeId: 'chevrolet', makeLabel: 'Chevrolet', modelKey: 'silverado-1500:2019', label: 'Chevy Silverado' },
  { makeId: 'ram', makeLabel: 'Ram', modelKey: '1500:2019', label: 'Ram 1500' },
  { makeId: 'toyota_coverage', makeLabel: 'Toyota', modelKey: 'camry-xv80:2024', label: 'Toyota Camry' },
  { makeId: 'toyota_coverage', makeLabel: 'Toyota', modelKey: 'rav4-xa50:2018', label: 'Toyota RAV4' },
  { makeId: 'honda_coverage', makeLabel: 'Honda', modelKey: 'civic-xi-fe-slash-fl:2021', label: 'Honda Civic' },
  { makeId: 'honda_coverage', makeLabel: 'Honda', modelKey: 'cr-v-rs3-slash-rs4-slash-rs5:2022', label: 'Honda CR-V' },
  { makeId: 'tesla', makeLabel: 'Tesla', modelKey: 'model-3:2017', label: 'Tesla Model 3' },
  { makeId: 'jeep', makeLabel: 'Jeep', modelKey: 'grand-cherokee-slash-grand-cherokee-l-wl:2021', label: 'Jeep Grand Cherokee' },
  { makeId: 'nissan', makeLabel: 'Nissan', modelKey: 'rogue-t33:2020', label: 'Nissan Rogue' },
] satisfies readonly PopularVehicle[];

interface NamedModel {
  name: string;
}

function modelIdentityKey(name: string): string | undefined {
  const match = name.match(/^(.+?)\s*\(\s*((?:19|20)\d{2})\s*-.*\)\s*$/);
  if (!match) return undefined;

  const family = match[1]
    .trim()
    .toLocaleLowerCase('en-US')
    .replaceAll('/', ' slash ')
    .replaceAll('&', ' and ')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${family}:${match[2]}`;
}

export function findQuickPickMake(makes: MakeIndex[], requestedMakeId: string): MakeIndex | undefined {
  return makes.find(make => make.id === requestedMakeId);
}

export function findQuickPickModel<Model extends NamedModel>(
  models: Model[],
  requestedModelKey: string,
): Model | undefined {
  const matches = models.filter(model => modelIdentityKey(model.name) === requestedModelKey);
  return matches.length === 1 ? matches[0] : undefined;
}
