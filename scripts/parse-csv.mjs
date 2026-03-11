import { createReadStream } from 'fs';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { createInterface } from 'readline';

const CSV_PATH = '/Users/carminecolarusso/Desktop/Claude/Ravenol-combined.csv';
const DATA_DIR = '/Users/carminecolarusso/Desktop/Claude/vehicle-maintenance/public/data';

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Map partName to a friendlier icon
function getPartIcon(partName) {
  const lower = partName.toLowerCase();
  if (lower.includes('engine')) return '🛢️';
  if (lower.includes('transmission') || lower.includes('transaxle') || lower.includes('gearbox')) return '⚙️';
  if (lower.includes('differential')) return '🔧';
  if (lower.includes('transfer')) return '🔧';
  if (lower.includes('cool')) return '❄️';
  if (lower.includes('brake') || lower.includes('clutch')) return '🛑';
  if (lower.includes('steering')) return '🔄';
  if (lower.includes('hydraulic actuation')) return '⚙️';
  return '💧';
}

// Parse capacities string
function parseCapacity(raw) {
  if (!raw) return '';
  return raw.replace(/\|/g, ', ').replace(/,(\d)/g, '.$1');
}

// Parse intervals
function parseInterval(raw) {
  if (!raw) return '';
  return raw.replace(/\|/g, ' / ');
}

// Sanitize string for use as filename
function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

async function main() {
  console.log('Parsing CSV...');

  // Structure: { makeLabel -> { modelLabel -> { typeLabel -> { partName -> fluidInfo } } } }
  const data = {};
  let lineCount = 0;
  let dataLines = 0;

  const rl = createInterface({
    input: createReadStream(CSV_PATH, 'utf8'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;
    if (lineCount <= 15) continue;
    if (!line.trim() || line.startsWith(',,,')) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 13) continue;

    const [makeId, makeLabel, modelId, modelLabel, typeId, typeLabel, partName, partCode, capacities, useType, intervals, productCode, productLabel] = fields;

    if (!makeLabel || !modelLabel || !typeLabel || !partName) continue;
    if (makeLabel === 'makeId' || makeLabel === 'makeLabel') continue;
    if (useType === 'Severe') continue;

    dataLines++;

    if (!data[makeLabel]) data[makeLabel] = {};
    if (!data[makeLabel][modelLabel]) data[makeLabel][modelLabel] = {};
    if (!data[makeLabel][modelLabel][typeLabel]) data[makeLabel][modelLabel][typeLabel] = {};

    const vehicleParts = data[makeLabel][modelLabel][typeLabel];

    if (!vehicleParts[partName]) {
      vehicleParts[partName] = {
        n: partName,
        c: parseCapacity(capacities),
        i: parseInterval(intervals),
        p: productLabel || '',
        ic: getPartIcon(partName),
      };
      if (partCode) vehicleParts[partName].pc = partCode;
    }
  }

  console.log(`Processed ${lineCount} lines, ${dataLines} data lines`);

  // Clean and create output directory
  try { rmSync(DATA_DIR, { recursive: true }); } catch {}
  mkdirSync(DATA_DIR, { recursive: true });

  // Write index.json - list of makes with model counts
  // Ensure unique IDs by appending counter for duplicates
  const makes = Object.keys(data).sort();
  const idCount = {};
  const index = makes.map(make => {
    let id = sanitize(make);
    if (idCount[id] !== undefined) {
      idCount[id]++;
      id = `${id}_${idCount[id]}`;
    } else {
      idCount[id] = 0;
    }
    return { name: make, id, models: Object.keys(data[make]).length };
  });
  writeFileSync(`${DATA_DIR}/index.json`, JSON.stringify(index));
  console.log(`Wrote index.json (${makes.length} makes)`);

  // Write per-make files with all models/types/fluids
  const idMap = Object.fromEntries(index.map(m => [m.name, m.id]));
  let totalVehicles = 0;
  for (const make of makes) {
    const makeId = idMap[make];
    const models = Object.keys(data[make]).sort();
    const makeData = {
      make,
      models: models.map(model => {
        const types = Object.keys(data[make][model]).sort();
        return {
          name: model,
          types: types.map(type => {
            totalVehicles++;
            return {
              name: type,
              fluids: Object.values(data[make][model][type]),
            };
          }),
        };
      }),
    };

    const json = JSON.stringify(makeData);
    writeFileSync(`${DATA_DIR}/${makeId}.json`, json);
  }

  console.log(`Wrote ${makes.length} make files, ${totalVehicles} vehicle configs total`);

  // Print size info
  const { readdirSync, statSync } = await import('fs');
  const files = readdirSync(DATA_DIR);
  let totalSize = 0;
  for (const f of files) {
    totalSize += statSync(`${DATA_DIR}/${f}`).size;
  }
  console.log(`Total data size: ${(totalSize / 1024 / 1024).toFixed(2)} MB across ${files.length} files`);

  // Print largest files
  const sizes = files.map(f => ({ name: f, size: statSync(`${DATA_DIR}/${f}`).size }));
  sizes.sort((a, b) => b.size - a.size);
  console.log('\nLargest files:');
  for (const s of sizes.slice(0, 10)) {
    console.log(`  ${s.name}: ${(s.size / 1024).toFixed(1)} KB`);
  }
}

main().catch(console.error);
