import { readFileSync, readdirSync } from 'fs';

const DATA_DIR = '/Users/carminecolarusso/Desktop/Claude/vehicle-maintenance/public/data';
const index = JSON.parse(readFileSync(`${DATA_DIR}/index.json`, 'utf8'));

// Find key brands
console.log('=== Key Brand Search ===');
const targets = ['toyota', 'ford', 'honda', 'chevrolet', 'bmw', 'mercedes', 'volkswagen'];
for (const t of targets) {
  const matches = index.filter(m => m.name.toLowerCase().includes(t));
  console.log(`${t}: ${matches.map(m => `${m.name} (${m.id})`).join(', ') || 'NOT FOUND'}`);
}

// Check for hash-like IDs (sanitize() produced hashes for non-latin chars)
console.log('\n=== Makes with Hash-Like IDs ===');
const hashLike = index.filter(m => /^[0-9a-f]{16}$/.test(m.id));
console.log(`Count: ${hashLike.length}`);
hashLike.slice(0, 20).forEach(m => console.log(`  "${m.name}" → ${m.id}`));

// Product mapping analysis
console.log('\n=== Product Mapping Analysis ===');
let mapped = 0, numericProduct = 0, emptyProduct = 0, specialProduct = 0, unmappedRavenol = 0;
const unmappedProducts = new Set();
const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

for (const file of files) {
  const data = JSON.parse(readFileSync(`${DATA_DIR}/${file}`, 'utf8'));
  for (const model of data.models) {
    for (const type of model.types) {
      for (const fluid of type.fluids) {
        if (fluid.u1pSku) {
          mapped++;
        } else if (!fluid.p || fluid.p === '') {
          emptyProduct++;
        } else if (/^\d+$/.test(fluid.p)) {
          numericProduct++;
        } else if (fluid.p === 'Special Product') {
          specialProduct++;
        } else {
          unmappedRavenol++;
          unmappedProducts.add(fluid.p);
        }
      }
    }
  }
}

console.log(`  With Ultra1Plus SKU:              ${mapped}`);
console.log(`  Numeric product code (from xlsx):  ${numericProduct}`);
console.log(`  Empty product:                     ${emptyProduct}`);
console.log(`  Special Product:                   ${specialProduct}`);
console.log(`  Ravenol name but no U1P match:     ${unmappedRavenol}`);
console.log(`  Total fluids:                      ${mapped + numericProduct + emptyProduct + specialProduct + unmappedRavenol}`);

console.log(`\n=== Unmapped Ravenol Products (${unmappedProducts.size} unique) ===`);
const sorted = [...unmappedProducts].sort();
sorted.slice(0, 30).forEach(p => console.log(`  - ${p}`));
if (sorted.length > 30) console.log(`  ... and ${sorted.length - 30} more`);

// Check the live site's index endpoint
console.log('\n=== File Size Check ===');
let totalSize = 0;
const allFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
for (const f of allFiles) {
  totalSize += readFileSync(`${DATA_DIR}/${f}`).length;
}
console.log(`Total data: ${(totalSize / 1024 / 1024).toFixed(2)} MB across ${allFiles.length} files`);
