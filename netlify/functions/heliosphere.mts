import type { Config } from '@netlify/functions';

// Frame lists for the animated heliosphere imagery. NOAA publishes these as bare filename
// lists, so timestamps are recovered from the filenames and the URLs are absolutised here
// rather than in the browser.
const SWPC_ORIGIN = 'https://services.swpc.noaa.gov';

const FETCH_TIMEOUT_MS = 8000;
const MAX_FRAMES = 48;

// ENLIL runs from a few days in the past to a few days ahead; only the window either side of
// now is worth animating.
const ENLIL_PAST_MS = 24 * 60 * 60 * 1000;
const ENLIL_FUTURE_MS = 48 * 60 * 60 * 1000;

interface ViewSpec {
  id: string;
  label: string;
  product: string;
  description: string;
  credit: string;
  windowed: boolean;
}

const VIEWS: ViewSpec[] = [
  {
    id: 'enlil',
    label: 'WSA-Enlil Heliosphere',
    product: 'enlil',
    description:
      'Modelled solar wind density across the inner heliosphere in the ecliptic plane. The Sun sits at the centre; Earth is the yellow marker. Frames past the current time are forecast.',
    credit: 'NOAA SWPC · WSA-Enlil model',
    windowed: true,
  },
  {
    id: 'lasco-c3',
    label: 'LASCO C3 Coronagraph',
    product: 'lasco-c3',
    description:
      'SOHO coronagraph view out to roughly 30 solar radii, where the corona hands off to the solar wind. Coronal mass ejections appear here first.',
    credit: 'NASA/ESA SOHO · LASCO C3',
    windowed: false,
  },
  {
    id: 'lasco-c2',
    label: 'LASCO C2 Coronagraph',
    product: 'lasco-c2',
    description:
      'Closer SOHO coronagraph view of the inner corona, out to roughly 6 solar radii.',
    credit: 'NASA/ESA SOHO · LASCO C2',
    windowed: false,
  },
];

interface Frame {
  url: string;
  time: string | null;
  forecast: boolean;
}

// Handles both NOAA filename conventions in use:
//   enlil_com2_58426_20260802T180000.jpg  and  20260805_1836_c2_512.jpg
const TIMESTAMP_RE = /(\d{4})(\d{2})(\d{2})[T_](\d{2})(\d{2})(\d{2})?/;

function timeFromFilename(url: string): string | null {
  const match = TIMESTAMP_RE.exec(url);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second ?? '00'}Z`;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

// Keep the newest frame and thin the rest evenly, so playback stays smooth without asking the
// browser to pull a hundred-odd JPEGs.
function subsample(frames: Frame[], limit: number): Frame[] {
  if (frames.length <= limit) return frames;
  const step = (frames.length - 1) / (limit - 1);
  const picked: Frame[] = [];
  for (let i = 0; i < limit; i++) {
    picked.push(frames[Math.round(i * step)]);
  }
  return picked;
}

async function loadView(view: ViewSpec, nowMs: number) {
  const res = await fetch(`${SWPC_ORIGIN}/products/animations/${view.product}.json`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NOAA ${view.product} feed returned HTTP ${res.status}`);

  const rows: unknown = await res.json();
  if (!Array.isArray(rows)) throw new Error(`Unexpected ${view.product} feed format`);

  let frames: Frame[] = rows
    .map(row => {
      const path = typeof row === 'object' && row !== null ? (row as { url?: unknown }).url : null;
      if (typeof path !== 'string' || !path) return null;
      const time = timeFromFilename(path);
      return {
        url: path.startsWith('http') ? path : `${SWPC_ORIGIN}${path}`,
        time,
        forecast: time !== null && Date.parse(time) > nowMs,
      };
    })
    .filter((frame): frame is Frame => frame !== null)
    .sort((a, b) => Date.parse(a.time ?? '') - Date.parse(b.time ?? ''));

  if (frames.length === 0) throw new Error(`No frames published for ${view.product}`);

  if (view.windowed) {
    const windowed = frames.filter(frame => {
      if (!frame.time) return false;
      const t = Date.parse(frame.time);
      return t >= nowMs - ENLIL_PAST_MS && t <= nowMs + ENLIL_FUTURE_MS;
    });
    // A stale model run can fall entirely outside the window; show it rather than nothing.
    if (windowed.length > 1) frames = windowed;
  }

  return { frames: subsample(frames, MAX_FRAMES) };
}

function message(error: unknown): string {
  if (error instanceof Error) {
    return error.name === 'TimeoutError' ? 'NOAA imagery request timed out' : error.message;
  }
  return 'Unknown error contacting NOAA SWPC';
}

export default async () => {
  const nowMs = Date.now();
  const settled = await Promise.allSettled(VIEWS.map(view => loadView(view, nowMs)));

  const views = VIEWS.map((view, i) => {
    const result = settled[i];
    return {
      id: view.id,
      label: view.label,
      description: view.description,
      credit: view.credit,
      frames: result.status === 'fulfilled' ? result.value.frames : [],
      error: result.status === 'rejected' ? message(result.reason) : null,
    };
  });

  return Response.json(
    { fetchedAt: new Date(nowMs).toISOString(), views },
    {
      headers: {
        // LASCO refreshes about every 12 minutes and Enlil hourly, so a few minutes of edge
        // caching keeps the imagery current without re-pulling NOAA for every visitor.
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    },
  );
};

export const config: Config = {
  path: '/api/heliosphere',
};
