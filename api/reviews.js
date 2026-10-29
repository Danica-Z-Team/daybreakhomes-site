// Vercel serverless function: /api/reviews
// Pulls live Google reviews for the Zander Real Estate Team business profile
// via the Places API (New), so the site never has to store or hardcode review text.
//
// Requires two environment variables set in the Vercel dashboard (Settings > Environment
// Variables), NOT in this file:
//   GOOGLE_PLACES_API_KEY - a Places API (New) key from Google Cloud Console
//   GOOGLE_PLACE_ID       - the Place ID for the Zander Real Estate Team listing
//
// Google's API caps this at the 5 "most relevant" reviews per place, that's a Google
// limit, not something this code can change.

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error('Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID environment variable');
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  try {
    const googleRes = await fetch('https://places.googleapis.com/v1/places/' + placeId, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri,displayName'
      }
    });

    if (!googleRes.ok) {
      const detail = await googleRes.text();
      console.error('Google Places error', googleRes.status, detail);
      return res.status(502).json({ error: 'Could not fetch reviews.' });
    }

    const data = await googleRes.json();

    const reviews = (data.reviews || []).map(function (r) {
      return {
        author: (r.authorAttribution && r.authorAttribution.displayName) || 'Google User',
        photo: (r.authorAttribution && r.authorAttribution.photoUri) || null,
        rating: r.rating || null,
        text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || '',
        relativeTime: r.relativePublishTimeDescription || ''
      };
    });

    // Cache at the edge so we don't call Google on every single page load.
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

    return res.status(200).json({
      rating: data.rating || null,
      total: data.userRatingCount || null,
      mapsUrl: data.googleMapsUri || null,
      reviews: reviews
    });
  } catch (err) {
    console.error('Reviews fetch error', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
