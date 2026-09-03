import assert from 'node:assert/strict';
import test from 'node:test';

import type { MakeIndex, VehicleModel } from '../src/data/types.ts';
import {
  findQuickPickMake,
  findQuickPickModel,
  POPULAR_VEHICLES,
} from '../src/lib/vehicleQuickPick.ts';

const makes: MakeIndex[] = [
  { name: 'Ford', id: 'ford_coverage', models: 74, source: 'legacy', coverage: 'mixed' },
  { name: 'Chevrolet', id: 'chevrolet', models: 80, source: 'legacy' },
  { name: 'Ram', id: 'ram', models: 6, source: 'legacy' },
  { name: 'Toyota', id: 'toyota_coverage', models: 101, source: 'legacy', coverage: 'mixed' },
  { name: 'Honda', id: 'honda_coverage', models: 71, source: 'legacy', coverage: 'mixed' },
  { name: 'Tesla', id: 'tesla', models: 7, source: 'legacy' },
  { name: 'Jeep', id: 'jeep', models: 27, source: 'legacy' },
  { name: 'Nissan', id: 'nissan', models: 71, source: 'legacy' },
];

function model(name: string): VehicleModel {
  return { name, types: [] };
}

test('all popular vehicles resolve against normalized LIVE make names', () => {
  for (const quickPick of POPULAR_VEHICLES) {
    assert.ok(findQuickPickMake(makes, quickPick.make), `${quickPick.label} should resolve its make`);
  }
});

test('model matching selects the intended current family instead of the first substring', () => {
  const fordModels = [
    model('F-150 (2015-2020)'),
    model('F-150 (2021-2025)'),
    model('F-150 Lightning (2022- )'),
  ];

  assert.equal(findQuickPickModel(fordModels, 'F-150')?.name, 'F-150 (2021-2025)');
});

test('an ambiguous Tesla query is not accepted', () => {
  const teslaModels = [model('Model 3 (2017- )'), model('Model S (2011- )'), model('Model Y (2020- )')];

  assert.equal(findQuickPickModel(teslaModels, 'Model'), undefined);
});
