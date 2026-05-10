#!/usr/bin/env python3
"""
Geocode every resource address against OpenStreetMap Nominatim.

Usage:
    python3 scripts/geocode.py            # write changes to data/resources.json
    python3 scripts/geocode.py --dry-run  # print what would change, write nothing

Notes:
- Nominatim is free but rate-limited (1 request/second). This script obeys that.
- For ~35 resources expect about 60 seconds end to end.
- If an address can't be found, the script tries progressively coarser fallbacks
  (drop suite/floor, drop ZIP, fall back to city center) and reports it.
- Existing coordinates are kept if Nominatim can't find anything at all.
"""

from __future__ import annotations
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "resources.json"

NOMINATIM = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "providence-immigrant-resources/1.0 (https://github.com/lukenguyenlose/providence-immigrant-resources)"

DRY_RUN = "--dry-run" in sys.argv


def http_get_json(url: str, params: dict) -> list[dict]:
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{qs}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize(addr: str) -> str:
    """Strip suite/floor/apt indicators that confuse Nominatim."""
    # Remove patterns like ", Suite 101" / ", #410" / ", 4th floor" / ", 3rd Floor"
    patterns = [
        r",?\s*Suite\s+\S+",
        r",?\s*Ste\.?\s+\S+",
        r",?\s*#\s*\S+",
        r",?\s*\d+(st|nd|rd|th)\s+[Ff]loor",
        r",?\s*Apt\.?\s+\S+",
    ]
    cleaned = addr
    for p in patterns:
        cleaned = re.sub(p, "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip().rstrip(",")


def attempt(query: str) -> tuple[float, float] | None:
    try:
        results = http_get_json(NOMINATIM, {"q": query, "format": "json", "limit": 1, "countrycodes": "us"})
        time.sleep(1.1)  # respect Nominatim's 1 req/sec policy
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        print(f"    network error: {e}")
        time.sleep(1.1)
    return None


def geocode(address: str) -> tuple[float, float, str] | None:
    """Try progressively coarser queries. Returns (lat, lng, strategy) or None."""
    cleaned = normalize(address)

    # 1) Exact cleaned address
    print(f"    -> trying: {cleaned}")
    hit = attempt(cleaned)
    if hit:
        return hit[0], hit[1], "exact"

    # 2) Drop the ZIP code
    no_zip = re.sub(r",?\s*\d{5}(-\d{4})?\s*$", "", cleaned).strip().rstrip(",")
    if no_zip != cleaned:
        print(f"    -> trying (no zip): {no_zip}")
        hit = attempt(no_zip)
        if hit:
            return hit[0], hit[1], "no-zip"

    # 3) Just street + city (drop everything after first comma after the city)
    parts = [p.strip() for p in cleaned.split(",")]
    if len(parts) >= 3:
        coarse = ", ".join(parts[:3])  # "123 Main St, City, RI"
        if coarse != cleaned and coarse != no_zip:
            print(f"    -> trying (street+city+state): {coarse}")
            hit = attempt(coarse)
            if hit:
                return hit[0], hit[1], "street+city"

    return None


def main() -> int:
    if not DATA.exists():
        print(f"ERROR: {DATA} not found", file=sys.stderr)
        return 1

    data = json.loads(DATA.read_text())
    resources = data["resources"]

    print(f"Geocoding {len(resources)} addresses against OpenStreetMap...")
    print(f"(rate-limited to 1 request/sec — this will take ~{len(resources) * 1.5:.0f}s)\n")

    changed = 0
    failed: list[tuple[str, str]] = []
    skipped: list[str] = []
    summary: list[tuple[str, str, str, float, float, float, float]] = []

    for i, r in enumerate(resources, 1):
        print(f"[{i}/{len(resources)}] {r['id']}: {r['address']}")

        # Skip "rotating" or no-fixed-address entries
        if "rotating" in r["address"].lower() or "multiple" in r["address"].lower():
            print("    skipped (no fixed address)")
            skipped.append(r["id"])
            continue

        result = geocode(r["address"])
        if result is None:
            print(f"    !! NOT FOUND — keeping existing lat,lng = {r['lat']}, {r['lng']}")
            failed.append((r["id"], r["address"]))
            continue

        new_lat, new_lng, strategy = result
        old_lat, old_lng = r["lat"], r["lng"]
        # Round to 5 decimal places (~1.1 m precision, plenty for a map pin)
        new_lat = round(new_lat, 5)
        new_lng = round(new_lng, 5)

        delta = max(abs(new_lat - old_lat), abs(new_lng - old_lng))
        print(f"    -> got ({new_lat}, {new_lng}) via {strategy}; delta={delta:.5f}")

        summary.append((r["id"], r["address"], strategy, old_lat, old_lng, new_lat, new_lng))

        if (new_lat, new_lng) != (old_lat, old_lng):
            r["lat"] = new_lat
            r["lng"] = new_lng
            changed += 1

    print()
    print("=" * 60)
    print(f"Updated: {changed}/{len(resources)}")
    print(f"Skipped: {len(skipped)} — {skipped}" if skipped else "Skipped: 0")
    print(f"Failed:  {len(failed)}" + ("" if not failed else " — see below"))
    for fid, faddr in failed:
        print(f"   - {fid}: {faddr}")

    if DRY_RUN:
        print("\nDry run — no file written.")
    else:
        data["lastUpdated"] = time.strftime("%Y-%m-%d")
        DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"\nWrote {DATA}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
