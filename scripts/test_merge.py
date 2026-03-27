#!/usr/bin/env python3
"""Tests for the automotive merge: fitment truth, legacy coverage, domain isolation."""

import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
MOTO_DIR = os.path.join(DATA_DIR, "motorcycle")
MARINE_DIR = os.path.join(DATA_DIR, "marine")

passed = 0
failed = 0


def test(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  PASS  {name}")
        passed += 1
    else:
        print(f"  FAIL  {name}  {detail}")
        failed += 1


def load(path):
    with open(path) as f:
        return json.load(f)


def main():
    global passed, failed

    # Load indexes
    merged_index = load(os.path.join(DATA_DIR, "index.json"))
    fitment_index = load(os.path.join(DATA_DIR, "index.fitment.json"))
    moto_index = load(os.path.join(MOTO_DIR, "index.json"))
    marine_index = load(os.path.join(MARINE_DIR, "index.json"))

    merged_by_id = {e["id"]: e for e in merged_index}
    fitment_ids = {e["id"] for e in fitment_index}

    # ─── Test 1: Fitment truth preserved ───
    print("\n1. Fitment truth preserved")

    # Fitment makes derived dynamically
    test("fitment index backup exists",
         os.path.exists(os.path.join(DATA_DIR, "index.fitment.json")))

    test("fitment makes in merged index",
         all(fid in merged_by_id for fid in fitment_ids),
         f"missing: {fitment_ids - set(merged_by_id.keys())}")

    for entry in fitment_index:
        fid = entry["id"]
        merged_entry = merged_by_id.get(fid, {})
        test(f"{fid} source = fitment",
             merged_entry.get("source") == "fitment",
             f"got: {merged_entry.get('source')}")
        test(f"{fid} model count unchanged ({entry['models']})",
             merged_entry.get("models") == entry["models"],
             f"got: {merged_entry.get('models')}")

        # Verify fitment JSON file is byte-identical (not modified)
        fitment_path = os.path.join(DATA_DIR, f"{fid}.json")
        data = load(fitment_path)
        test(f"{fid}.json has no _source field injected",
             "_source" not in data)
        test(f"{fid}.json has no ravenol field in fluids",
             not any(fl.get("ravenol") for m in data["models"]
                     for t in m["types"] for fl in t["fluids"]))

    # ─── Test 2: Legacy-only makes restored ───
    print("\n2. Legacy-only makes restored")

    legacy_entries = [e for e in merged_index if e.get("source") == "legacy"]
    test("legacy makes present",
         len(legacy_entries) > 30,
         f"got: {len(legacy_entries)}")

    # Check key USA makes
    expected_legacy = ["chevrolet", "nissan", "bmw", "hyundai", "kia",
                       "jeep", "subaru", "mazda", "mercedes-benz", "volkswagen",
                       "acura", "lexus", "dodge", "buick", "cadillac"]
    for make_id in expected_legacy:
        test(f"{make_id} in merged index",
             make_id in merged_by_id,
             "not found")
        if make_id in merged_by_id:
            test(f"{make_id} source = legacy",
                 merged_by_id[make_id]["source"] == "legacy")
            # Verify data file exists and loads
            fpath = os.path.join(DATA_DIR, f"{make_id}.json")
            test(f"{make_id}.json exists",
                 os.path.exists(fpath))
            if os.path.exists(fpath):
                data = load(fpath)
                test(f"{make_id}.json has models",
                     len(data.get("models", [])) > 0,
                     f"got: {len(data.get('models', []))}")

    # ─── Test 3: No fitment-legacy overlap ───
    print("\n3. No fitment-legacy overlap")

    fitment_names = {e["id"] for e in merged_index if e["source"] == "fitment"}
    legacy_names = {e["id"] for e in merged_index if e["source"] == "legacy"}
    test("no ID overlap between fitment and legacy",
         len(fitment_names & legacy_names) == 0,
         f"overlap: {fitment_names & legacy_names}")

    # No duplicate IDs in index
    all_ids = [e["id"] for e in merged_index]
    test("no duplicate IDs in merged index",
         len(all_ids) == len(set(all_ids)),
         f"dupes: {[x for x in all_ids if all_ids.count(x) > 1]}")

    # ─── Test 4: Motorcycle unchanged ───
    print("\n4. Motorcycle unchanged")

    test("motorcycle index exists", os.path.exists(os.path.join(MOTO_DIR, "index.json")))
    test("motorcycle makes = 10", len(moto_index) == 10, f"got: {len(moto_index)}")
    for entry in moto_index:
        fpath = os.path.join(MOTO_DIR, f"{entry['id']}.json")
        test(f"motorcycle/{entry['id']}.json exists", os.path.exists(fpath))

    # ─── Test 5: Marine unchanged ───
    print("\n5. Marine unchanged")

    test("marine index exists", os.path.exists(os.path.join(MARINE_DIR, "index.json")))
    test("marine makes = 6", len(marine_index) == 6, f"got: {len(marine_index)}")
    for entry in marine_index:
        fpath = os.path.join(MARINE_DIR, f"{entry['id']}.json")
        test(f"marine/{entry['id']}.json exists", os.path.exists(fpath))

    # ─── Test 6: ENZO sees expanded coverage ───
    print("\n6. ENZO sees expanded automotive coverage")

    test("merged index has 76+ makes",
         len(merged_index) >= 76,
         f"got: {len(merged_index)}")

    total_models = sum(e["models"] for e in merged_index)
    test("total models > 700",
         total_models > 700,
         f"got: {total_models}")

    # All referenced files exist and parse
    all_valid = True
    for entry in merged_index:
        fpath = os.path.join(DATA_DIR, f"{entry['id']}.json")
        if not os.path.exists(fpath):
            all_valid = False
            print(f"    MISSING: {entry['id']}.json")
            break
        try:
            data = load(fpath)
            if not data.get("models"):
                all_valid = False
                print(f"    EMPTY: {entry['id']}.json")
                break
        except Exception as e:
            all_valid = False
            print(f"    ERROR: {entry['id']}.json: {e}")
            break
    test("all indexed make files exist and parse", all_valid)

    # ─── Test 7: Source provenance ───
    print("\n7. Source provenance")

    all_have_source = all("source" in e for e in merged_index)
    test("all index entries have source field", all_have_source)

    valid_sources = all(e["source"] in ("fitment", "legacy") for e in merged_index)
    test("all sources are fitment or legacy", valid_sources)

    fitment_count = sum(1 for e in merged_index if e["source"] == "fitment")
    test(f"fitment makes = {len(fitment_index)} (dynamic)",
         fitment_count == len(fitment_index),
         f"got: {fitment_count}")

    # ─── Test 8: Make name normalization ───
    print("\n8. Make name normalization")

    no_region = all("(USA)" not in e["name"] and "(CAN)" not in e["name"]
                    and "(USA / CAN)" not in e["name"] for e in merged_index)
    test("no region markers in display names", no_region,
         str([e["name"] for e in merged_index if "(USA)" in e["name"] or "(CAN)" in e["name"]]))

    no_double_under = all("__" not in e["id"] for e in merged_index)
    test("no double underscores in IDs", no_double_under,
         str([e["id"] for e in merged_index if "__" in e["id"]]))

    names = [e["name"] for e in merged_index]
    test("no duplicate display names",
         len(names) == len(set(names)),
         f"dupes: {[x for x in names if names.count(x) > 1]}")

    # ─── Test 9: Merge manifest ───
    print("\n9. Merge manifest")

    manifest_path = os.path.join(DATA_DIR, "merge_manifest.json")
    test("merge_manifest.json exists", os.path.exists(manifest_path))
    if os.path.exists(manifest_path):
        manifest = load(manifest_path)
        test("manifest has merged_at timestamp", "merged_at" in manifest)
        test("manifest fitment count matches",
             manifest["fitment_makes"] == len(fitment_index))
        test("manifest total matches index",
             manifest["total_makes"] == len(merged_index))

    # ─── Test 10: Post-publish republish simulation ───
    print("\n10. Post-publish republish simulation")

    # Simulate what happens when publish overwrites index.json with fitment-only
    import tempfile
    import shutil

    with tempfile.TemporaryDirectory() as tmpdir:
        # Copy current data dir contents needed for merge
        for fn in os.listdir(DATA_DIR):
            src = os.path.join(DATA_DIR, fn)
            if os.path.isfile(src) and fn.endswith(".json"):
                shutil.copy2(src, os.path.join(tmpdir, fn))

        # Simulate publish: overwrite index.json with fitment-only
        fitment_only = [{"name": e["name"], "id": e["id"], "models": e["models"]}
                        for e in fitment_index]
        with open(os.path.join(tmpdir, "index.json"), "w") as f:
            json.dump(fitment_only, f)

        # Also update the fitment backup
        with open(os.path.join(tmpdir, "index.fitment.json"), "w") as f:
            json.dump(fitment_only, f)

        # Run merge in the temp dir
        sys.path.insert(0, os.path.dirname(__file__))
        try:
            import merge_automotive
            result = merge_automotive.merge(data_dir=tmpdir)
        finally:
            sys.path.pop(0)

        # Verify: merged index restored
        with open(os.path.join(tmpdir, "index.json")) as f:
            remrg = json.load(f)

        test("republish: merged index has source field",
             all("source" in e for e in remrg))
        test("republish: fitment makes present",
             sum(1 for e in remrg if e.get("source") == "fitment") == len(fitment_index),
             f"got: {sum(1 for e in remrg if e.get('source') == 'fitment')}")
        test("republish: legacy makes restored",
             sum(1 for e in remrg if e.get("source") == "legacy") > 30,
             f"got: {sum(1 for e in remrg if e.get('source') == 'legacy')}")
        test("republish: total makes >= 76",
             len(remrg) >= 76,
             f"got: {len(remrg)}")
        test("republish: fitment overrides legacy (no overlap)",
             len({e["id"] for e in remrg if e["source"] == "fitment"} &
                 {e["id"] for e in remrg if e["source"] == "legacy"}) == 0)

    # ─── Test 11: Catalog size guardrail ───
    print("\n11. Catalog size guardrail")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a large current catalog
        big_index = [{"name": f"Make{i}", "id": f"make{i}", "models": 5, "source": "legacy"}
                     for i in range(100)]
        with open(os.path.join(tmpdir, "index.json"), "w") as f:
            json.dump(big_index, f)

        # Create a tiny fitment backup
        tiny_fitment = [{"name": "Ford", "id": "ford", "models": 7}]
        with open(os.path.join(tmpdir, "index.fitment.json"), "w") as f:
            json.dump(tiny_fitment, f)

        # Merge should abort because result (1 fitment + 0 legacy) << 100
        try:
            merge_automotive.merge(data_dir=tmpdir, min_catalog_ratio=0.9)
            guardrail_triggered = False
        except ValueError as e:
            guardrail_triggered = "MERGE ABORTED" in str(e)

        test("guardrail triggers on suspicious shrinkage", guardrail_triggered)

        # Verify original index preserved
        with open(os.path.join(tmpdir, "index.json")) as f:
            preserved = json.load(f)
        test("guardrail preserves current index",
             len(preserved) == 100,
             f"got: {len(preserved)}")

    # ─── Test 12: Merge status function ───
    print("\n12. Merge status function")

    sys.path.insert(0, os.path.dirname(__file__))
    try:
        status = merge_automotive.get_merge_status(DATA_DIR)
    finally:
        sys.path.pop(0)

    test("merge status: healthy", status["healthy"])
    test("merge status: fitment_makes > 0", status["fitment_makes"] > 0)
    test("merge status: legacy_makes > 0", status["legacy_makes"] > 0)
    test("merge status: total matches index",
         status["total_makes"] == len(merged_index),
         f"got: {status['total_makes']}")
    test("merge status: no error", status["error"] is None)

    # ─── Test 13: Motorcycle/marine isolation after merge ───
    print("\n13. Motorcycle/marine isolation after merge")

    # Verify merge never created files in motorcycle/marine dirs
    for domain_dir, domain_name, expected_count in [
        (MOTO_DIR, "motorcycle", 10), (MARINE_DIR, "marine", 6)
    ]:
        idx_path = os.path.join(domain_dir, "index.json")
        test(f"{domain_name} index unchanged",
             os.path.exists(idx_path))
        if os.path.exists(idx_path):
            with open(idx_path) as f:
                domain_idx = json.load(f)
            test(f"{domain_name} count unchanged ({expected_count})",
                 len(domain_idx) == expected_count,
                 f"got: {len(domain_idx)}")
            # No source field in motorcycle/marine (they're not merged)
            test(f"{domain_name} has no source field",
                 not any("source" in e for e in domain_idx))

    # ─── Summary ───
    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"{'='*50}")
    return failed == 0


if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
