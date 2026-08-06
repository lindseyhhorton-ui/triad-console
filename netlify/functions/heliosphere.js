const fetch = globalThis.fetch || require('node-fetch');

// Simple Netlify function that returns a compact frame list for three views.
// This implementation uses public SOHO "latest" endpoints and a small
// generated frame list as a graceful fallback. For production, swap in
// NOAA/Enlil model feeds and parse their file lists server-side.

exports.handler = async function (event, context) {
  const qs = event.queryStringParameters || {};
  const view = (qs.view || 'enlil').toLowerCase();

  // Helper: create mock frames around a "latest" sample image
  const now = Date.now();
  const makeFrames = (baseUrl: string, count = 12) => {
    const frames = [];
    for (let i = count - 1; i >= 0; i--) {
      const ts = new Date(now - i * 60000).toISOString();
      frames.push({ url: baseUrl, timestamp: ts, isForecast: false });
    }
    return frames;
  };

  try {
    if (view === 'c2') {
      // SOHO LASCO C2 latest image
      const url = 'https://soho.nascom.nasa.gov/data/realtime/c2/1024/latest.jpg';
      const frames = makeFrames(url, 24);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
        body: JSON.stringify({ view: 'c2', frames }),
      };
    }

    if (view === 'c3') {
      const url = 'https://soho.nascom.nasa.gov/data/realtime/c3/1024/latest.jpg';
      const frames = makeFrames(url, 24);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
        body: JSON.stringify({ view: 'c3', frames }),
      };
    }

    // 'enlil' or default: try to fetch an Enlil visualization if configured
    // NOAA/CCMC Enlil imagery isn't hosted at a single well-known URL for all setups
    // so for now we fall back to a public example image (placeholder).
    const enlilPlaceholder = 'https://ccmc.gsfc.nasa.gov/imagery/animations/2020/20200624_enlil_example.jpg';
    const frames = makeFrames(enlilPlaceholder, 36);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ view: 'enlil', frames }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
