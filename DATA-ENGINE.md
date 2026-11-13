# Getoh Data Engine (Kansai + Hokuriku)

## Schedule
GitHub Actions runs daily at **06:00 Asia/Bangkok** (`23:00 UTC`).
You can also run it manually from **GitHub → Actions → Getoh Data Engine - Daily Kansai + Hokuriku Refresh → Run workflow**.

## Free data sources
- **OpenStreetMap / Overpass API**: attractions, restaurants, cafes, shops, railway/public-transport stations and coordinates.
- **Open-Meteo**: seven-day weather forecast for Osaka, Kyoto, Nara and Kobe.
- **Events**: retained as curated data. No dependable, free, keyless region-wide events feed is configured, so the engine does not invent events.

## Files
- `data/kansai.json`: published snapshot consumed by the website. Records now carry `subtype` (OSM shop/tourism/amenity value), `cuisine`, `brand`, `name_th` where OSM has them.
- `scripts/getoh_data_engine.py`: fetch, normalize, validate and safely write data.
- `.github/workflows/daily-getoh-data.yml`: daily scheduler.

## Safety
- A source failure keeps its previous category/snapshot.
- An empty Overpass result never clears a non-empty category.
- Writes use a temporary file and atomic replacement.
- The job does not commit when there are no changes.
- `meta.source_status` and `meta.failures` explain each run.
- OSM data must be attributed to OpenStreetMap contributors. Keep attribution visible in the UI and follow ODbL.
- Open-Meteo free API is intended for non-commercial use; review its current terms before commercial deployment.
- Public Overpass instances have fair-use limits. Engine v1.2 makes 9 focused queries per city (shopping is split into 5 so tourist-relevant shops are not crowded out by convenience stores, salons and car dealers), waits 1.5 s between queries, retries failed endpoints, and stops querying after a 20-minute time budget (the workflow timeout is 25). Do not add per-keystroke autocomplete calls to this endpoint; search runs in the browser on the snapshot.
- Per-city merge: if one city times out, that city keeps its previous records while the other cities are refreshed. `meta.city_counts` shows how many records each city has per category.

## Important limitations
This is a daily snapshot, not live availability. Opening hours, prices, temporary closures, events and train timetables can change independently. Treat OSM opening hours as community-maintained and show source/update timestamps. The transport category contains station/place data, **not live departure times**. Do not replace official rail/bus timetable data with OSM.

## Local test
```bash
python -m py_compile scripts/getoh_data_engine.py
python scripts/getoh_data_engine.py
```

## Search in the app (plan.js)
The place panel searches Thai, English and Japanese. Thai brand/category words (ดองกิ, ยูนิโคล่, ร้านยา, ห้าง ...) are expanded through the `GD_ALIASES` table at the top of the search code in `plan.js`; add a line there to teach it a new word. Shopping results are grouped (department store, supermarket, drugstore, variety, electronics, fashion, souvenir, books/hobby, home, food/drink). Convenience stores and car/hair/laundry services are hidden from "all" until you search, pick their chip, or tap the toggle. For snapshots created before v1.2 (no `subtype`) the group is guessed from the store name.
