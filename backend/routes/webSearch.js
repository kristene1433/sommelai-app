// routes/webSearch.js - Local wine stores via Google Places
const express = require('express');
const router = express.Router();
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY?.trim();

// Geocode ZIP -> { lat, lng, city, state }
async function geocodeZip(zip) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    zip
  )}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const data = await res.json();
  if (!data.results?.length) throw new Error('No geocode results');

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  let city = '';
  let state = '';
  for (const comp of result.address_components || []) {
    if (comp.types.includes('locality')) city = comp.long_name;
    if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
  }
  return { lat, lng, city, state };
}

router.post('/wineStores', async (req, res) => {
  const { query, zip } = req.body;
  if (!query || !zip) {
    return res.status(400).json({ message: 'query and zip required' });
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  try {
    const { lat, lng, city, state } = await geocodeZip(zip);
    const keyword = encodeURIComponent(`${query} wine`);
    const nearbyUrl =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=40000&type=liquor_store&keyword=${keyword}&key=${GOOGLE_MAPS_API_KEY}`;

    const nearbyRes = await fetch(nearbyUrl);
    if (!nearbyRes.ok) throw new Error(`Nearby search failed: ${nearbyRes.status}`);
    const nearby = await nearbyRes.json();

    const places = (nearby.results || []).slice(0, 3);

    const results = await Promise.all(
      places.map(async (place, idx) => {
        let address = place.vicinity || place.formatted_address || '';
        let website = '';

        try {
          if (place.place_id) {
            const detailsUrl =
              `https://maps.googleapis.com/maps/api/place/details/json` +
              `?place_id=${place.place_id}&fields=formatted_address,website,url&key=${GOOGLE_MAPS_API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            if (detailsRes.ok) {
              const details = await detailsRes.json();
              const r = details.result || {};
              address = r.formatted_address || address;
              website = r.website || r.url || website;
            }
          }
        } catch (e) {
          console.error('Place details error:', e);
        }

        return {
          name: place.name || `Wine Store ${idx + 1}`,
          price: 'See store',
          store: place.name || 'Wine Store',
          address,
          url: website,
        };
      })
    );

    if (!results.length) {
      return res.json({
        results: [],
        sources: [],
        searchQuery: query,
        location: `${zip}`,
      });
    }

    return res.json({
      results,
      sources: [],
      searchQuery: query,
      location: city && state ? `${city}, ${state}` : `${zip}`,
    });
  } catch (err) {
    console.error('webSearch error (Google Places):', err);
    return res.status(500).json({ message: 'Web search failed' });
  }
});

module.exports = router;
