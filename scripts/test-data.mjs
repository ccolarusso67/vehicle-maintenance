import { readFileSync, readdirSync } from 'fs';

const DATA_DIR = '/Users/carminecolarusso/Desktop/Claude/vehicle-maintenance/public/data';
const issues = [];
let totalMakes = 0;
let totalModels = 0;
let totalTypes = 0;
let totalFluids = 0;
let emptyModels = 0;
let emptyTypes = 0;
let emptyFluids = 0;
let missingProduct = 0;
let missingIcon = 0;
let invalidJson = 0;
let duplicateIds = 0;
let brokenRefs = 0;

// 1. Validate index.json
console.log('=== Testing index.json ===');
let index;
try {
  index = JSON.parse(readFileSync(`${DATA_DIR}/index.json`, 'utf8'));
  console.log(`  Makes in index: ${index.length}`);
} catch (e) {
  console.error('  FATAL: index.json is invalid JSON!', e.message);
  process.exit(1);
}

// Check for duplicate IDs
const idSet = new Set();
for (const make of index) {
  if (idSet.has(make.id)) {
    issues.push(`Duplicate ID in index.json: "${make.id}" (${make.name})`);
    duplicateIds++;
  }
  idSet.add(make.id);

  if (!make.name || !make.id) {
    issues.push(`Missing name or id in index entry: ${JSON.stringify(make)}`);
  }
  if (make.models === 0) {
    issues.push(`Zero models for make: ${make.name}`);
  }
}

// 2. Validate each make JSON file
console.log('\n=== Testing individual make files ===');
const files = readdirSync(DATA_DIR).filter(f => f !== 'index.json' && f.endsWith('.json'));
console.log(`  JSON files found: ${files.length}`);

// Check all index entries have corresponding files
for (const entry of index) {
  const expectedFile = `${entry.id}.json`;
  if (!files.includes(expectedFile)) {
    issues.push(`Missing file for index entry: ${entry.name} (expected ${expectedFile})`);
    brokenRefs++;
  }
}

// Check all files are referenced in index
const indexIds = new Set(index.map(m => m.id));
for (const file of files) {
  const id = file.replace('.json', '');
  if (!indexIds.has(id)) {
    issues.push(`Orphan file not in index: ${file}`);
  }
}

// Validate each file
for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(`${DATA_DIR}/${file}`, 'utf8'));
  } catch (e) {
    issues.push(`Invalid JSON in ${file}: ${e.message}`);
    invalidJson++;
    continue;
  }

  totalMakes++;

  if (!data.make) {
    issues.push(`${file}: missing "make" field`);
  }
  if (!data.models || !Array.isArray(data.models)) {
    issues.push(`${file}: missing or invalid "models" array`);
    continue;
  }
  if (data.models.length === 0) {
    issues.push(`${file}: empty models array for ${data.make}`);
    emptyModels++;
    continue;
  }

  // Check model count matches index
  const indexEntry = index.find(m => `${m.id}.json` === file);
  if (indexEntry && indexEntry.models !== data.models.length) {
    issues.push(`${file}: index says ${indexEntry.models} models, file has ${data.models.length}`);
  }

  for (const model of data.models) {
    totalModels++;
    if (!model.name) {
      issues.push(`${file}: model missing name`);
    }
    if (!model.types || model.types.length === 0) {
      issues.push(`${file}: model "${model.name}" has no types`);
      emptyTypes++;
      continue;
    }

    for (const type of model.types) {
      totalTypes++;
      if (!type.name) {
        issues.push(`${file}: type missing name in model "${model.name}"`);
      }
      if (!type.fluids || type.fluids.length === 0) {
        issues.push(`${file}: type "${type.name}" has no fluids`);
        emptyFluids++;
        continue;
      }

      for (const fluid of type.fluids) {
        totalFluids++;

        // Check required fields
        if (!fluid.n) {
          issues.push(`${file}: fluid missing name (n) in type "${type.name}"`);
        }
        if (!fluid.ic) {
          missingIcon++;
        }

        // Check product mapping
        if (!fluid.p || fluid.p === '') {
          missingProduct++;
        }

        // Check for numeric-only product names (unmapped from xlsx)
        if (fluid.p && /^\d+$/.test(fluid.p)) {
          // These are product codes that weren't mapped
          missingProduct++;
        }

        // Check for weird characters/encoding issues
        if (fluid.n && /[\x00-\x08\x0e-\x1f]/.test(fluid.n)) {
          issues.push(`${file}: fluid "${fluid.n}" has control characters`);
        }
        if (fluid.p && /[\x00-\x08\x0e-\x1f]/.test(fluid.p)) {
          issues.push(`${file}: product "${fluid.p}" has control characters`);
        }
      }
    }
  }
}

// 3. Summary
console.log('\n═══════════════════════════════════════');
console.log('         DATA VALIDATION RESULTS');
console.log('═══════════════════════════════════════\n');

console.log('Statistics:');
console.log(`  Makes:          ${totalMakes}`);
console.log(`  Models:         ${totalModels}`);
console.log(`  Vehicle types:  ${totalTypes}`);
console.log(`  Total fluids:   ${totalFluids}`);
console.log('');

console.log('Issues found:');
console.log(`  Invalid JSON files:       ${invalidJson}`);
console.log(`  Duplicate IDs:            ${duplicateIds}`);
console.log(`  Broken index references:  ${brokenRefs}`);
console.log(`  Empty models:             ${emptyModels}`);
console.log(`  Empty types:              ${emptyTypes}`);
console.log(`  Empty fluids:             ${emptyFluids}`);
console.log(`  Missing product mapping:  ${missingProduct}`);
console.log(`  Missing icons:            ${missingIcon}`);
console.log('');

if (issues.length > 0) {
  console.log(`\nDetailed issues (${issues.length} total):`);
  // Group by severity
  const criticalIssues = issues.filter(i => i.includes('FATAL') || i.includes('Invalid JSON') || i.includes('Missing file'));
  const warningIssues = issues.filter(i => !criticalIssues.includes(i));

  if (criticalIssues.length > 0) {
    console.log('\n  CRITICAL:');
    criticalIssues.forEach(i => console.log(`    ❌ ${i}`));
  }
  if (warningIssues.length > 0) {
    console.log(`\n  WARNINGS (showing first 30 of ${warningIssues.length}):`);
    warningIssues.slice(0, 30).forEach(i => console.log(`    ⚠️  ${i}`));
    if (warningIssues.length > 30) {
      console.log(`    ... and ${warningIssues.length - 30} more`);
    }
  }
} else {
  console.log('  ✅ No issues found!');
}

// 4. Sample data check - pick a few random makes and show their structure
console.log('\n\n=== Sample Data Spot Checks ===');
const sampleMakes = ['toyota__usa_.json', 'bmw__eu_.json', 'ford__usa___can_.json', 'honda__usa_.json', 'audi__eu_.json'];
for (const file of sampleMakes) {
  try {
    const data = JSON.parse(readFileSync(`${DATA_DIR}/${file}`, 'utf8'));
    const modelCount = data.models.length;
    const typeCount = data.models.reduce((sum, m) => sum + m.types.length, 0);
    const fluidCount = data.models.reduce((sum, m) => sum + m.types.reduce((s, t) => s + t.fluids.length, 0), 0);
    const mappedCount = data.models.reduce((sum, m) => sum + m.types.reduce((s, t) => s + t.fluids.filter(f => f.u1pSku).length, 0), 0);
    console.log(`  ${data.make}: ${modelCount} models, ${typeCount} types, ${fluidCount} fluids, ${mappedCount} with Ultra1Plus SKU`);

    // Show one sample fluid
    const firstType = data.models[0]?.types[0];
    if (firstType?.fluids[0]) {
      const f = firstType.fluids[0];
      console.log(`    Sample: ${f.n} → "${f.p}" (SKU: ${f.u1pSku || 'none'}, Ravenol: ${f.ravenol || 'none'})`);
    }
  } catch {
    console.log(`  ${file}: NOT FOUND`);
  }
}
