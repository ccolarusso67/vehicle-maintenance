import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { MakeIndex, ModelData } from '../src/data/types.ts';
import {
  findQuickPickMake,
  findQuickPickModel,
  POPULAR_VEHICLES,
} from '../src/lib/vehicleQuickPick.ts';

const makes: MakeIndex[] = [
  { name: 'Ford', id: 'ford_coverage', models: 74, source: 'legacy' },
  { name: 'Chevrolet', id: 'chevrolet', models: 80, source: 'legacy' },
  { name: 'Ram', id: 'ram', models: 6, source: 'legacy' },
  { name: 'Toyota', id: 'toyota_coverage', models: 101, source: 'legacy' },
  { name: 'Honda', id: 'honda_coverage', models: 71, source: 'legacy' },
  { name: 'Tesla', id: 'tesla', models: 7, source: 'legacy' },
  { name: 'Jeep', id: 'jeep', models: 27, source: 'legacy' },
  { name: 'Nissan', id: 'nissan', models: 71, source: 'legacy' },
];

function model(name: string): ModelData {
  return { name, types: [] };
}

function readPublishedMakes(url: URL): MakeIndex[] {
  const parsed: unknown = JSON.parse(readFileSync(url, 'utf8'));
  assert.ok(Array.isArray(parsed), 'published make index should be an array');
  return parsed.map(entry => {
    assert.ok(entry && typeof entry === 'object', 'make entry should be an object');
    assert.ok('name' in entry && typeof entry.name === 'string', 'make name should be a string');
    assert.ok('id' in entry && typeof entry.id === 'string', 'make id should be a string');
    assert.ok('models' in entry && typeof entry.models === 'number', 'make model count should be a number');
    return { name: entry.name, id: entry.id, models: entry.models };
  });
}

function readPublishedModels(url: URL): Array<{ name: string }> {
  const parsed: unknown = JSON.parse(readFileSync(url, 'utf8'));
  assert.ok(parsed && typeof parsed === 'object', 'published make data should be an object');
  assert.ok('models' in parsed && Array.isArray(parsed.models), 'published make should contain models');
  return parsed.models.map(entry => {
    assert.ok(entry && typeof entry === 'object', 'model entry should be an object');
    assert.ok('name' in entry && typeof entry.name === 'string', 'model name should be a string');
    return { name: entry.name };
  });
}

test('all popular vehicles resolve against stable published make ids', () => {
  for (const quickPick of POPULAR_VEHICLES) {
    assert.ok(findQuickPickMake(makes, quickPick.makeId), `${quickPick.label} should resolve its make`);
  }
});

test('model matching selects one explicit generation identity instead of a substring', () => {
  const fordModels = [
    model('F-150 (2015-2020)'),
    model('F-150 (2021-2025)'),
    model('F-150 Lightning (2022- )'),
  ];

  assert.equal(findQuickPickModel(fordModels, 'f-150:2021')?.name, 'F-150 (2021-2025)');
});

test('an ambiguous or duplicate identity is not accepted', () => {
  const duplicateModels = [model('Civic XI, FE/FL (2021- )'), model('Civic XI, FE/FL (2021-2025)')];

  assert.equal(findQuickPickModel(duplicateModels, 'civic-xi-fe-slash-fl:2021'), undefined);
});

test('model matching excludes similarly named variants', () => {
  const fordModels = [model('F-150 Lightning (2022- )'), model('F-150 (2021-2025)')];
  const toyotaModels = [model('Camry Solara (2004-2008)'), model('Camry, XV80 (2024- )')];

  assert.equal(findQuickPickModel(fordModels, 'f-150:2021')?.name, 'F-150 (2021-2025)');
  assert.equal(findQuickPickModel(toyotaModels, 'camry-xv80:2024')?.name, 'Camry, XV80 (2024- )');
});

test('all popular vehicles resolve to the intended family in the published catalog', () => {
  const dataRoot = new URL('../public/data/', import.meta.url);
  const publishedMakes = readPublishedMakes(new URL('index.json', dataRoot));
  const expectedModels: Record<string, string> = {
    'Ford F-150': 'F-150 (2021-2025)',
    'Chevy Silverado': 'Silverado 1500 (2019-2025)',
    'Ram 1500': '1500 (2019- )',
    'Toyota Camry': 'Camry, XV80  (2024- )',
    'Toyota RAV4': 'RAV4, XA50 (2018- )',
    'Honda Civic': 'Civic XI, FE/FL (2021- )',
    'Honda CR-V': 'CR-V, RS3/RS4/RS5 (2022- )',
    'Tesla Model 3': 'Model 3 (2017- )',
    'Jeep Grand Cherokee': 'Grand Cherokee / Grand Cherokee L, WL (2021- )',
    'Nissan Rogue': 'Rogue, T33 (2020- )',
  };

  for (const quickPick of POPULAR_VEHICLES) {
    const make = findQuickPickMake(publishedMakes, quickPick.makeId);
    assert.ok(make, `${quickPick.label} should resolve a published make`);

    const models = readPublishedModels(new URL(`${make.id}.json`, dataRoot));
    assert.equal(
      findQuickPickModel(models, quickPick.modelKey)?.name,
      expectedModels[quickPick.label],
      `${quickPick.label} should resolve the intended current family`,
    );
  }
});
