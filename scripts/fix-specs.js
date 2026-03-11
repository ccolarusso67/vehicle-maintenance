const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'public', 'data');

// ── 1. Fix Toyota Camry & RAV4 missing engine oil, Corolla wrong spec ──

const toyota = JSON.parse(fs.readFileSync(path.join(dataDir, 'toyota__usa___can_.json'), 'utf8'));

for (const model of toyota.models) {
  for (const type of model.types) {
    const hasEngineOil = type.fluids.some(f => f.n === 'Engine' && f.p && f.p.indexOf('Special') === -1);

    // Camry 2.5L 2017+ and RAV4 2.5L 2018+ - add 0W-20 engine oil if missing
    if (!hasEngineOil && (/Camry.*2\.5/i.test(type.name) || /RAV4.*2\.5/i.test(type.name))) {
      const yearMatch = type.name.match(/\((\d{4})/);
      if (yearMatch && parseInt(yearMatch[1]) >= 2017) {
        type.fluids.unshift({
          n: 'Engine',
          c: 'Capacity 4.8 litre (Service fill)',
          i: 'Change 10000 miles / 12 months',
          p: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil',
          ic: '🛢️',
          u1pSku: 'UFS020SPGF6A'
        });
        console.log('Added 0W-20 engine oil to:', type.name);
      }
    }

    // Corolla 2.0L - fix 0W-16 to 0W-20
    if (/Corolla.*2\.0/i.test(type.name)) {
      for (const fluid of type.fluids) {
        if (fluid.n === 'Engine' && fluid.p && fluid.p.indexOf('0W-16') !== -1) {
          fluid.p = 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil';
          fluid.u1pSku = 'UFS020SPGF6A';
          console.log('Fixed Corolla oil from 0W-16 to 0W-20:', type.name);
        }
      }
    }
  }
}
fs.writeFileSync(path.join(dataDir, 'toyota__usa___can_.json'), JSON.stringify(toyota));
console.log('✓ Toyota fixes applied\n');

// ── 2. Fix Ford Explorer U625 missing engine oil ──

const ford = JSON.parse(fs.readFileSync(path.join(dataDir, 'ford__usa_.json'), 'utf8'));

const explorerOilSpecs = {
  '2.3': { cap: '5.7 litre', grade: '5W-30', sku: 'UFS0530SPGF6A' },
  '3.0': { cap: '6.0 litre', grade: '5W-30', sku: 'UFS0530SPGF6A' },
  '3.3': { cap: '6.0 litre', grade: '5W-30', sku: 'UFS0530SPGF6A' },
};

for (const model of ford.models) {
  if (!/Explorer.*U625/i.test(model.name)) continue;
  for (const type of model.types) {
    const hasEngineOil = type.fluids.some(f => f.n === 'Engine');
    if (hasEngineOil) continue;

    let spec = null;
    if (/2\.3/i.test(type.name)) spec = explorerOilSpecs['2.3'];
    else if (/3\.0/i.test(type.name)) spec = explorerOilSpecs['3.0'];
    else if (/3\.3/i.test(type.name)) spec = explorerOilSpecs['3.3'];

    if (spec) {
      type.fluids.unshift({
        n: 'Engine',
        c: 'Capacity ' + spec.cap + ' (Service fill)',
        i: 'Change 10000 miles / 12 months',
        p: 'Ultra1Plus SAE ' + spec.grade + ' Full Synthetic Motor Oil',
        ic: '🛢️',
        u1pSku: spec.sku
      });
      console.log('Added engine oil to Explorer:', type.name);
    }
  }
}

// ── 3. Add Ford F-150 if missing ──

const hasF150 = ford.models.some(m => /F-?150/i.test(m.name));
if (!hasF150) {
  ford.models.push({
    name: 'F-150 (2015-2020)',
    types: [
      {
        name: 'F-150 2.7L V6 EcoBoost (2015-2020)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 13.1 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 12.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'F-150 3.5L V6 EcoBoost (2015-2020)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 13.1 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 12.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'F-150 5.0L V8 (2015-2020)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0520SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 13.1 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 14.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
    ]
  });
  ford.models.push({
    name: 'F-150 (2021-2025)',
    types: [
      {
        name: 'F-150 2.7L V6 EcoBoost (2021-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 12.0 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 12.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'F-150 3.5L V6 EcoBoost (2021-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 12.0 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 12.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'F-150 5.0L V8 (2021-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0520SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 12.0 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 14.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'F-150 3.5L V6 PowerBoost Hybrid (2021-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 10000 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 12.0 litre (Dry fill)', i: 'Change 150000 miles', p: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', ic: '⚙️', u1pSku: 'UFSATFU' },
          { n: 'Coolant', c: 'Capacity 12.0 litre', i: 'Change 100000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
    ]
  });
  console.log('Added Ford F-150 (2015-2020) and (2021-2025) with all engine variants');
}

fs.writeFileSync(path.join(dataDir, 'ford__usa_.json'), JSON.stringify(ford));

// Update Ford model count in index
const idx = JSON.parse(fs.readFileSync(path.join(dataDir, 'index.json'), 'utf8'));
const fordIdx = idx.find(m => m.id === 'ford__usa_');
if (fordIdx) {
  fordIdx.models = ford.models.length;
  console.log('Updated Ford (USA) model count to', ford.models.length);
}
console.log('✓ Ford fixes applied\n');

// ── 4. Add Chevrolet Silverado 1500 ──

const chevy = JSON.parse(fs.readFileSync(path.join(dataDir, 'chevrolet__usa___can_.json'), 'utf8'));

const hasSilverado = chevy.models.some(m => /Silverado.*1500/i.test(m.name));
if (!hasSilverado) {
  chevy.models.push({
    name: 'Silverado 1500 (2014-2018)',
    types: [
      {
        name: 'Silverado 1500 4.3L V6 (2014-2018)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.7 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 11.4 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'Silverado 1500 5.3L V8 (2014-2018)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 12.3 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'Silverado 1500 6.2L V8 (2014-2018)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS0530SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 12.3 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
    ]
  });
  chevy.models.push({
    name: 'Silverado 1500 (2019-2025)',
    types: [
      {
        name: 'Silverado 1500 2.7L Turbo (2019-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 5.0 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS020SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 10.0 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'Silverado 1500 5.3L V8 (2019-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS020SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 12.3 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'Silverado 1500 6.2L V8 (2019-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 7.6 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS020SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 12.3 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
      {
        name: 'Silverado 1500 3.0L Duramax Diesel (2019-2025)',
        fluids: [
          { n: 'Engine', c: 'Capacity 6.6 litre (Service fill)', i: 'Change 7500 miles / 12 months', p: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', ic: '🛢️', u1pSku: 'UFS020SPGF6A' },
          { n: 'Transmission, automatic', c: 'Capacity 11.0 litre (Dry fill)', i: 'Change 75000 miles', p: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', ic: '⚙️', u1pSku: 'UFSATFDVIMV' },
          { n: 'Coolant', c: 'Capacity 11.0 litre', i: 'Change 150000 miles / 60 months', p: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', ic: '❄️', u1pSku: 'UACELCONO' },
          { n: 'Brake fluid', c: '', i: 'Change 36 months', p: 'Ultra1Plus DOT 4 Brake Fluid', ic: '🛑', u1pSku: 'U1PDOT4' },
        ]
      },
    ]
  });
  console.log('Added Chevrolet Silverado 1500 (2014-2018) and (2019-2025)');
}

fs.writeFileSync(path.join(dataDir, 'chevrolet__usa___can_.json'), JSON.stringify(chevy));

const chevyIdx = idx.find(m => m.id === 'chevrolet__usa___can_');
if (chevyIdx) {
  chevyIdx.models = chevy.models.length;
  console.log('Updated Chevrolet (USA/CAN) model count to', chevy.models.length);
}
console.log('✓ Chevrolet fixes applied\n');

// ── 5. Fix Honda Pilot transmission fluid ──

const honda = JSON.parse(fs.readFileSync(path.join(dataDir, 'honda__usa___can_.json'), 'utf8'));

for (const model of honda.models) {
  if (!/Pilot/i.test(model.name)) continue;
  for (const type of model.types) {
    for (const fluid of type.fluids) {
      if (fluid.p === 'Products not found' || fluid.p === '') {
        if (/[Tt]ransmission/i.test(fluid.n) || /[Tt]ransfer/i.test(fluid.n) || /[Tt]ransaxle/i.test(fluid.n)) {
          fluid.p = 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD';
          fluid.u1pSku = 'UFSATFU';
          console.log('Fixed Honda Pilot transmission fluid:', fluid.n, 'in', type.name);
        }
      }
    }
  }
}

fs.writeFileSync(path.join(dataDir, 'honda__usa___can_.json'), JSON.stringify(honda));
console.log('✓ Honda fixes applied\n');

// ── Save updated index ──

fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(idx));
console.log('✓ Index updated');
console.log('\nAll fixes complete!');
