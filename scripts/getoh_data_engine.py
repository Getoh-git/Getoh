#!/usr/bin/env python3
"""Getoh Kansai Data Engine.

Fetches bounded, city-by-city OSM POIs and Open-Meteo forecasts.
Keeps last-known-good category/weather data when a source fails or returns
an unexpectedly empty result. Writes data/kansai.json atomically.
"""
from __future__ import annotations

import json
import os
import sys
import time
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "kansai.json"
USER_AGENT = "Getoh-Kansai-Data-Engine/1.1 (open data travel planner)"
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
CITIES = {
    "osaka": {"name": "Osaka", "bbox": (34.55, 135.35, 34.82, 135.65), "lat": 34.6937, "lon": 135.5023},
    "kyoto": {"name": "Kyoto", "bbox": (34.90, 135.60, 35.15, 135.85), "lat": 35.0116, "lon": 135.7681},
    "nara": {"name": "Nara", "bbox": (34.60, 135.70, 34.75, 135.90), "lat": 34.6851, "lon": 135.8048},
    "kobe": {"name": "Kobe", "bbox": (34.60, 135.05, 34.80, 135.30), "lat": 34.6901, "lon": 135.1956},
}
CATEGORY_FILTERS = {
    "attractions": '["tourism"~"attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint|artwork|castle"]',
    "restaurants": '["amenity"~"restaurant|fast_food|food_court"]',
    "cafes": '["amenity"="cafe"]',
    "shopping": '["shop"]',
    "transport": '["public_transport"~"station|stop_position|platform"]',
}
CATEGORY_TAGS = {
    "attractions": ("tourism",),
    "restaurants": ("amenity",),
    "cafes": ("amenity",),
    "shopping": ("shop",),
    "transport": ("public_transport", "railway", "station"),
}

def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def load_existing():
    if not DATA_FILE.exists():
        return {
            "region": "Kansai",
            "updated_at": None,
            "categories": {k: [] for k in CATEGORY_FILTERS},
            "weather": {},
            "events": [],
            "meta": {},
        }
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("root JSON must be an object")
        data.setdefault("categories", {})
        for key in CATEGORY_FILTERS:
            data["categories"].setdefault(key, [])
        data.setdefault("weather", {})
        data.setdefault("events", [])
        data.setdefault("meta", {})
        data.setdefault("region", "Kansai")
        return data
    except Exception as exc:
        raise RuntimeError(f"Cannot read existing snapshot {DATA_FILE}: {exc}") from exc

def http_get_json(url, timeout=45):
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))

def fetch_overpass(query):
    last_error = None
    body = urlencode({"data": query}).encode()
    for endpoint in OVERPASS_URLS:
        try:
            req = Request(endpoint, data=body, headers={
                "User-Agent": USER_AGENT,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            })
            with urlopen(req, timeout=75) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return payload.get("elements", [])
        except Exception as exc:
            last_error = exc
            time.sleep(1.2)
    raise RuntimeError(str(last_error) if last_error else "All Overpass endpoints failed")

def classify_element(element, category, city_key):
    tags = element.get("tags") or {}
    center = element.get("center") or {}
    lat = element.get("lat", center.get("lat"))
    lon = element.get("lon", center.get("lon"))
    name = tags.get("name") or tags.get("name:en") or tags.get("brand")
    if not name or lat is None or lon is None:
        return None
    address_parts = [
        tags.get("addr:housenumber"), tags.get("addr:street"),
        tags.get("addr:suburb"), tags.get("addr:city"),
    ]
    return {
        "id": f"osm-{element.get('type', 'node')}-{element.get('id')}",
        "source": "OpenStreetMap",
        "osm_type": element.get("type"),
        "osm_id": element.get("id"),
        "name": name,
        "name_en": tags.get("name:en"),
        "category": category,
        "city": CITIES[city_key]["name"],
        "latitude": lat,
        "longitude": lon,
        "address": ", ".join(x for x in address_parts if x),
        "website": tags.get("website") or tags.get("contact:website"),
        "opening_hours": tags.get("opening_hours"),
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "wikidata": tags.get("wikidata"),
        "updated_at": utc_now(),
    }

def fetch_category(category):
    records = {}
    city_successes = 0
    errors = []
    selector = CATEGORY_FILTERS[category]
    for city_key, city in CITIES.items():
        south, west, north, east = city["bbox"]
        # Bound each query to one city and limit the number of returned objects.
        query = (
            '[out:json][timeout:60];('
            f'node{selector}({south},{west},{north},{east});'
            f'way{selector}({south},{west},{north},{east});'
            f'relation{selector}({south},{west},{north},{east});'
            ');out center tags 120;'
        )
        try:
            elements = fetch_overpass(query)
            city_successes += 1
            for element in elements:
                item = classify_element(element, category, city_key)
                if item:
                    records[item["id"]] = item
        except Exception as exc:
            errors.append(f"{city['name']}: {exc}")
    return list(records.values()), city_successes, errors

def fetch_weather():
    result, errors = {}, []
    for city_key, city in CITIES.items():
        params = {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "Asia/Tokyo",
            "forecast_days": 7,
        }
        try:
            payload = http_get_json("https://api.open-meteo.com/v1/forecast?" + urlencode(params), timeout=30)
            daily = payload.get("daily", {})
            dates = daily.get("time", [])
            result[city_key] = {
                "city": city["name"],
                "source": "Open-Meteo",
                "latitude": city["lat"],
                "longitude": city["lon"],
                "timezone": payload.get("timezone", "Asia/Tokyo"),
                "daily": [
                    {
                        "date": day,
                        "weather_code": daily.get("weather_code", [None] * len(dates))[i],
                        "temperature_max_c": daily.get("temperature_2m_max", [None] * len(dates))[i],
                        "temperature_min_c": daily.get("temperature_2m_min", [None] * len(dates))[i],
                        "precipitation_probability_max": daily.get("precipitation_probability_max", [None] * len(dates))[i],
                    }
                    for i, day in enumerate(dates)
                ],
                "updated_at": utc_now(),
            }
        except Exception as exc:
            errors.append(f"{city['name']}: {exc}")
    return result, errors

def atomic_write(data):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="kansai-", suffix=".json", dir=DATA_FILE.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp_name, DATA_FILE)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)

def main():
    snapshot = load_existing()
    now = utc_now()
    counts, failures = {}, []
    successful_sources = 0

    for category in CATEGORY_FILTERS:
        fresh, city_successes, errors = fetch_category(category)
        counts[category] = len(fresh)
        if errors:
            failures.extend([f"{category}: {e}" for e in errors])
        # Only replace an existing category with a non-empty fresh result.
        if fresh:
            snapshot["categories"][category] = fresh
            successful_sources += 1
        elif city_successes == len(CITIES):
            failures.append(f"{category}: all city queries returned no named POIs; kept previous snapshot")
        else:
            failures.append(f"{category}: no usable fresh data; kept previous snapshot")

    fresh_weather, weather_errors = fetch_weather()
    if weather_errors:
        failures.extend([f"weather: {e}" for e in weather_errors])
    if fresh_weather:
        snapshot["weather"].update(fresh_weather)
        successful_sources += 1

    if successful_sources == 0:
        print(json.dumps({"status": "failed", "reason": "No source returned usable data", "failures": failures}, ensure_ascii=False))
        return 2

    snapshot["region"] = "Kansai"
    snapshot["updated_at"] = now
    snapshot["meta"] = {
        "engine_version": "1.1",
        "status": "partial" if failures else "success",
        "counts": counts,
        "weather_cities_updated": len(fresh_weather),
        "failures": failures,
        "last_attempt_at": now,
        "sources": ["OpenStreetMap (Overpass API)", "Open-Meteo"],
        "events_note": "Events are retained as curated data; no verified free keyless regional events feed is configured.",
    }
    atomic_write(snapshot)
    print(json.dumps({
        "status": snapshot["meta"]["status"],
        "counts": counts,
        "weather_cities_updated": len(fresh_weather),
        "failures": failures,
        "snapshot": str(DATA_FILE.relative_to(ROOT)),
    }, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    sys.exit(main())
