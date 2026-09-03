#!/usr/bin/env python3
"""
Build-time automotive merge: combines fitment-approved data (truth layer)
with the curated legacy catalog (coverage layer).

Rules:
  - Fitment models win exact-name collisions; legacy adds missing model families
  - Fitment JSON files are NEVER modified (byte-identical preservation)
  - Coverage is explicit in coverage-files.txt; raw orphan files are not published
  - Source provenance stored in merged index entries, not in data files
  - Motorcycle and marine directories are never touched
"""

import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
FITMENT_INDEX_BACKUP = "index.fitment.json"
MERGED_INDEX = "index.json"
MERGE_MANIFEST = "merge_manifest.json"
COVERAGE_FILES = os.path.join(os.path.dirname(__file__), "coverage-files.txt")
MIXED_FILE_SUFFIX = "_coverage"

# Parenthetical region markers to strip from display names
REGION_DISPLAY = re.compile(r"\s*\((?:USA|CAN|USA / CAN|BRA|EU|TUR|RUS|CHN|JPN)[^)]*\)\s*$")


def clean_make_name(name: str) -> str:
    """Remove region markers and abbreviation parentheticals from display name."""
    # Strip region markers: (USA), (USA / CAN), etc.
    clean = REGION_DISPLAY.sub("", name).strip()
    # Strip abbreviation parentheticals: (VW), (VW) etc.
    clean = re.sub(r"\s*\([A-Z]{2,5}\)\s*$", "", clean).strip()
    return clean


def load_fitment_index(data_dir: str) -> list:
    """Load the fitment-only index (backup or current)."""
    backup_path = os.path.join(data_dir, FITMENT_INDEX_BACKUP)
    current_path = os.path.join(data_dir, MERGED_INDEX)

    if os.path.exists(backup_path):
        with open(backup_path) as f:
            return json.load(f)
    # First run — current index IS the fitment index
    with open(current_path) as f:
        return json.load(f)


def load_coverage_index(data_dir: str, coverage_ids: list = None) -> list:
    """Load the durable last-known-complete coverage inventory."""
    if coverage_ids is None:
        with open(COVERAGE_FILES) as f:
            ids = [line.strip() for line in f
                   if line.strip() and not line.lstrip().startswith("#")]
    else:
        ids = coverage_ids

    if len(ids) != len(set(ids)):
        raise ValueError("coverage-files.txt contains duplicate IDs")

    coverage = []
    for make_id in ids:
        path = os.path.join(data_dir, f"{make_id}.json")
        if not os.path.exists(path):
            raise ValueError(f"coverage file missing: {make_id}.json")
        with open(path) as f:
            data = json.load(f)
        models = data.get("models")
        if not isinstance(models, list) or not models:
            raise ValueError(f"coverage file has no models: {make_id}.json")
        coverage.append({
            "name": clean_make_name(data.get("make", make_id)),
            "id": make_id,
            "models": len(models),
        })
    return coverage


def merge_fitment_with_coverage(fitment_data: dict, coverage_data: dict) -> dict:
    """Return fitment models first, then non-duplicate coverage models."""
    merged_models = list(fitment_data.get("models", []))
    seen = {
        re.sub(r"\s+", " ", model.get("name", "").strip()).casefold()
        for model in merged_models
    }
    for model in coverage_data.get("models", []):
        key = re.sub(r"\s+", " ", model.get("name", "").strip()).casefold()
        if key and key not in seen:
            merged_models.append(model)
            seen.add(key)
    return {
        "make": clean_make_name(fitment_data.get("make", coverage_data.get("make", ""))),
        "models": merged_models,
    }


def get_merge_status(data_dir: str = None) -> dict:
    """Read current merge status from published files. No writes."""
    data_dir = data_dir or os.path.abspath(DATA_DIR)
    result = {"healthy": False, "fitment_makes": 0, "legacy_makes": 0,
              "total_makes": 0, "total_models": 0, "merged_at": None, "error": None}

    index_path = os.path.join(data_dir, MERGED_INDEX)
    fitment_path = os.path.join(data_dir, FITMENT_INDEX_BACKUP)
    manifest_path = os.path.join(data_dir, MERGE_MANIFEST)

    if not os.path.exists(index_path):
        result["error"] = "index.json not found"
        return result

    try:
        with open(index_path) as f:
            merged = json.load(f)
        result["total_makes"] = len(merged)
        result["total_models"] = sum(e.get("models", 0) for e in merged)
        result["fitment_makes"] = sum(
            1 for e in merged
            if e.get("source") == "fitment" or e.get("coverage") == "mixed"
        )
        result["legacy_makes"] = sum(
            1 for e in merged
            if e.get("source") == "legacy" and e.get("coverage") != "mixed"
        )

        if os.path.exists(fitment_path):
            with open(fitment_path) as f:
                fitment_index = json.load(f)
            result["fitment_backup_count"] = len(fitment_index)

        if os.path.exists(manifest_path):
            with open(manifest_path) as f:
                manifest = json.load(f)
            result["merged_at"] = manifest.get("merged_at")

        # Health check: merged index should have both fitment and legacy
        result["healthy"] = (result["fitment_makes"] > 0
                             and result["legacy_makes"] > 0
                             and result["total_makes"] >= 10)
    except Exception as e:
        result["error"] = str(e)
    return result


def merge(data_dir: str = None, dry_run: bool = False,
          min_catalog_ratio: float = 0.9, coverage_ids: list = None) -> dict:
    """Run the automotive merge. Returns a manifest dict.

    Args:
        data_dir: Path to public/data directory.
        dry_run: If True, don't write any files.
        min_catalog_ratio: If merged result is smaller than this fraction
            of the current catalog, abort to prevent accidental shrinkage.
        coverage_ids: Optional injected coverage IDs for focused tests.
    """
    if data_dir is None:
        data_dir = os.path.abspath(DATA_DIR)

    # Pre-merge: snapshot current catalog size for guardrail
    current_index_path = os.path.join(data_dir, MERGED_INDEX)
    pre_merge_count = 0
    if os.path.exists(current_index_path):
        try:
            with open(current_index_path) as f:
                pre_merge_count = len(json.load(f))
        except (json.JSONDecodeError, OSError):
            pass

    # Step 1: Load fitment index (truth layer)
    fitment_index = load_fitment_index(data_dir)
    fitment_ids = {entry["id"] for entry in fitment_index}
    print(f"Fitment makes ({len(fitment_ids)}): {sorted(fitment_ids)}")

    # Step 2: Backup fitment index if not already backed up
    backup_path = os.path.join(data_dir, FITMENT_INDEX_BACKUP)
    if not os.path.exists(backup_path) and not dry_run:
        shutil.copy2(
            os.path.join(data_dir, MERGED_INDEX),
            backup_path,
        )
        print(f"Backed up fitment index to {FITMENT_INDEX_BACKUP}")

    # Step 3: Load the durable coverage inventory. This is deliberately
    # separate from index.json because fitment publishes can replace index.json.
    coverage_index = load_coverage_index(data_dir, coverage_ids=coverage_ids)
    print(f"Coverage makes: {len(coverage_index)}")

    # Step 4: Build a fitment-first union. A fitment make no longer suppresses
    # the entire legacy make; it replaces only exact model-name collisions.
    coverage_by_name = {entry["name"].casefold(): entry for entry in coverage_index}
    merged_index = []
    created_files = []
    mixed_makes = []

    for entry in fitment_index:
        fitment_path = os.path.join(data_dir, f"{entry['id']}.json")
        with open(fitment_path) as f:
            fitment_data = json.load(f)

        coverage_entry = coverage_by_name.pop(clean_make_name(entry["name"]).casefold(), None)
        if coverage_entry is None:
            merged_index.append({
                "name": clean_make_name(entry["name"]),
                "id": entry["id"],
                "models": len(fitment_data.get("models", [])),
                "source": "fitment",
            })
            continue

        coverage_path = os.path.join(data_dir, f"{coverage_entry['id']}.json")
        with open(coverage_path) as f:
            coverage_data = json.load(f)
        mixed_data = merge_fitment_with_coverage(fitment_data, coverage_data)
        mixed_id = f"{entry['id']}{MIXED_FILE_SUFFIX}"
        mixed_path = os.path.join(data_dir, f"{mixed_id}.json")
        if not dry_run:
            tmp_path = mixed_path + ".tmp"
            with open(tmp_path, "w") as f:
                json.dump(mixed_data, f, separators=(",", ":"))
            os.replace(tmp_path, mixed_path)
        created_files.append(f"{mixed_id}.json")
        mixed_makes.append(entry["id"])
        # Conservative customer-facing language: until provenance is carried
        # per model, mixed makes use the legacy disclaimer rather than calling
        # every model verified.
        merged_index.append({
            "name": clean_make_name(entry["name"]),
            "id": mixed_id,
            "models": len(mixed_data["models"]),
            "source": "legacy",
            "coverage": "mixed",
        })

    # Step 5: Add all remaining coverage-only makes unchanged.
    for entry in coverage_by_name.values():
        merged_index.append({
            "name": clean_make_name(entry["name"]),
            "id": entry["id"],
            "models": entry["models"],
            "source": "legacy",
        })

    merged_index.sort(key=lambda entry: entry["name"].casefold())
    print(f"Merged coverage: {len(merged_index)} makes; mixed: {mixed_makes}")

    # Step 6: Catalog size guardrail — abort if suspicious shrinkage
    if pre_merge_count > 10 and len(merged_index) < pre_merge_count * min_catalog_ratio:
        raise ValueError(
            f"MERGE ABORTED: catalog would shrink from {pre_merge_count} to "
            f"{len(merged_index)} makes ({len(merged_index)/pre_merge_count:.0%}). "
            f"Threshold: {min_catalog_ratio:.0%}. Current index preserved."
        )

    # Step 7: Write merged index (atomic: write temp, rename)
    if not dry_run:
        merged_path = os.path.join(data_dir, MERGED_INDEX)
        tmp_path = merged_path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(merged_index, f, separators=(",", ":"))
        os.replace(tmp_path, merged_path)
        print(f"\nWrote merged {MERGED_INDEX}: {len(merged_index)} makes")

    # Step 8: Write merge manifest
    manifest = {
        "merged_at": datetime.now(timezone.utc).isoformat(),
        "fitment_makes": len(fitment_ids),
        "coverage_makes": len(coverage_index),
        "legacy_makes": sum(
            1 for entry in merged_index
            if entry["source"] == "legacy" and entry.get("coverage") != "mixed"
        ),
        "mixed_makes": mixed_makes,
        "total_makes": len(merged_index),
        "pre_merge_count": pre_merge_count,
        "fitment_entries": [e for e in merged_index if e["source"] == "fitment"],
        "legacy_entries": [e for e in merged_index if e["source"] == "legacy"],
        "created_files": created_files,
        "fitment_index_backup": FITMENT_INDEX_BACKUP,
    }
    if not dry_run:
        manifest_path = os.path.join(data_dir, MERGE_MANIFEST)
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Wrote {MERGE_MANIFEST}")

    return manifest


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    if dry:
        print("=== DRY RUN ===\n")
    result = merge(dry_run=dry)
    print(f"\nSummary: {result['fitment_makes']} fitment + {result['legacy_makes']} legacy = {result['total_makes']} total makes")
