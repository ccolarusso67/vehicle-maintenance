import { readFileSync } from 'fs';

const DATA_DIR = '/Users/carminecolarusso/Desktop/Claude/vehicle-maintenance/public/data';
const index = JSON.parse(readFileSync(`${DATA_DIR}/index.json`, 'utf8'));

// Show all hash-ID makes with their actual names
const hashLike = index.filter(m => /^[0-9a-f]{16}$/.test(m.id));
console.log(`Hash-ID makes (${hashLike.length}):\n`);
hashLike.forEach(m => {
  // Show char codes for the name
  const codes = [...m.name].map(c => c.charCodeAt(0) > 127 ? `U+${c.charCodeAt(0).toString(16).toUpperCase()}` : c).join('');
  console.log(`  "${m.name}" → id: ${m.id} (models: ${m.models})`);
});

// Also check: what does Toyota look like in the combined CSV?
console.log('\n\n=== Searching combined CSV for Toyota/Mercedes/VW ===');
const csv = readFileSync('/Users/carminecolarusso/Desktop/Claude/Ravenol-combined.csv', 'utf8');
const lines = csv.split('\n');
const found = new Set();
for (const line of lines) {
  const lower = line.toLowerCase();
  if (lower.includes('toyota') || lower.includes('mercedes') || lower.includes('volkswagen')) {
    // Extract makeLabel (field index 1)
    const fields = line.split(',');
    if (fields[1] && !found.has(fields[1])) {
      found.add(fields[1]);
      console.log(`  makeLabel: "${fields[1]}"`);
    }
  }
}
if (found.size === 0) console.log('  Not found in CSV');

// Check for numeric product codes - what do they look like?
console.log('\n\n=== Sample numeric product codes ===');
let count = 0;
for (const line of lines) {
  const fields = line.split(',');
  if (fields[12] && /^\d+$/.test(fields[12].trim()) && count < 10) {
    console.log(`  Make: ${fields[1]}, Part: ${fields[6]}, ProductCode: ${fields[11]}, ProductLabel: ${fields[12]}`);
    count++;
  }
}
