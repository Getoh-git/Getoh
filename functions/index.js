const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');

const { setGlobalOptions } = require('firebase-functions/v2');
setGlobalOptions({ maxInstances: 3 });

// Public endpoint for the static GitHub Pages client. Replace the CORS origin
// below with your actual GitHub Pages/custom domain before deploying. Restrict
// the Google API key to Places API (New), and set API quotas/budget alerts.
exports.placesLookup = onRequest(
  { region: 'asia-northeast1', secrets: [GOOGLE_PLACES_API_KEY], cors: ['https://getoh-git.github.io'], maxInstances: 5 },
  async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const query = String((req.body && req.body.query) || '').trim().slice(0, 180);
    if (query.length < 2) return res.status(400).json({ error: 'กรุณาระบุชื่อสถานที่' });

    // ส่งพิกัดมาด้วยเพื่อให้ได้สาขา/ร้านที่ตรงจริง (ชื่ออย่าง ファミリーマート มีหลายร้อยสาขา)
    const lat = Number(req.body && req.body.latitude), lon = Number(req.body && req.body.longitude);
    const hasCoord = Number.isFinite(lat) && Number.isFinite(lon) && lat > 20 && lat < 46 && lon > 122 && lon < 154; // อยู่ในญี่ปุ่น
    const searchBody = { textQuery: query, languageCode: 'th', regionCode: 'JP', pageSize: 1 };
    if (hasCoord) searchBody.locationBias = { circle: { center: { latitude: lat, longitude: lon }, radius: 150 } };

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.value(),
          'X-Goog-FieldMask': [
            'places.id', 'places.displayName', 'places.formattedAddress',
            'places.rating', 'places.userRatingCount', 'places.reviews',
            'places.googleMapsUri', 'places.websiteUri', 'places.regularOpeningHours'
          ].join(',')
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
