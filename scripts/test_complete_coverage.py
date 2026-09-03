#!/usr/bin/env python3
"""Regression tests for complete, fitment-first automotive coverage."""

import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
FITMENT_INDEX = DATA_DIR / "index.fitment.json"
COVERAGE_FILES = ROOT / "scripts" / "coverage-files.txt"
MERGED_INDEX = DATA_DIR / "index.json"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CompleteCoverageTests(unittest.TestCase):
    def merged_make(self, name: str):
        entry = next(item for item in load(MERGED_INDEX) if item["name"] == name)
        return entry, load(DATA_DIR / f"{entry['id']}.json")

    def test_coverage_index_keeps_last_known_complete_floor(self):
        self.assertTrue(COVERAGE_FILES.exists(), "missing durable coverage inventory")
        ids = [line.strip() for line in COVERAGE_FILES.read_text().splitlines()
               if line.strip() and not line.startswith("#")]
        self.assertGreaterEqual(len(ids), 120)
        coverage = [load(DATA_DIR / f"{item_id}.json") for item_id in ids]
        self.assertGreaterEqual(sum(len(item["models"]) for item in coverage), 2026)

    def test_live_index_keeps_complete_floor(self):
        merged = load(MERGED_INDEX)
        self.assertGreaterEqual(len(merged), 120)
        self.assertGreaterEqual(sum(item["models"] for item in merged), 2026)

    def test_fitment_makes_retain_non_overlapping_legacy_models(self):
        expected = {
            "Ford": "F-150",
            "Honda": "Accord",
            "Toyota": "RAV4",
        }
        for make, model_fragment in expected.items():
            with self.subTest(make=make):
                entry, data = self.merged_make(make)
                self.assertEqual(entry["source"], "legacy")
                self.assertEqual(entry["coverage"], "mixed")
                self.assertTrue(
                    any(model_fragment.casefold() in model["name"].casefold()
                        for model in data["models"]),
                    f"{make} is missing {model_fragment}",
                )

    def test_fitment_source_files_remain_byte_identical_after_merge(self):
        sys.path.insert(0, str(ROOT / "scripts"))
        try:
            import merge_automotive
        finally:
            sys.path.pop(0)

        fitment = load(FITMENT_INDEX)
        before = {
            item["id"]: sha256(DATA_DIR / f"{item['id']}.json")
            for item in fitment
        }

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            for path in DATA_DIR.glob("*.json"):
                shutil.copy2(path, tmpdir / path.name)

            merge_automotive.merge(data_dir=str(tmpdir))

            for item in fitment:
                self.assertEqual(
                    before[item["id"]],
                    sha256(tmpdir / f"{item['id']}.json"),
                    f"fitment source file changed: {item['id']}.json",
                )

            merged = load(tmpdir / "index.json")
            self.assertGreaterEqual(len(merged), 120)
            self.assertGreaterEqual(sum(item["models"] for item in merged), 2026)


if __name__ == "__main__":
    unittest.main(verbosity=2)
