/**
 * generate-sitemap.mjs
 *
 * Reads vehicle data indexes (automotive, motorcycle, marine) and generates
 * a sitemap.xml with entries for every make, model, and type.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://vehicle-maintenance.ultra1plus.com';
const PUBLIC_DIR = join(process.cwd(), 'public');
const DATA_DIR = join(PUBLIC_DIR, 'data');

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')   // remove parentheses like (USA / CAN)
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function urlEntry(loc, priority, changefreq = 'weekly') {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Domain configs: path prefix for data, path prefix for URLs
const DOMAINS = [
  { dataDir: DATA_DIR, urlPrefix: '' },                           // automotive
  { dataDir: join(DATA_DIR, 'motorcycle'), urlPrefix: '' },       // motorcycle
  { dataDir: join(DATA_DIR, 'marine'), urlPrefix: '' },           // marine
];

const urls = [];

// Homepage
urls.push(urlEntry(BASE_URL, '1.0', 'daily'));

for (const domain of DOMAINS) {
  const indexPath = join(domain.dataDir, 'index.json');
  if (!existsSync(indexPath)) {
    console.warn(`Skipping: ${indexPath} not found`);
    continue;
  }

  const makes = JSON.parse(readFileSync(indexPath, 'utf-8'));
  console.log(`Processing ${indexPath}: ${makes.length} makes`);

  for (const make of makes) {
    const makeSlug = toSlug(make.name);

    // Make page
    urls.push(urlEntry(`${BASE_URL}/${makeSlug}`, '0.8'));

    // Read make JSON for models and types
    const makeFile = join(domain.dataDir, `${make.id}.json`);
    if (!existsSync(makeFile)) {
      console.warn(`  Missing make file: ${makeFile}`);
      continue;
    }

    let makeData;
    try {
      makeData = JSON.parse(readFileSync(makeFile, 'utf-8'));
    } catch (e) {
      console.warn(`  Error reading ${makeFile}: ${e.message}`);
      continue;
    }

    if (!makeData.models || !Array.isArray(makeData.models)) continue;

    for (const model of makeData.models) {
      const modelSlug = toSlug(model.name);

      // Model page
      urls.push(urlEntry(`${BASE_URL}/${makeSlug}/${modelSlug}`, '0.7'));

      if (Array.isArray(model.types)) {
        for (const type of model.types) {
          const typeName = typeof type === 'string' ? type : type.name;
          const typeSlug = toSlug(typeName);

          // Type page
          urls.push(urlEntry(`${BASE_URL}/${makeSlug}/${modelSlug}/${typeSlug}`, '0.6'));
        }
      }
    }
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

const outPath = join(PUBLIC_DIR, 'sitemap.xml');
writeFileSync(outPath, sitemap, 'utf-8');

console.log(`\nSitemap generated: ${outPath}`);
console.log(`Total URLs: ${urls.length}`);
