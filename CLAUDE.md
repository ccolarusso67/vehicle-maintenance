# Ultra1Plus — Vehicle Maintenance Intelligence

> LLM onboarding contract. Read this first if you're an LLM (or a new human) picking up this project. The goal is to make you productive in 5-10 minutes.

---

## Project Overview

Consumer-facing vehicle fluid lookup and maintenance guide. Users select a vehicle (make / model / variant) and see fluid specs, capacities, change intervals, and recommended Ultra1Plus products. Includes **ENZO**, an AI chatbot assistant that answers vehicle-fluid questions in natural language.

The site is **statically exported** by Next.js and served by Netlify — there is no backend. All data is JSON files published from the upstream `pricing-core` repo into `public/data/` and consumed by the frontend at runtime.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 | App Router |
| UI runtime | React 18 | |
| Language | TypeScript 5 | Strict |
| Styling | Tailwind CSS 4 | |
| Build mode | Static export (`output: "export"`) | Produces `/out` directory |
| Deployment | Netlify | Auto-deploy on push to `main` |
| Auxiliary tooling | Python (scripts/) | Post-publish merge of fitment + legacy automotive catalog |
| Source data | JSON files in `public/data/` | Published from pricing-core |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main page: domain selector, vehicle selector, fluid cards, ENZO |
| `src/components/ChatBot.tsx` | ENZO chatbot: domain-aware, source-aware, imperial display |
| `src/components/VehicleSelector.tsx` | Make / Model / Variant dropdowns with search |
| `src/components/FluidCard.tsx` | Fluid spec card: product, capacity, interval |
| `src/components/Header.tsx` | Site header / nav |
| `src/data/types.ts` | TypeScript interfaces: `VehicleDomain`, `FluidSpec`, `MakeIndex`, etc. |
| `public/data/` | Vehicle spec JSON files (published from pricing-core) |
| `public/data/index.json` | Automotive catalog (76 makes — fitment + legacy) |
| `public/data/motorcycle/index.json` | Motorcycle catalog (10 makes) |
| `public/data/marine/index.json` | Marine catalog (6 makes) |
| `scripts/merge_automotive.py` | Post-publish merge: fitment + legacy automotive catalog |
| `scripts/test_merge.py` | 128 regression tests for merge integrity |
| `next.config.ts` | Next.js config (static export, image config) |
| `package.json` | Dependencies + npm scripts |

---

## Source of Truth (authoritative contracts)

> Frontend has fewer "helper" patterns than backend repos, but a few canonical rules govern data interpretation:

| Concept | Authoritative source | Why |
|---------|---------------------|-----|
| Vehicle / fluid data | `public/data/*.json` (only) | Never hardcoded in components; never fetched from a runtime API |
| Imperial display conversion | `ChatBot.tsx` + `FluidCard.tsx` formatting rules | Source JSON is metric (L / km / g) — conversion is display-only |
| Product cross-reference | Ultra1Plus SKU IDs in the fluid data | Linked to product pages and Add-to-Cart |
| Catalog truth precedence | Fitment data > legacy data (always) | Set during `merge_automotive.py` — never reversed |

If you add a new feature that needs vehicle data, READ FROM `public/data/`. Do not hardcode and do not introduce a runtime API.

---

## Domain Model Summary

**Three vehicle domains, each with its own catalog file:**

| Domain | Makes | Catalog path | Notes |
|--------|-------|--------------|-------|
| Automotive | 76 (3 fitment + 73 legacy) | `/data/index.json` | Merged via `merge_automotive.py` |
| Motorcycle | 10 | `/data/motorcycle/index.json` | Fitment-only |
| Marine | 6 | `/data/marine/index.json` | Fitment-only |
| Heavy-Duty | TBD | `/data/heavy-duty/index.json` | Frontend-only (no backend pipeline yet) |

**Data flow:**

```
pricing-core (backend) ─publishes JSON─▶ public/data/
                                              │
                                              ▼
                                       merge_automotive.py (post-publish)
                                              │
                                              ▼
                                       /data/index.json (merged automotive)
                                              │
                                              ▼
                                  Frontend fetches at runtime
                                              │
                                              ▼
                                  Netlify serves static export
```

**Imperial display rules (display-layer only — source data is metric):**

- Liters < 3.785 L → quarts
- Liters ≥ 3.785 L → gallons
- Kilometers → miles
- Grams → ounces
- "Capacity " and "Change " label prefixes stripped
- **Source JSON data is unchanged** — conversion happens at render time

**ENZO chatbot capabilities:**

- Domain-aware (detects automotive / motorcycle / marine from keywords + make names)
- Source-aware (fitment = "verified" confident tone; legacy = "on file" with disclaimer)
- Imperial display (capacities in quarts / gallons, intervals in miles)
- Product links (View Product + Add to Cart for Ultra1Plus SKUs)
- Natural language parsing ("Toyota Camry", "F-150", "Harley Street Glide")

---

## Commands

```bash
# Dev server (localhost:3000)
npm run dev

# Static export build to /out
npm run build

# Lint
npm run lint

# Run merge script after backend publishes new fitment JSON
python scripts/merge_automotive.py

# Run merge regression tests
python scripts/test_merge.py
```

---

## Environment Variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_*` | Any frontend-exposed config | as needed | — |
| Netlify build env | Set in Netlify dashboard | yes (for deploy) | — |

Frontend has no secrets — all data is public-facing JSON. Any sensitive integration belongs in the backend (pricing-core).

---

## Non-Negotiable Rules

1. **This is the deployment repo.** All frontend changes happen here. The standalone clone is the authoritative path; the pricing-core workspace copy is read-only.
2. **Zero deletes** on vehicle data files. Source JSON in `public/data/` is append-only from the frontend's perspective; only the backend publish pipeline writes it.
3. **Fitment truth overrides legacy** — never the reverse. Enforced by `merge_automotive.py`.
4. **Motorcycle and marine data untouched** during automotive operations. They live in separate indices for exactly this reason.
5. **Ford 2012-2014 coolant data must remain untouched.** Specific historical edge case — do not regenerate.
6. **No runtime API calls.** Data is static JSON loaded client-side; do not introduce server-side fetches.
7. **Conversion is display-only.** Never modify the underlying metric values in JSON.

---

## Recent Significant Changes

- **2026-05-19** — Adopted canonical CLAUDE.md + README format per engineering-handbook standard. Repository made private during portfolio visibility audit (deployed site on Netlify still public).
- **2026-04-** — Google Search Console meta tag verification added.
- (Earlier history: ENZO chatbot enhancements, imperial display layer, automotive catalog merge.)

---

## Connected Projects

| Project | Direction | Interface |
|---------|-----------|-----------|
| `pricing-core` | This project depends on it | Static JSON published to `public/data/`; never via runtime API |
| Netlify | This project depends on it | Build & CDN |

End consumers: web users searching for vehicle fluid specs (consumer-facing SEO target).

---

## Common LLM Tasks

### "Add a new vehicle make / model"

This is a **backend** task — happens in pricing-core's fitment pipeline, not here. Add it upstream and let the publish pipeline write the JSON into `public/data/`. Then `merge_automotive.py` includes it on the next merge run.

### "Tune ENZO's response style"

1. Edit `src/components/ChatBot.tsx`.
2. Adjust the prompt template / keyword detection.
3. Test with a handful of queries (Toyota Camry, F-150, Harley Street Glide).
4. Verify source-awareness still works (fitment vs legacy tone).
5. Verify imperial display still applies.

### "Debug a wrong fluid spec for a vehicle"

1. Identify the vehicle and the field in question.
2. Open the corresponding JSON in `public/data/` and inspect the source data.
3. If the JSON is wrong, the fix is upstream in pricing-core (not here).
4. If the JSON is right but the display is wrong, it's a frontend bug — check `FluidCard.tsx` and the imperial conversion functions.

### "Add a new vehicle domain (e.g. powersports)"

1. Decide the data path (`/data/<domain>/index.json`).
2. Add the domain to `src/data/types.ts` (new union member in `VehicleDomain`).
3. Add the domain to the domain selector UI in `src/app/page.tsx`.
4. Verify ENZO's domain detection rules cover the new domain.
5. Update this CLAUDE.md §Domain Model.
6. File an ADR if this changes the catalog structure.

### "Update a Netlify env var"

Netlify dashboard → site → Site settings → Build & deploy → Environment. Triggers a rebuild on save.

---

## What NOT to do

- **Never hand-edit files in `public/data/`.** They come from the pricing-core publish pipeline. Manual edits get clobbered on the next publish.
- **Never delete vehicle data.** Even if a make is dropped from production, keep its file for historical lookups.
- **Never violate the fitment > legacy precedence.** `merge_automotive.py` enforces it; don't bypass.
- **Never modify Ford 2012-2014 coolant entries.** Historical edge case.
- **Never modify motorcycle / marine data when working on automotive.** They're in separate indices to prevent accidental cross-contamination.
- **Never introduce a runtime backend dependency.** The whole point is static export + CDN serving.
- **Never store secrets in this repo.** Everything frontend is public; secrets belong in the backend.
- **Never edit the workspace copy of this repo.** Frontend work happens in `~/Desktop/GitHub-Repos/vehicle-maintenance-live` exclusively.

---

## Last reviewed

- Document last reviewed: 2026-05-19 by CEO
- Schedule: review on every major release or every 90 days, whichever comes first.
- Standard: engineering-handbook v1 (DOCUMENTATION_STANDARD.md)
