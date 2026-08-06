import type { Config } from '@netlify/functions';

// NOAA SWPC retired /products/solar-wind/*-day.json. The live L1 replacements are the
// RTSW feeds, which are multi-megabyte and newest-first, so they are reduced here on the
// server and served to the browser as a few hundred bytes.
const RTSW_WIND = 'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json';
const RTSW_MAG = 'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json';
const KP = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
// Small, fully-populated fallback used when an RTSW feed is unavailable.
const PROPAGATED = 'https://services.swpc.noaa.gov/products/geospace/propagated-solar-wind-1-hour.json';

const FETCH_TIMEOUT_MS = 8000;

interface Plasma {
  time: string;
  speed: number;
  density: number;
  temp: number;
  source: string;
}

interface Mag {
  time: string;
  bx: number;
  by: number;
  bz: number;
  bt: number;
  source: string;
}

interface Kp {
  time: string;
  kp: number;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${new URL(url).pathname} returned HTTP ${res.status}`);
  return res.json();
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

// RTSW rows arrive newest-first and interleave several spacecraft; `active` marks the
// instrument currently designated primary. Take the newest active row that has real values.
function newestUsableRow<T>(
  rows: unknown,
  build: (row: Record<string, unknown>) => T | null,
): T | null {
  if (!Array.isArray(rows)) return null;
  let fallback: T | null = null;
  for (const raw of rows) {
    if (typeof raw !== 'object' || raw === null) continue;
    const row = raw as Record<string, unknown>;
    const built = build(row);
    if (!built) continue;
    if (row.active === true) return built;
    fallback ??= built;
  }
  return fallback;
}

function plasmaFromRtsw(rows: unknown): Plasma | null {
  return newestUsableRow<Plasma>(rows, row => {
    const speed = num(row.proton_speed);
    const density = num(row.proton_density);
    const temp = num(row.proton_temperature);
    if (speed === null || density === null || temp === null) return null;
    return {
      time: String(row.time_tag ?? ''),
      speed,
      density,
      temp,
      source: String(row.source ?? 'DSCOVR/ACE'),
    };
  });
}

function magFromRtsw(rows: unknown): Mag | null {
  return newestUsableRow<Mag>(rows, row => {
    const bt = num(row.bt);
    // GSM is the geo-effective frame; fall back to GSE if a source only reports that.
    const bx = num(row.bx_gsm) ?? num(row.bx_gse);
    const by = num(row.by_gsm) ?? num(row.by_gse);
    const bz = num(row.bz_gsm) ?? num(row.bz_gse);
    if (bt === null || bx === null || by === null || bz === null) return null;
    return {
      time: String(row.time_tag ?? ''),
      bx,
      by,
      bz,
      bt,
      source: String(row.source ?? 'DSCOVR/ACE'),
    };
  });
}

// Header-row + array-row product: [time_tag, speed, density, temperature, bx, by, bz, bt, ...]
function propagatedLatest(rows: unknown): { plasma: Plasma | null; mag: Mag | null } {
  if (!Array.isArray(rows) || rows.length < 2) return { plasma: null, mag: null };
  for (let i = rows.length - 1; i > 0; i--) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const [time, speed, density, temp, bx, by, bz, bt] = row;
    const values = [speed, density, temp, bx, by, bz, bt].map(num);
    if (values.some(v => v === null)) continue;
    const [s, d, t, x, y, z, total] = values as number[];
    const time_tag = String(time ?? '');
    return {
      plasma: { time: time_tag, speed: s, density: d, temp: t, source: 'DSCOVR/ACE (propagated)' },
      mag: { time: time_tag, bx: x, by: y, bz: z, bt: total, source: 'DSCOVR/ACE (propagated)' },
    };
  }
  return { plasma: null, mag: null };
}

function kpLatest(rows: unknown): Kp | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    // NOAA has served this endpoint as both object rows and CSV-style array rows.
    if (Array.isArray(row)) {
      const kp = num(row[1]);
      if (kp !== null) return { time: String(row[0] ?? ''), kp };
      continue;
    }
    if (typeof row === 'object' && row !== null) {
      const r = row as Record<string, unknown>;
      const kp = num(r.Kp ?? r.kp ?? r.kp_index);
      if (kp !== null) return { time: String(r.time_tag ?? ''), kp };
    }
  }
  return null;
}

function message(error: unknown): string {
  if (error instanceof Error) {
    return error.name === 'TimeoutError' ? 'NOAA SWPC request timed out' : error.message;
  }
  return 'Unknown error contacting NOAA SWPC';
}

export default async () => {
  const [windRes, magRes, kpRes] = await Promise.allSettled([
    getJson(RTSW_WIND),
    getJson(RTSW_MAG),
    getJson(KP),
  ]);

  let plasma = windRes.status === 'fulfilled' ? plasmaFromRtsw(windRes.value) : null;
  let mag = magRes.status === 'fulfilled' ? magFromRtsw(magRes.value) : null;
  let plasmaError = windRes.status === 'rejected' ? message(windRes.reason) : null;
  let magError = magRes.status === 'rejected' ? message(magRes.reason) : null;

  if (!plasma || !mag) {
    try {
      const propagated = propagatedLatest(await getJson(PROPAGATED));
      if (!plasma && propagated.plasma) {
        plasma = propagated.plasma;
        plasmaError = null;
      }
      if (!mag && propagated.mag) {
        mag = propagated.mag;
        magError = null;
      }
    } catch (error) {
      const detail = message(error);
      plasmaError ??= detail;
      magError ??= detail;
    }
  }

  const kp = kpRes.status === 'fulfilled' ? kpLatest(kpRes.value) : null;
  const kpError = kpRes.status === 'rejected' ? message(kpRes.reason) : null;

  return Response.json(
    {
      fetchedAt: new Date().toISOString(),
      plasma,
      plasmaError: plasma ? null : (plasmaError ?? 'No usable solar wind observations returned'),
      mag,
      magError: mag ? null : (magError ?? 'No usable magnetic field observations returned'),
      kp,
      kpError: kp ? null : (kpError ?? 'No usable Kp observations returned'),
    },
    {
      headers: {
        // NOAA publishes once a minute; cache at the edge so the upstream feeds are not
        // re-pulled for every visitor, and keep serving the last good copy while revalidating.
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    },
  );
};

export const config: Config = {
  path: '/api/space-weather',
};
