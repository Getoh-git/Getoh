# Getoh Data Engine (Kansai + Hokuriku)

## Schedule
GitHub Actions runs daily at **06:00 Asia/Bangkok** (`23:00 UTC`).
You can also run it manually from **GitHub → Actions → Getoh Data Engine - Daily Kansai + Hokuriku Refresh → Run workflow**.

## Free data sources
- **OpenStreetMap / Overpass API**: attractions, restaurants, cafes, shops, railway/public-transport stations and coordinates.
- **Open-Meteo**: seven-day weather forecast for Osaka, Kyoto, Nara and Kobe.
- **Events**: retained as curated data. No dependable, free, keyless region-wide events feed is configured, so the engine does not invent events.

## Files
- `data/kansai.json`: published snapshot consumed by the website.
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
- Public Overpass instances have fair-use limits. This workflow makes one combined POI query per daily run; do not add autocomplete calls to this endpoint.

## Important limitations
This is a daily snapshot, not live availability. Opening hours, prices, temporary closures, events and train timetables can change independently. Treat OSM opening hours as community-maintained and show source/update timestamps. The transport category contains station/place data, **not live departure times**. Do not replace official rail/bus timetable data with OSM.

## Local test
```bash
python -m py_compile scripts/getoh_data_engine.py
python scripts/getoh_data_engine.py
```
