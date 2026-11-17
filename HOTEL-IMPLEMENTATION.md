# Getoh Hotel Discovery — implementation notes

## What changed

- Added a Google Places hotel search mode to the existing `placesLookup` Cloud Function.
- Added a hotel shortlist UI in `index.html` and the new `hotel-search.js` client module, including status controls and horizontal comparison for up to four saved hotels.
- Added Firebase paths for `hotelSelections`, `hotelPrices`, and `hotelPriceHistory` in `firebase-rules.json`.
- Merged the previously prepared minimal homepage `index.html` overlay into this version.

## Data ownership and preservation

- Existing `/hotels` records and `hotels.js` are unchanged. Existing prices, comments, photos, custom records, and legacy workflows continue to use the original paths.
- New Google Places shortlist records store only `placeId`, user-selected `status`, and `updatedAt` in `/hotelSelections/{placeId}`.
- Google Places names, addresses, ratings, map links, and website links are fetched when the page is opened and held in page memory only. They are not written to Firebase.
- User-entered prices are stored separately in `/hotelPrices/{placeId}`. Each save is also appended to `/hotelPriceHistory/{placeId}`.
- Booking.com and Agoda links are search links. No live booking price is fetched, cached, or represented as a verified Getoh price.

## New Firebase data shapes

`/hotelSelections/{placeId}`:

```json
{
  "placeId": "Google Place ID",
  "status": "primary | backup | selected",
  "updatedAt": 1790000000000
}
```

`/hotelPrices/{placeId}`:

```json
{
  "price": 12500,
  "currency": "THB",
  "totalNights": 4,
  "priceDate": "17 พ.ย. 2026",
  "roomType": "Standard Double",
  "notes": "Optional user note",
  "source": "user",
  "updatedAt": 1790000000000
}
```

`/hotelPriceHistory/{placeId}/{pushId}` stores a copy of each successfully saved price entry.

## Deployment steps

1. Back up the current Firebase Realtime Database before deploying any rules.
2. Deploy the updated Cloud Function from the `functions` folder (`npm install`, then `firebase deploy --only functions`). The existing `GOOGLE_PLACES_API_KEY` secret must already be configured for the project.
3. Publish the updated `firebase-rules.json` rules in Firebase Console after reviewing the current rules and access model.
4. Deploy the changed static files to GitHub Pages, preserving the existing files not included in this overlay ZIP.
5. Test a Google Places hotel search, adding/removing a shortlist item, changing all three statuses, saving a price, reloading, and checking the price history.

## Important limitations

- Firebase rules in this project currently permit public reads and time-limited writes. This patch keeps the existing access model; it does not introduce user authentication or per-user authorization.
- The search endpoint uses Google Places Text Search with the `lodging` type filter. Results depend on Google's coverage and the API key's Places API (New) and billing configuration.
- Place details are fetched again after reload because Google Places content other than Place IDs is not persisted by this implementation.
- Legacy hotel prices remain in the original `/hotels` and static `hotels.js` data. This patch does not migrate or overwrite those records.
