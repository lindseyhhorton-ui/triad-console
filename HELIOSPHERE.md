Heliosphere panel and serverless endpoint

This branch adds a lightweight Heliosphere panel to the Triad Console and a Netlify serverless function that returns a compact list of frames for several solar/heliospheric views.

Files added
- src/components/HeliospherePanel.tsx — React component (TSX) that fetches frames and provides play/pause/step/scrub controls.
- netlify/functions/heliosphere.js — Netlify function that returns a small frame list for 'enlil', 'c2', and 'c3' views. This currently uses public SOHO "latest.jpg" endpoints and a placeholder Enlil image as a fallback.

Notes for production
- For a live/accurate Enlil heliosphere model, replace the Enlil placeholder with a server-side parser that reads NOAA/CCMC frame lists (the upstream list format varies by provider). The server should parse timestamps from filenames and mark forecast frames. Caching at the edge (e.g., Cache-Control: max-age=300) is recommended.
- If you prefer the endpoint under /api/heliosphere, add a redirect in Netlify (_redirects or netlify.toml) from /api/heliosphere to /.netlify/functions/heliosphere.
- The Solar Radio panel still requires VITE_SOLAR_RADIO_URL to be set to an embeddable YouTube Live URL.

How to wire the component in
- Import and place <HeliospherePanel /> within your dashboard pages (e.g., inside the telemetry column). The component fetches /.netlify/functions/heliosphere?view=enlil by default.

