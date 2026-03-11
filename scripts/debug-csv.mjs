import { readFileSync } from 'fs';

const csv = readFileSync('/Users/carminecolarusso/Desktop/Claude/Ravenol-combined.csv', 'utf8');
const lines = csv.split('\n');

// Find header
let headerIdx = 14;
console.log('Header:', lines[headerIdx]);

// Check for hex-hash makeLabel values
let hexMakeLabels = 0;
let normalMakeLabels = 0;
const hexMakes = new Set();
const hexSamples = [];

for (let i = headerIdx + 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const fields = line.split(',');
  const makeLabel = fields[1];

  if (makeLabel && /^[0-9a-f]{16}$/i.test(makeLabel.trim())) {
    hexMakeLabels++;
    hexMakes.add(makeLabel.trim());
    if (hexSamples.length < 5) {
      hexSamples.push(fields.slice(0, 8).join(' | '));
    }
  } else if (makeLabel && makeLabel.trim()) {
    normalMakeLabels++;
  }
}

console.log(`\nHex-hash makeLabel rows: ${hexMakeLabels}`);
console.log(`Normal makeLabel rows: ${normalMakeLabels}`);
console.log(`Unique hex makes: ${hexMakes.size}`);

console.log('\nHex makeLabel samples (full row first 8 fields):');
hexSamples.forEach(s => console.log('  ', s));

// Now check: do these hex makes exist with proper names elsewhere in the CSV?
// The hex value might be the makeId, and the real makeLabel might be shifted
console.log('\n\nChecking if hex makeLabels match any makeId from normal rows...');
const makeIdToLabel = new Map();
for (let i = headerIdx + 1; i < lines.length; i++) {
  const fields = lines[i].split(',');
  const makeId = fields[0];
  const makeLabel = fields[1];
  if (makeId && makeLabel && !/^[0-9a-f]{16}$/i.test(makeLabel.trim()) && makeLabel.trim()) {
    if (!makeIdToLabel.has(makeId.trim())) {
      makeIdToLabel.set(makeId.trim(), makeLabel.trim());
    }
  }
}

console.log(`Built makeId→makeLabel map with ${makeIdToLabel.size} entries`);
let matchCount = 0;
for (const hex of hexMakes) {
  const label = makeIdToLabel.get(hex);
  if (label) {
    matchCount++;
    console.log(`  ${hex} → ${label}`);
    if (matchCount >= 20) { console.log('  ... (showing first 20)'); break; }
  }
}
console.log(`Matched: ${matchCount} of ${hexMakes.size}`);
