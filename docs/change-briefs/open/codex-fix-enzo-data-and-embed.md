# Branch brief: `codex/fix-enzo-data-and-embed`

## Why now

Tony reported that the live maintenance guide was not loading the complete vehicle data: “Pero no se jala la data completa.” The deployed automotive index confirms the regression: it exposes 76 makes and 1,473 model families, while the last known complete indexed release exposed at least 120 makes and 2,026 model families.

## Bug / Problem

The post-publish merge treats an approved fitment make as a replacement for the entire legacy make. That is correct for an exact model collision, but incorrect at make level: Ford, Honda, and Toyota each retained only seven fitment model families and silently lost dozens of non-overlapping legacy families. The merge also rebuilt coverage by scanning filenames, so there was no durable declaration or regression floor for the catalog users expect.

## Outcome

The automotive catalog returns to 139 makes and 2,142 model families. Ford, Honda, and Toyota use a fitment-first union: exact model-name collisions keep the fitment record, while missing model families come from the curated coverage layer. Future fitment republishes deterministically restore the same coverage instead of silently shrinking it.

## Evidence / Error Data

- Live Netlify index before this change: 76 makes / 1,473 model families.
- Last known complete historical index: 120 makes / 2,026 model families.
- Recovered branch index: 139 makes / 2,142 model families.
- Before: Ford 7, Honda 7, Toyota 7 model families.
- After: Ford 74, Honda 71, Toyota 101 model families.
- Affected Users: unknown (not tracked).

## Verbatim Signals

> “Pero no se jala la data completa.” — Tony, September 3, 2026

## Plain-Language Fix

The merge now keeps the newer verified fitment rows and fills only the model families they do not cover from a reviewed inventory. A checked-in allowlist makes the expected catalog explicit, and tests fail if the catalog falls below the known-complete floor or if a fitment source file changes.

## User-Facing Bug Fixes

- Restores missing makes and model families in the vehicle selector and Enzo lookup.
- Restores Ford F-150, Honda Accord, Toyota RAV4, and other non-overlapping families without overwriting verified fitment records.
- Prevents a future fitment publish from silently reducing the customer-facing catalog again.

## Scope

This PR changes only the automotive catalog merge, its generated index/mixed files, regression coverage, and the lint configuration required to run verification. Motorcycle, marine, heavy-duty, product mappings, frontend behavior, and dependencies remain unchanged.

## Risk / Blast Radius

The changed data is public and affects automotive make/model discovery and Enzo answers. Exact fitment source JSON remains byte-identical; mixed makes use the conservative legacy disclaimer because provenance is not yet stored per model. All 139 indexed files parse, and motorcycle/marine isolation tests pass.

## Rollout / Rollback

Merging to `main` uses the repository’s existing Netlify auto-deploy. Verify the public index counts and representative lookups after deployment. Roll back by reverting this PR’s commit; the prior static index and merge behavior are fully recoverable from Git.

## Monitoring

There is no production telemetry for affected sessions. Post-deploy verification is therefore deterministic: check the public index counts, then exercise BMW X5 plus Ford F-150 in the selector and Enzo.

## Open Questions

None for this recovery. Product-SKU mapping corrections and broader raw/regional catalog expansion remain separate work.

## Reviewer-Facing Sections

### Reviewer Summary

This restores the complete customer-facing automotive catalog without weakening fitment precedence. The important boundary is now model-level rather than make-level, backed by an explicit coverage inventory and a fail-closed regression floor.

### Reviewer Guide

- Start with `scripts/merge_automotive.py`: confirm the fitment-first union and catalog-shrink guardrail.
- Read `scripts/coverage-files.txt` next: this is the new durable declaration of published coverage.
- Review `scripts/test_complete_coverage.py`: it proves the known-complete floor, mixed-make restoration, and byte-identical fitment sources.
- Confirm `public/data/index.json` and the three `*_coverage.json` files are the intended generated artifacts.
- Finish with `scripts/test_merge.py` to verify republish recovery and motorcycle/marine isolation.

### Big Picture

Before, a fitment entry for a make suppressed every legacy model for that make. After, the merge starts with fitment models, adds only missing legacy model names, and publishes a separate mixed file. Coverage selection no longer depends on whatever filenames happen to be present: it comes from a reviewed allowlist.

### Why This Shape

The change stays inside the existing static-data architecture and post-publish merge. It does not add a runtime service or expose all 500-plus raw regional files. Separate mixed files preserve the three fitment source files exactly and make rollback straightforward.

### How It Works

1. Load the fitment index and the explicit coverage allowlist.
2. For overlapping makes, copy fitment models first and add only legacy model names not already present.
3. Publish mixed files plus a sorted index; label mixed entries conservatively for customer-facing copy.
4. Abort suspicious catalog shrinkage and test a simulated future fitment republish.

### Patterns Preserved

- Static Next.js export and Netlify CDN delivery.
- Fitment precedence for exact model collisions.
- Byte-identical fitment source JSON.
- Separate motorcycle and marine indexes.
- Atomic replacement of generated index files.

### Patterns Changed

- Precedence moves from whole-make replacement to exact model-name replacement.
- Published coverage becomes an explicit checked-in allowlist instead of a filename scan.
- The minimum known-complete catalog becomes a tested invariant.

### Mental Model

Think of fitment as an authoritative patch over a curated catalog, not as permission to delete the rest of a make.

### File Notes

- `scripts/merge_automotive.py`: owns precedence, union, and shrinkage behavior.
- `scripts/coverage-files.txt`: owns which automotive datasets are intentionally published.
- `scripts/test_complete_coverage.py`: owns the known-complete floor and source-preservation regression.
- `public/data/*_coverage.json`: generated mixed-make artifacts consumed by the static frontend.
