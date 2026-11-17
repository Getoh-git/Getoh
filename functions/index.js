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
