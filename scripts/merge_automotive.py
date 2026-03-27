#!/usr/bin/env python3
"""
Build-time automotive merge: combines fitment-approved data (truth layer)
with legacy USA/CAN Ravenol crossref data (coverage layer).

Rules:
  - Fitment makes always override legacy — derived dynamically from fitment index
  - Fitment JSON files are NEVER modified (byte-identical preservation)
  - Legacy files are copied with normalized IDs and cleaned make names
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

# Region patterns for USA/CAN legacy files
USA_CAN_PATTERNS = [
    re.compile(r"__usa___can_\.json$"),
    re.compile(r"__usa_\.json$"),
]

# Region-neutral files that are USA-relevant (no region suffix, not hash-named)
# These are included if they have real make names (not hex hashes)
HASH_PATTERN = re.compile(r"^[0-9a-f]{6,}\.json$")

# Suffixes to strip when normalizing make IDs
REGION_SUFFIXES = re.compile(r"__(?:usa|can|bra|eu|tur|rus|chn|jpn)(?:___(?:usa|can|bra|eu|tur|rus|chn|jpn))?(?:_\d+)?$")

# Parenthetical region markers to strip from display names
REGION_DISPLAY = re.compile(r"\s*\((?:USA|CAN|USA / CAN|BRA|EU|TUR|RUS|CHN|JPN)[^)]*\)\s*$")


def normalize_make_id(filename: str) -> str:
    """Convert legacy filename to a clean make ID (base make only, no region)."""
    base = filename.replace(".json", "")
    # Strip everything from first double-underscore onward (region markers)
    if "__" in base:
        base = base[:base.index("__")]
    # Collapse multiple underscores, strip edges
    clean = re.sub(r"_+", "_", base).strip("_")
    return clean.lower()


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


def find_legacy_usa_files(data_dir: str) -> list:
    """Find all USA/CAN legacy automotive files."""
    candidates = []
    for fn in sorted(os.listdir(data_dir)):
        if not fn.endswith(".json"):
            continue
        if fn in (MERGED_INDEX, FITMENT_INDEX_BACKUP, MERGE_MANIFEST):
            continue
        # Skip motorcycle/marine subdirectories (handled by listdir on data_dir only)
        fpath = os.path.join(data_dir, fn)
        if not os.path.isfile(fpath):
            continue
        # Match USA/CAN files
        if any(p.search(fn) for p in USA_CAN_PATTERNS):
            candidates.append(fn)
    return candidates


def find_region_neutral_usa_relevant(data_dir: str, fitment_ids: set, legacy_ids: set) -> list:
    """Find region-neutral files that are USA-relevant and not already covered."""
    extras = []
    for fn in sorted(os.listdir(data_dir)):
        if not fn.endswith(".json") or not os.path.isfile(os.path.join(data_dir, fn)):
            continue
        if fn in (MERGED_INDEX, FITMENT_INDEX_BACKUP, MERGE_MANIFEST):
            continue
        # Skip files with region suffixes (already handled)
        if "__" in fn:
            continue
        # Skip hash-named files
        if HASH_PATTERN.match(fn):
            continue
        # Skip fitment files
        norm_id = fn.replace(".json", "").lower()
        if norm_id in fitment_ids:
            continue
        # Skip if already covered by a USA/CAN file
        if norm_id in legacy_ids:
            continue
        # Must have real data
        try:
            with open(os.path.join(data_dir, fn)) as f:
                data = json.load(f)
            if not data.get("models"):
                continue
            # Skip marine/motorcycle data that leaked into root
            make_lower = data.get("make", "").lower()
            if make_lower in ("sea-doo", "volvo penta", "yamaha", "suzuki"):
                continue
            extras.append(fn)
        except (json.JSONDecodeError, KeyError):
            continue
    return extras


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
        result["fitment_makes"] = sum(1 for e in merged if e.get("source") == "fitment")
        result["legacy_makes"] = sum(1 for e in merged if e.get("source") == "legacy")

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
          min_catalog_ratio: float = 0.9) -> dict:
    """Run the automotive merge. Returns a manifest dict.

    Args:
        data_dir: Path to public/data directory.
        dry_run: If True, don't write any files.
        min_catalog_ratio: If merged result is smaller than this fraction
            of the current catalog, abort to prevent accidental shrinkage.
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
    fitment_id_to_entry = {entry["id"]: entry for entry in fitment_index}

    print(f"Fitment makes ({len(fitment_ids)}): {sorted(fitment_ids)}")

    # Step 2: Backup fitment index if not already backed up
    backup_path = os.path.join(data_dir, FITMENT_INDEX_BACKUP)
    if not os.path.exists(backup_path) and not dry_run:
        shutil.copy2(
            os.path.join(data_dir, MERGED_INDEX),
            backup_path,
        )
        print(f"Backed up fitment index to {FITMENT_INDEX_BACKUP}")

    # Step 3: Find legacy USA/CAN files
    usa_files = find_legacy_usa_files(data_dir)
    print(f"Found {len(usa_files)} USA/CAN legacy files")

    # Step 4: Normalize and deduplicate legacy files
    legacy_by_id = {}  # normalized_id -> (filename, model_count, clean_name)
    for fn in usa_files:
        norm_id = normalize_make_id(fn)
        # Skip if fitment already covers this make
        if norm_id in fitment_ids:
            print(f"  SKIP {fn} → {norm_id} (fitment override)")
            continue
        try:
            with open(os.path.join(data_dir, fn)) as f:
                data = json.load(f)
            model_count = len(data.get("models", []))
            display_name = clean_make_name(data.get("make", norm_id))
            # Deduplicate: keep file with more models
            if norm_id in legacy_by_id:
                existing = legacy_by_id[norm_id]
                if model_count <= existing[1]:
                    print(f"  SKIP {fn} → {norm_id} (duplicate, fewer models: {model_count} vs {existing[1]})")
                    continue
                print(f"  REPLACE {existing[0]} with {fn} → {norm_id} ({model_count} vs {existing[1]} models)")
            legacy_by_id[norm_id] = (fn, model_count, display_name)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  ERROR {fn}: {e}")

    # Step 5: Find region-neutral USA-relevant files
    neutral_files = find_region_neutral_usa_relevant(data_dir, fitment_ids, set(legacy_by_id.keys()))
    for fn in neutral_files:
        norm_id = fn.replace(".json", "").lower()
        try:
            with open(os.path.join(data_dir, fn)) as f:
                data = json.load(f)
            model_count = len(data.get("models", []))
            display_name = clean_make_name(data.get("make", norm_id))
            legacy_by_id[norm_id] = (fn, model_count, display_name)
        except (json.JSONDecodeError, KeyError):
            pass

    print(f"Legacy makes after dedup: {len(legacy_by_id)}")

    # Step 6: Create normalized copies of legacy files (clean make names)
    created_files = []
    for norm_id, (src_fn, model_count, display_name) in sorted(legacy_by_id.items()):
        target_fn = f"{norm_id}.json"
        src_path = os.path.join(data_dir, src_fn)
        target_path = os.path.join(data_dir, target_fn)

        if src_fn == target_fn:
            # File already has the correct name — check if make name needs cleaning
            with open(src_path) as f:
                data = json.load(f)
            if data.get("make") != display_name:
                if not dry_run:
                    data["make"] = display_name
                    with open(target_path, "w") as f:
                        json.dump(data, f, separators=(",", ":"))
                created_files.append(target_fn)
                print(f"  CLEANED {target_fn} (name: {display_name})")
            else:
                print(f"  OK {target_fn} (already clean)")
        else:
            # Copy and normalize
            with open(src_path) as f:
                data = json.load(f)
            data["make"] = display_name
            if not dry_run:
                with open(target_path, "w") as f:
                    json.dump(data, f, separators=(",", ":"))
            created_files.append(target_fn)
            print(f"  COPY {src_fn} → {target_fn} (name: {display_name}, {model_count} models)")

    # Step 7: Build merged index with provenance
    merged_index = []

    # Fitment makes first (sorted by name)
    for entry in sorted(fitment_index, key=lambda e: e["name"]):
        merged_index.append({
            "name": entry["name"],
            "id": entry["id"],
            "models": entry["models"],
            "source": "fitment",
        })

    # Legacy makes after (sorted by name)
    for norm_id in sorted(legacy_by_id.keys(), key=lambda k: legacy_by_id[k][2]):
        src_fn, model_count, display_name = legacy_by_id[norm_id]
        merged_index.append({
            "name": display_name,
            "id": norm_id,
            "models": model_count,
            "source": "legacy",
        })

    # Step 8: Catalog size guardrail — abort if suspicious shrinkage
    if pre_merge_count > 10 and len(merged_index) < pre_merge_count * min_catalog_ratio:
        raise ValueError(
            f"MERGE ABORTED: catalog would shrink from {pre_merge_count} to "
            f"{len(merged_index)} makes ({len(merged_index)/pre_merge_count:.0%}). "
            f"Threshold: {min_catalog_ratio:.0%}. Current index preserved."
        )

    # Step 9: Write merged index (atomic: write temp, rename)
    if not dry_run:
        merged_path = os.path.join(data_dir, MERGED_INDEX)
        tmp_path = merged_path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(merged_index, f, separators=(",", ":"))
        os.replace(tmp_path, merged_path)
        print(f"\nWrote merged {MERGED_INDEX}: {len(merged_index)} makes")

    # Step 10: Write merge manifest
    manifest = {
        "merged_at": datetime.now(timezone.utc).isoformat(),
        "fitment_makes": len(fitment_ids),
        "legacy_makes": len(legacy_by_id),
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
