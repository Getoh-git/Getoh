const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');

const { setGlobalOptions } = require('firebase-functions/v2');
setGlobalOptions({ maxInstances: 3 });

// Public endpoint for the static GitHub Pages client. Replace the CORS origin
// below with your actual GitHub Pages/custom domain before deploying. Restrict
// the Google API key to Places API (New), and set API quotas/budget alerts.
const RATE = new Map();
exports.placesLookup = onRequest(
  { region: 'asia-northeast1', secrets: [GOOGLE_PLACES_API_KEY], cors: ['https://getoh-git.github.io'], maxInstances: 5 },
  async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // จำกัดการเรียกต่อ IP (best-effort ต่ออินสแตนซ์) กันคนยิงตรงจนค่า API บาน
    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const now = Date.now(), hits = (RATE.get(ip) || []).filter(t => now - t < 60000);
    if (hits.length >= 90) return res.status(429).json({ error: 'เรียกถี่เกินไป ลองใหม่ใน 1 นาที' });
    hits.push(now); RATE.set(ip, hits); if (RATE.size > 5000) RATE.clear();

    const mode = String((req.body && req.body.mode) || '');
    const query = String((req.body && req.body.query) || '').trim().slice(0, 180);

    // Hotel search: Google Places is used as a live discovery source only.
    // Persist only Place IDs in Firebase; do not cache Places names, addresses, photos or reviews.
    if (mode === 'hotelSearch') {
      if (query.length < 2) return res.status(400).json({ error: 'กรุณาระบุชื่อโรงแรมหรือพื้นที่' });
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.value(),
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.location'
          },
          body: JSON.stringify({ textQuery: query, languageCode: 'th', regionCode: 'JP', includedType: 'lodging', strictTypeFiltering: true, pageSize: 10 })
        });
        const payload = await response.json();
        if (!response.ok) {
          console.error('Google hotel search error', response.status, payload);
          return res.status(502).json({ error: 'ค้นหาโรงแรมจาก Google Places ไม่สำเร็จ กรุณาตรวจ API และ Billing' });
        }
        return res.status(200).json({
          places: (payload.places || []).map(p => ({
            id: p.id, name: p.displayName && p.displayName.text || '', address: p.formattedAddress || '',
            rating: p.rating, userRatingCount: p.userRatingCount, googleMapsUri: p.googleMapsUri || '',
            websiteUri: p.websiteUri || '', location: p.location || null
          })), attribution: 'Google Maps'
        });
      } catch (error) {
        console.error('hotelSearch failed', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหาโรงแรม' });
      }
    }

    if (mode === 'hotelDetails') {
      const placeId = String((req.body && req.body.placeId) || '').trim();
      if (!placeId || placeId.length > 200) return res.status(400).json({ error: 'Place ID ไม่ถูกต้อง' });
      try {
        const response = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId), {
          headers: {
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.value(),
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,websiteUri,location'
          }
        });
        const place = await response.json();
        if (!response.ok) return res.status(502).json({ error: 'โหลดรายละเอียดโรงแรมไม่สำเร็จ' });
        return res.status(200).json({ place: {
          id: place.id, name: place.displayName && place.displayName.text || '', address: place.formattedAddress || '',
          rating: place.rating, userRatingCount: place.userRatingCount, googleMapsUri: place.googleMapsUri || '',
          websiteUri: place.websiteUri || '', location: place.location || null
        }, attribution: 'Google Maps' });
      } catch (error) {
        console.error('hotelDetails failed', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดรายละเอียดโรงแรม' });
      }
    }

    if (query.length < 2) return res.status(400).json({ error: 'กรุณาระบุชื่อสถานที่' });

    // ส่งพิกัดมาด้วยเพื่อให้ได้สาขา/ร้านที่ตรงจริง (ชื่ออย่าง ファミリーマート มีหลายร้อยสาขา)
    const lat = Number(req.body && req.body.latitude), lon = Number(req.body && req.body.longitude);
    const hasCoord = Number.isFinite(lat) && Number.isFinite(lon) && lat > 20 && lat < 46 && lon > 122 && lon < 154; // อยู่ในญี่ปุ่น
    const searchBody = { textQuery: query, languageCode: 'th', regionCode: 'JP', pageSize: 1 };
    // locationRestriction = จำกัดผลในกรอบ ~300 ม. จริง ๆ (locationBias เป็นแค่ถ่วงน้ำหนัก อาจได้สาขาอื่น)
    if (hasCoord) searchBody.locationRestriction = { rectangle: {
      low: { latitude: lat - 0.003, longitude: lon - 0.0035 },
      high: { latitude: lat + 0.003, longitude: lon + 0.0035 }
    } };
    else return res.status(400).json({ error: 'ต้องระบุพิกัดร้าน' });

    // mode=rating: ขอเฉพาะคะแนน/จำนวนรีวิว (ไม่ขอรีวิว/เวลาเปิด/เว็บไซต์ ซึ่งเป็นฟิลด์ที่คิดเงินแพงกว่า) ใช้โหลดอัตโนมัติ
    const lite = req.body && req.body.mode === 'rating';
    const fieldMask = lite
      ? ['places.id', 'places.displayName', 'places.rating', 'places.userRatingCount', 'places.googleMapsUri']
      : ['places.id', 'places.displayName', 'places.formattedAddress', 'places.rating', 'places.userRatingCount',
         'places.reviews', 'places.googleMapsUri', 'places.websiteUri', 'places.regularOpeningHours'];
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.value(),
          'X-Goog-FieldMask': fieldMask.join(',')
        },
        body: JSON.stringify(searchBody)
      });
      const payload = await response.json();
      if (!response.ok) {
        console.error('Google Places API error', response.status, payload);
        return res.status(502).json({ error: 'Google Places API ตอบกลับไม่สำเร็จ กรุณาตรวจ API และ Billing' });
      }
      const p = (payload.places || [])[0];
      if (!p) return res.status(404).json({ error: 'ไม่พบสถานที่ที่ตรงกัน' });
      return res.status(200).json({
        place: {
          id: p.id,
          name: p.displayName && p.displayName.text,
          address: p.formattedAddress || '',
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          reviews: (p.reviews || []).slice(0, 5),
          googleMapsUri: p.googleMapsUri || '',
          websiteUri: p.websiteUri || '',
          regularOpeningHours: p.regularOpeningHours || null
        },
        attribution: 'Google Places'
      });
    } catch (error) {
      console.error('placesLookup failed', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูลสถานที่' });
    }
  }
);


// Flight Monitor — Manual refresh only. Configure with:
// firebase functions:secrets:set FLIGHTAWARE_API_KEY
const FLIGHTAWARE_API_KEY = defineSecret('FLIGHTAWARE_API_KEY');
const FLIGHT_DB = 'https://osaka-trip-b03a0-default-rtdb.asia-southeast1.firebasedatabase.app';
const FLIGHT_CORS = ['https://getoh-git.github.io'];
const flightIso = d => d.toISOString().replace('.000Z', 'Z');
const flightDelay = (actual, scheduled) => {
  if (!actual || !scheduled) return null;
  const n = Math.round((Date.parse(actual) - Date.parse(scheduled)) / 60000);
  return Number.isFinite(n) ? n : null;
};
const flightStatus = f => {
  if (f.cancelled) return 'Cancelled';
  const s = String(f.status || '').toLowerCase();
  if (f.actual_in || /landed|arrived/.test(s)) return 'Landed';
  if (f.actual_out || /airborne|en.?route|in.?flight/.test(s)) return 'Airborne';
  if (/delay/.test(s)) return 'Delayed';
  if (/scheduled|filed|expected|on.?time/.test(s)) return 'Scheduled';
  return f.status || 'Unknown';
};
async function aeroFlights(ident, start, end, apiKey) {
  const url = new URL(`https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`);
  url.searchParams.set('start', flightIso(start));
  url.searchParams.set('end', flightIso(end));
  url.searchParams.set('max_pages', '3');
  const response = await fetch(url, { headers: { 'x-apikey': apiKey, 'Accept': 'application/json' } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && payload.errors && payload.errors[0] && payload.errors[0].message;
    throw new Error(message || `FlightAware API HTTP ${response.status}`);
  }
  return Array.isArray(payload.flights) ? payload.flights : [];
}
function matchFlight(f, config) {
  const origin = f.origin && (f.origin.code || f.origin.code_iata);
  const destination = f.destination && (f.destination.code || f.destination.code_iata);
  return (!origin || origin === config.from) && (!destination || destination === config.to);
}
function summarizeFlightHistory(rows) {
  const completed = rows.filter(f => f.actual_out || f.actual_in);
  const departureDelays = completed.map(f => flightDelay(f.actual_out, f.scheduled_out)).filter(v => v !== null);
  const arrivalDelays = completed.map(f => flightDelay(f.actual_in, f.scheduled_in)).filter(v => v !== null);
  const onTime = departureDelays.filter(v => v <= 15).length;
  const averagePositive = values => {
    const late = values.filter(v => v > 0);
    return late.length ? Math.round(late.reduce((a, b) => a + b, 0) / late.length) : 0;
  };
  return {
    sampleSize: completed.length,
    onTimeRate: departureDelays.length ? Math.round(onTime / departureDelays.length * 1000) / 10 : null,
    averageDepartureDelay: departureDelays.length ? averagePositive(departureDelays) : null,
    averageArrivalDelay: arrivalDelays.length ? averagePositive(arrivalDelays) : null,
    cancelled: rows.filter(f => f.cancelled).length,
    periodDays: 365,
    calculatedAt: Date.now()
  };
}
exports.flightMonitor = onRequest(
  { region: 'asia-northeast1', secrets: [FLIGHTAWARE_API_KEY], cors: FLIGHT_CORS, timeoutSeconds: 540, memory: '512MiB', maxInstances: 2 },
  async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const flights = req.body && req.body.flights;
      if (!Array.isArray(flights) || flights.length < 1 || flights.length > 4) {
        return res.status(400).json({ error: 'ข้อมูลเที่ยวบินไม่ถูกต้อง' });
      }
      for (const f of flights) {
        if (!f || !/^[A-Z0-9]{2,3}\d{1,4}$/.test(String(f.no || '').toUpperCase()) ||
            !/^[A-Z]{3}$/.test(String(f.from || '')) || !/^[A-Z]{3}$/.test(String(f.to || '')) ||
            !Number.isFinite(Date.parse(f.dep)) || !Number.isFinite(Date.parse(f.arr))) {
          return res.status(400).json({ error: 'หมายเลขเที่ยวบิน สนามบิน หรือวันเดินทางไม่ถูกต้อง' });
        }
      }

      const apiKey = FLIGHTAWARE_API_KEY.value();
      const checkedAt = Date.now();
      const current = {}, history = {};
      for (const config of flights) {
        const ident = String(config.no).toUpperCase();
        const scheduled = new Date(config.dep);
        // Query the scheduled flight window. Before departure this retrieves filed/estimated data;
        // after arrival it can return actual times and final status.
        const liveRows = await aeroFlights(
          ident, new Date(scheduled.getTime() - 36 * 3600000),
          new Date(scheduled.getTime() + 48 * 3600000), apiKey
        );
        const live = liveRows.filter(f => matchFlight(f, config))
          .sort((a, b) => Math.abs(Date.parse(a.scheduled_out || 0) - scheduled) - Math.abs(Date.parse(b.scheduled_out || 0) - scheduled))[0];

        const currentRecord = live ? {
          flightNumber: ident,
          status: flightStatus(live),
          scheduledOut: live.scheduled_out || config.dep,
          estimatedOut: live.estimated_out || null,
          actualOut: live.actual_out || null,
          scheduledIn: live.scheduled_in || config.arr,
          estimatedIn: live.estimated_in || null,
          actualIn: live.actual_in || null,
          departureDelayMinutes: flightDelay(live.actual_out || live.estimated_out, live.scheduled_out),
          arrivalDelayMinutes: flightDelay(live.actual_in || live.estimated_in, live.scheduled_in),
          checkedAt,
          source: 'FlightAware AeroAPI'
        } : {
          flightNumber: ident, status: 'Unavailable',
          scheduledOut: config.dep, scheduledIn: config.arr,
          checkedAt, source: 'FlightAware AeroAPI',
          message: 'ไม่พบข้อมูลเที่ยวบินในช่วงเวลาที่ค้นหา'
        };
        current[ident] = currentRecord;

        // Retrieve a rolling 12-month history in monthly windows to avoid oversized requests.
        const rowsByKey = new Map();
        const end = new Date();
        const start = new Date(end.getTime() - 365 * 86400000);
        for (let cursor = new Date(start); cursor < end;) {
          const next = new Date(cursor);
          next.setUTCDate(next.getUTCDate() + 30);
          if (next > end) next.setTime(end.getTime());
          const rows = await aeroFlights(ident, cursor, next, apiKey);
          for (const row of rows) {
            if (!matchFlight(row, config)) continue;
            const key = row.fa_flight_id || `${row.ident || ident}_${row.scheduled_out || ''}`;
            rowsByKey.set(key, row);
          }
          cursor = next;
        }
        const rows = [...rowsByKey.values()];
        history[ident] = summarizeFlightHistory(rows);
      }

      // Write each permitted leaf path so the child-level RTDB rules are applied.
      let saved = true;
      for (const [ident, value] of Object.entries(current)) {
        const write = await fetch(`${FLIGHT_DB}/flightMonitor/currentStatus/${encodeURIComponent(ident)}.json`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
        });
        if (!write.ok) { saved = false; console.error('Flight currentStatus write failed', write.status, await write.text()); }
      }
      for (const [ident, value] of Object.entries(history)) {
        const write = await fetch(`${FLIGHT_DB}/flightMonitor/history/${encodeURIComponent(ident)}.json`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
        });
        if (!write.ok) { saved = false; console.error('Flight history write failed', write.status, await write.text()); }
      }
      return res.status(200).json({
        current, history, checkedAt, source: 'FlightAware AeroAPI',
        persistence: saved ? 'saved' : 'not-saved'
      });
    } catch (error) {
      console.error('flightMonitor failed', error);
      return res.status(502).json({ error: error.message || 'ตรวจสอบข้อมูลเที่ยวบินไม่สำเร็จ' });
    }
  }
);
