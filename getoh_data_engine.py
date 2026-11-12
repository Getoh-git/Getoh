#!/usr/bin/env python3
"""Getoh Data Engine: refresh Kansai open-data snapshots safely.

Sources:
- OpenStreetMap Overpass API: places, food, shopping and transport POIs.
- Open-Meteo: daily weather forecast snapshots (not historical observations).
Events are deliberately retained from the existing curated file: there is no
reliable free, keyless, region-wide event feed configured in this project.
A failed source never replaces its last known-good data.
"""
from __future__ import annotations
import datetime as dt
import json
import os
import pathlib
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "kansai.json"
USER_AGENT = "GetohDataEngine/1.0 (open-source travel planner; contact: repository maintainer)"
OVERPASS = os.getenv("GETOH_OVERPASS_URL", "https://overpass-api.de/api/interpreter")
CITIES = {
    "osaka": {"name": "Osaka", "lat": 34.6937, "lon": 135.5023},
    "kyoto": {"name": "Kyoto", "lat": 35.0116, "lon": 135.7681},
    "nara": {"name": "Nara", "lat": 34.6851, "lon": 135.8048},
    "kobe": {"name": "Kobe", "lat": 34.6901, "lon": 135.1956},
}
CATEGORIES = ("attractions", "restaurants", "cafes", "shopping", "transport")
RADIUS = 22000


def now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def load_old():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {
            "schema_version": 1,
            "region": "Kansai, Japan",
            "meta": {},
            "places": {k: [] for k in CATEGORIES},
            "weather": {},
            "events": [],
        }


def request(url: str, data: bytes | None = None, timeout=90):
    req = urllib.request.Request(
        url, data=data,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        method="POST" if data is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        body = response.read(18 * 1024 * 1024 + 1)
    if len(body) > 18 * 1024 * 1024:
        raise RuntimeError("response exceeded 18 MB safety limit")
    return json.loads(body.decode("utf-8"))


def overpass_query():
    clauses = []
    for c in CITIES.values():
        lat, lon = c["lat"], c["lon"]
        around = f"(around:{RADIUS},{lat},{lon})"
        clauses.extend([
            f'nwr["tourism"~"attraction|museum|viewpoint|theme_park|zoo|aquarium|gallery"]{around};',
            f'nwr["amenity"="restaurant"]{around};',
            f'nwr["amenity"="cafe"]{around};',
            f'nwr["shop"]{around};',
            f'nwr["railway"~"station|halt"]{around};',
            f'nwr["public_transport"="station"]{around};',
        ])
    return "[out:json][timeout:75];(" + "".join(clauses) + ");out center tags;"


def classify(tags: dict[str, Any]):
    tourism = tags.get("tourism", "")
    amenity = tags.get("amenity", "")
    shop = tags.get("shop", "")
    railway = tags.get("railway", "")
    public_transport = tags.get("public_transport", "")
    if amenity == "restaurant":
        return "restaurants"
    if amenity == "cafe":
        return "cafes"
    if shop:
        return "shopping"
    if railway in ("station", "halt") or public_transport == "station":
        return "transport"
    if tourism in ("attraction", "museum", "viewpoint", "theme_park", "zoo", "aquarium", "gallery"):
        return "attractions"
    return None


def normalize_element(el):
    tags = el.get("tags") or {}
    category = classify(tags)
    if not category:
        return None
    center = el.get("center") or {}
    lat = el.get("lat", center.get("lat"))
    lon = el.get("lon", center.get("lon"))
    if lat is None or lon is None:
        return None
    name = tags.get("name") or tags.get("name:en") or tags.get("name:ja")
    if not name:
        return None
    return {
        "id": f"osm:{el.get('type')}:{el.get('id')}",
        "source": "OpenStreetMap",
        "source_url": f"https://www.openstreetmap.org/{el.get('type')}/{el.get('id')}",
        "name": name,
        "name_en": tags.get("name:en"),
        "name_ja": tags.get("name:ja"),
        "category": category,
        "lat": round(float(lat), 6),
        "lon": round(float(lon), 6),
        "address": ", ".join(x for x in [
            tags.get("addr:street"), tags.get("addr:city") or tags.get("addr:district")
        ] if x) or None,
        "website": tags.get("website") or tags.get("contact:website"),
        "opening_hours": tags.get("opening_hours"),
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "wikidata": tags.get("wikidata"),
        "updated_at": now_iso(),
    }


def fetch_places():
    query = overpass_query().encode("utf-8")
    result = request(OVERPASS, data=urllib.parse.urlencode({"data": query.decode()}).encode(), timeout=180)
    if not isinstance(result, dict) or not isinstance(result.get("elements"), list):
        raise RuntimeError("Overpass response did not contain elements")
    buckets = {k: {} for k in CATEGORIES}
    for el in result["elements"]:
        item = normalize_element(el)
        if item:
            buckets[item["category"]][item["id"]] = item
    # Empty results are suspicious; don't erase a known-good category.
    return {k: list(v.values()) for k, v in buckets.items()}, len(result["elements"])


def fetch_weather():
    output = {}
    for city_id, city in CITIES.items():
        params = urllib.parse.urlencode({
            "latitude": city["lat"], "longitude": city["lon"],
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "Asia/Tokyo", "forecast_days": 7,
        })
        result = request("https://api.open-meteo.com/v1/forecast?" + params, timeout=30)
        daily = result.get("daily")
        if not daily or not daily.get("time"):
            raise RuntimeError(f"Weather response invalid for {city_id}")
        output[city_id] = {
            "city": city["name"],
            "source": "Open-Meteo",
            "source_url": "https://open-meteo.com/",
            "timezone": result.get("timezone", "Asia/Tokyo"),
            "fetched_at": now_iso(),
            "daily": daily,
        }
        time.sleep(0.25)
    return output


def atomic_write(payload):
    DATA.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".kansai-", suffix=".json", dir=DATA)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp, OUT)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def main():
    old = load_old()
    new = dict(old)
    new["schema_version"] = 1
    new["region"] = "Kansai, Japan"
    new.setdefault("places", {})
    new.setdefault("weather", {})
    new.setdefault("events", [])
    new.setdefault("meta", {})
    status = {}
    failures = []

    try:
        buckets, raw_count = fetch_places()
        for category, rows in buckets.items():
            if rows:
                new["places"][category] = rows
                status[category] = {"status": "updated", "count": len(rows)}
            elif new["places"].get(category):
                status[category] = {"status": "kept_previous", "count": len(new["places"][category]), "reason": "empty source response"}
            else:
                new["places"][category] = []
                status[category] = {"status": "empty", "count": 0}
        new["meta"]["places_fetched_at"] = now_iso()
        new["meta"]["places_source"] = "OpenStreetMap Overpass API"
        new["meta"]["places_raw_elements"] = raw_count
    except Exception as exc:
        failures.append(f"places: {exc}")
        for category in CATEGORIES:
            status[category] = {"status": "kept_previous", "count": len(new["places"].get(category, [])), "reason": str(exc)[:300]}

    try:
        new["weather"] = fetch_weather()
        new["meta"]["weather_fetched_at"] = now_iso()
        status["weather"] = {"status": "updated", "cities": len(new["weather"])}
    except Exception as exc:
        failures.append(f"weather: {exc}")
        status["weather"] = {"status": "kept_previous", "cities": len(new.get("weather", {})), "reason": str(exc)[:300]}

    # No dependable free/keyless regional events feed is configured yet.
    # Preserve manually curated events; never fabricate or clear them.
    status["events"] = {
        "status": "kept_curated",
        "count": len(new.get("events", [])),
        "reason": "No verified free regional events feed configured",
    }
    new["meta"]["last_run_at"] = now_iso()
    new["meta"]["last_run_status"] = "partial" if failures else "success"
    new["meta"]["source_status"] = status
    new["meta"]["failures"] = failures

    # Require at least one successful data source; otherwise do not touch the file.
    if not any(status.get(k, {}).get("status") == "updated" for k in ("attractions", "restaurants", "cafes", "shopping", "transport", "weather")):
        print("No source succeeded; retaining the complete previous snapshot.", file=sys.stderr)
        return 2
    atomic_write(new)
    print(json.dumps({"status": new["meta"]["last_run_status"], "counts": {
        k: len(new["places"].get(k, [])) for k in CATEGORIES
    }, "weather_cities": len(new["weather"]), "failures": failures}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
