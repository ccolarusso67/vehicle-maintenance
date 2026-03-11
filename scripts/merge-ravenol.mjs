import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';

const BASE = '/Users/carminecolarusso/Desktop/Claude';
const OUTPUT = `${BASE}/Ravenol rev.csv`;

// Read existing CSV lines (skip header block)
function readCSVLines(path) {
  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');
  // Find the actual data header line (contains makeId,makeLabel,...)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    if (lines[i].includes('makeId') && lines[i].includes('makeLabel')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    // Try line 14 (0-indexed) as default
    headerIdx = 14;
  }
  console.log(`  CSV header found at line ${headerIdx + 1}`);
  const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() && !l.startsWith(',,,'));
  return { header: lines.slice(0, headerIdx + 1), dataLines };
}

// Read XLSX and convert to CSV-like lines
function readXLSX(path) {
  console.log(`  Reading ${path}...`);
  const wb = XLSX.readFile(path, { type: 'file' });
  const allRows = [];

  for (const sheetName of wb.SheetNames) {
    console.log(`    Sheet: "${sheetName}"`);
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
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
      console.log(`    No header found in sheet "${sheetName}", checking first few lines...`);
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        console.log(`      Line ${i}: ${lines[i].substring(0, 100)}`);
      }
      // Try treating first row as header if it has enough commas
      if (lines.length > 1 && lines[0].split(',').length >= 10) {
        headerIdx = 0;
        console.log(`    Using line 0 as header`);
      } else {
        console.log(`    Skipping sheet "${sheetName}"`);
        continue;
      }
    }

    const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() && !l.startsWith(',,,'));
    console.log(`    Found ${dataLines.length} data rows`);
    allRows.push(...dataLines);
  }

  return allRows;
}

// Create a unique key for deduplication
function lineKey(line) {
  // Use first 11 fields (up to intervals) as the dedup key
  const fields = [];
  let current = '';
  let inQuotes = false;
  let fieldCount = 0;

  for (let i = 0; i < line.length && fieldCount < 11; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      fieldCount++;
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());

  // Key: makeLabel + modelLabel + typeLabel + partName + partCode + capacities + useType
  return `${fields[1]}|${fields[3]}|${fields[5]}|${fields[6]}|${fields[7]}|${fields[8]}|${fields[9]}`;
}

async function main() {
  console.log('=== Merging Ravenol data files ===\n');

  // Step 1: Read existing CSV
  console.log('1. Reading Ravenol rev.csv...');
  const csv = readCSVLines(`${BASE}/Ravenol rev.csv`);
  console.log(`   ${csv.dataLines.length} existing data rows\n`);

  // Step 2: Build dedup set from existing data
  console.log('2. Building deduplication index...');
  const seen = new Set();
  for (const line of csv.dataLines) {
    seen.add(lineKey(line));
  }
  console.log(`   ${seen.size} unique keys from CSV\n`);

  // Step 3: Read XLSX files
  console.log('3. Reading Ravenol.xlsx...');
  const xlsx1Rows = readXLSX(`${BASE}/Ravenol.xlsx`);

  console.log('\n4. Reading Ravenol-2.xlsx...');
  const xlsx2Rows = readXLSX(`${BASE}/Ravenol-2.xlsx`);

  // Step 4: Find new rows from XLSX files
  console.log('\n5. Finding new/unique rows from XLSX files...');
  let newRows = 0;
  const newLines = [];

  for (const line of [...xlsx1Rows, ...xlsx2Rows]) {
    const key = lineKey(line);
    if (!seen.has(key)) {
      seen.add(key);
      newLines.push(line);
      newRows++;
    }
  }
  console.log(`   Found ${newRows} new rows to add\n`);

  if (newRows > 0) {
    // Step 5: Write merged CSV
    console.log('6. Writing merged CSV...');
    const merged = [...csv.header, ...csv.dataLines, ...newLines].join('\n');
    writeFileSync(OUTPUT, merged, 'utf8');
    console.log(`   Wrote ${csv.dataLines.length + newLines.length} total data rows to ${OUTPUT}`);
  } else {
    console.log('6. No new data found in XLSX files — CSV already contains all data.');
  }

  console.log('\n=== Done! ===');
}

main().catch(console.error);
