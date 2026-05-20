# Ultra1Plus — Vehicle Maintenance Intelligence

> Consumer-facing vehicle fluid lookup and maintenance guide. Users select a vehicle (make / model / variant) and see fluid specs, capacities, intervals, and recommended Ultra1Plus products. Includes ENZO, an AI chatbot for natural-language vehicle queries.

---

## Quick Start

```bash
# Clone
git clone git@github.com:ccolarusso67/vehicle-maintenance.git
cd vehicle-maintenance

# Install
npm install

# Run dev server (http://localhost:3000)
npm run dev

# Build static export to /out
npm run build

# Lint
npm run lint
```

Auxiliary Python scripts (run after the upstream backend publishes new fitment data):

```bash
# Merge fitment + legacy automotive catalog into a unified index
python scripts/merge_automotive.py

# Run regression tests (128 cases)
python scripts/test_merge.py
```

---

## Architecture (high level)

```
pricing-core (backend)
        │
        ▼  publishes JSON
public/data/
        │
        ▼  post-publish merge
public/data/index.json (automotive)
public/data/motorcycle/index.json
public/data/marine/index.json
        │
        ▼  client-side fetch
Next.js frontend (static export)
        │
        ▼
Netlify CDN ──▶ End users (web)
```

No runtime backend. All data is static JSON, served via Netlify CDN.

For the full design: see [CLAUDE.md](./CLAUDE.md) §Domain Model Summary.

---

## Key Metrics

- Automotive makes: **76** (3 fitment + 73 legacy)
- Motorcycle makes: **10**
- Marine makes: **6**
- Vehicle domains: 3 active + 1 frontend-only (Heavy-Duty)
- Build output: static `/out` directory
- Deploy: Netlify
- Last reviewed: 2026-05-19

---

## Tech Stack (one-liner)

Next.js 15 + React 18 + TypeScript 5 + Tailwind CSS 4 + static export + Netlify. Auxiliary Python scripts for the post-publish merge.

For details: see [CLAUDE.md](./CLAUDE.md) §Tech Stack.

---

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | LLM onboarding contract — stack, key files, domain model, source-of-truth contracts, common tasks |
| ARCHITECTURE.md | TODO — write when complexity warrants |
| RUNBOOK.md | TODO — write when there's an operational story to tell |
| decisions/ | TODO — file the first ADR when a significant decision is made |

---

## Status

- **Project status:** active
- **Criticality:** tier-2 (graceful degradation — site can be stale and still work for users)
- **Owner:** TBD
- **Repo visibility:** private (since 2026-05-19; deployed Netlify site remains publicly accessible)
- **Hosting:** Netlify
- **Engineering handbook:** see `ultra1plus-engineering-handbook` repo for documentation standard and project registry

---

## ENZO Chatbot

ENZO is the natural-language assistant baked into the site. It is:

- **Domain-aware** — detects automotive / motorcycle / marine from keywords + make names
- **Source-aware** — fitment data = "verified" confident tone; legacy data = "on file" with disclaimer
- **Imperial-friendly** — displays capacities in quarts / gallons, intervals in miles
- **Product-aware** — links to View Product + Add to Cart for Ultra1Plus SKUs
- **Conversational** — parses "Toyota Camry", "F-150", "Harley Street Glide" etc.

---

## Non-Negotiable Rules (summary)

1. **This is the deployment repo.** Frontend work happens in `~/Desktop/GitHub-Repos/vehicle-maintenance-live`, never the pricing-core workspace copy.
2. **Zero deletes** on vehicle data files.
3. **Fitment truth overrides legacy** — never the reverse.
4. **Motorcycle and marine data untouched** during automotive operations.
5. **Ford 2012-2014 coolant data** must remain untouched.
6. **No runtime backend calls.** Static export + CDN only.

For the full rules: see [CLAUDE.md](./CLAUDE.md) §Non-Negotiable Rules.

---

## Contact

- Owner: cc@ultra1plus.com
- Incident escalation: TBD (build RUNBOOK.md when site outages become a real concern)
- Slack / chat: TBD

---

## License

Internal — Ultra1Plus / Ultrachem LLC. Not for redistribution.
