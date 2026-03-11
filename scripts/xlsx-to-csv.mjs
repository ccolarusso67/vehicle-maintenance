import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import XLSX from 'xlsx';

const BASE = '/Users/carminecolarusso/Desktop/Claude';
const COMBINED_CSV = `${BASE}/Ravenol-combined.csv`;

// Write the standard header block that parse-csv.mjs expects (15 lines before data)
const headerLines = [
  '', '', '', '', '', '', '', '', '', '', '', '', '', '',
  'makeId,makeLabel,modelId,modelLabel,typeId,typeLabel,partName,partCode,capacities,useType,intervals,productCode,productLabel'
];
writeFileSync(COMBINED_CSV, headerLines.join('\n') + '\n', 'utf8');
console.log('Created combined CSV with header');

// Track unique rows for dedup
const seen = new Set();
let totalRows = 0;
let newRows = 0;

function processFile(filePath, label) {
  console.log(`\nProcessing ${label}...`);
  const wb = XLSX.readFile(filePath, { type: 'file', dense: false });

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'Statistics') {
      console.log(`  Skipping Statistics sheet`);
      continue;
    }

    console.log(`  Converting sheet "${sheetName}"...`);
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
    const lines = csv.split('\n');

    // Find header row
    let headerIdx = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes('makeId') && lines[i].includes('makeLabel')) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      console.log(`    No data header found, skipping`);
      continue;
    }

    // Process data rows
    let sheetRows = 0;
    let sheetNew = 0;
    const batch = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',,,')) continue;

      // Quick dedup key: first 7 fields (make through partName)
      const firstCommas = [];
      let pos = 0;
      let inQ = false;
      for (let j = 0; j < line.length && firstCommas.length < 7; j++) {
        if (line[j] === '"') inQ = !inQ;
        else if (line[j] === ',' && !inQ) firstCommas.push(j);
      }
      const key = firstCommas.length >= 6 ? line.substring(0, firstCommas[6]) : line.substring(0, 200);

      sheetRows++;
      if (!seen.has(key)) {
        seen.add(key);
        batch.push(line);
        sheetNew++;
      }
    }

    if (batch.length > 0) {
      appendFileSync(COMBINED_CSV, batch.join('\n') + '\n', 'utf8');
    }

    totalRows += sheetRows;
    newRows += sheetNew;
    console.log(`    ${sheetRows} rows, ${sheetNew} new unique rows added`);
  }
}

// Process existing CSV first (it's the baseline)
console.log('Processing Ravenol rev.csv...');
const csvContent = readFileSync(`${BASE}/Ravenol rev.csv`, 'utf8');
const csvLines = csvContent.split('\n');
let csvHeaderIdx = -1;
for (let i = 0; i < Math.min(20, csvLines.length); i++) {
  if (csvLines[i].includes('makeId') && csvLines[i].includes('makeLabel')) {
    csvHeaderIdx = i;
    break;
  }
}

let csvBatch = [];
let csvCount = 0;
for (let i = csvHeaderIdx + 1; i < csvLines.length; i++) {
  const line = csvLines[i].trim();
  if (!line || line.startsWith(',,,')) continue;

  const firstCommas = [];
  let pos = 0;
  let inQ = false;
  for (let j = 0; j < line.length && firstCommas.length < 7; j++) {
    if (line[j] === '"') inQ = !inQ;
    else if (line[j] === ',' && !inQ) firstCommas.push(j);
  }
  const key = firstCommas.length >= 6 ? line.substring(0, firstCommas[6]) : line.substring(0, 200);

  if (!seen.has(key)) {
    seen.add(key);
    csvBatch.push(line);
    csvCount++;
  }

  // Write in batches of 50K
  if (csvBatch.length >= 50000) {
    appendFileSync(COMBINED_CSV, csvBatch.join('\n') + '\n', 'utf8');
    csvBatch = [];
  }
}
if (csvBatch.length > 0) {
  appendFileSync(COMBINED_CSV, csvBatch.join('\n') + '\n', 'utf8');
}
totalRows += csvCount;
newRows += csvCount;
console.log(`  ${csvCount} rows from CSV`);

// Now process XLSX files for additional data
processFile(`${BASE}/Ravenol.xlsx`, 'Ravenol.xlsx');
processFile(`${BASE}/Ravenol-2.xlsx`, 'Ravenol-2.xlsx');

console.log(`\n=== Summary ===`);
console.log(`Total rows processed: ${totalRows}`);
console.log(`Unique rows in combined CSV: ${newRows}`);
console.log(`Output: ${COMBINED_CSV}`);
