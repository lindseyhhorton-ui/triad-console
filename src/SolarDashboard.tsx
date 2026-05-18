import { useState, useEffect, useRef, useCallback } from 'react';
import { Wind, Magnet, Activity, Radio, FileDown, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

// ── NOAA SWPC CORS-enabled endpoints ──────────────────────────────────────────
const ENDPOINTS = {
  plasma: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
  mag:    'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json',
  kp:     'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface PlasmaRow { time: string; density: string; speed: string; temp: string }
interface MagRow    { time: string; bx: string; by: string; bz: string; bt: string }
interface KpRow     { time: string; kp: string }

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface LogEntry {
  time: string;
  subjective: string;
}

interface MagEntry {
  station: string;
  nT: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function fetchNoaa<T>(url: string, transform: (rows: string[][]) => T): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: string[][] = await res.json();
  // first row is headers – skip it
  return transform(json.slice(1));
}

function kpLabel(kp: number): string {
  if (kp >= 9) return 'G5 EXTREME';
  if (kp >= 8) return 'G4 SEVERE';
  if (kp >= 7) return 'G3 STRONG';
  if (kp >= 6) return 'G2 MODERATE';
  if (kp >= 5) return 'G1 MINOR';
  return 'QUIET';
}

// ── Sub-panels ───────────────────────────────────────────────────────────────

function StatusDot({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <span className="solar-dot dot-loading" title="Fetching…" />;
  if (error)   return <span className="solar-dot dot-error"   title={error} />;
  return              <span className="solar-dot dot-ok"      title="Live" />;
}

function PanelHeader({
  icon, title, loading, error, onRefresh
}: {
  icon: React.ReactNode;
  title: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="solar-panel-header">
      <div className="solar-panel-title">
        {icon}
        <span>{title}</span>
        <StatusDot loading={loading} error={error} />
      </div>
      <button className="solar-icon-btn" onClick={onRefresh} title="Refresh">
        <RefreshCw size={14} className={loading ? 'spin' : ''} />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SolarDashboard() {
  // fetch states
  const [plasma, setPlasma] = useState<FetchState<PlasmaRow>>({ data: null, error: null, loading: false });
  const [mag,    setMag]    = useState<FetchState<MagRow>>   ({ data: null, error: null, loading: false });
  const [kp,     setKp]     = useState<FetchState<KpRow>>    ({ data: null, error: null, loading: false });

  // local magnetometer
  const [magInput, setMagInput] = useState('');
  const [magEntries, setMagEntries] = useState<MagEntry[]>([]);

  // field log
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logText, setLogText] = useState('');

  const now = () => new Date().toLocaleString('en-US', { hour12: false });

  // ── Fetchers ────────────────────────────────────────────────────────────
  const fetchPlasma = useCallback(() => {
    setPlasma(s => ({ ...s, loading: true, error: null }));
    fetchNoaa<PlasmaRow>(ENDPOINTS.plasma, rows => {
      const last = rows[rows.length - 1];
      return { time: last[0], density: last[1], speed: last[2], temp: last[3] };
    })
      .then(data => setPlasma({ data, error: null, loading: false }))
      .catch(e  => setPlasma({ data: null, error: String(e), loading: false }));
  }, []);

  const fetchMag = useCallback(() => {
    setMag(s => ({ ...s, loading: true, error: null }));
    fetchNoaa<MagRow>(ENDPOINTS.mag, rows => {
      const last = rows[rows.length - 1];
      return { time: last[0], bx: last[1], by: last[2], bz: last[3], bt: last[6] };
    })
      .then(data => setMag({ data, error: null, loading: false }))
      .catch(e  => setMag({ data: null, error: String(e), loading: false }));
  }, []);

  const fetchKp = useCallback(() => {
    setKp(s => ({ ...s, loading: true, error: null }));
    fetchNoaa<KpRow>(ENDPOINTS.kp, rows => {
      const last = rows[rows.length - 1];
      return { time: last[0], kp: last[1] };
    })
      .then(data => setKp({ data, error: null, loading: false }))
      .catch(e  => setKp({ data: null, error: String(e), loading: false }));
  }, []);

  // auto-fetch on mount + every 3 min
  useEffect(() => {
    fetchPlasma(); fetchMag(); fetchKp();
    const id = setInterval(() => { fetchPlasma(); fetchMag(); fetchKp(); }, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchPlasma, fetchMag, fetchKp]);

  // ── Local magnetometer ──────────────────────────────────────────────────
  const addMagEntry = () => {
    const trimmed = magInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map(s => s.trim());
    setMagEntries(prev => [...prev, { station: parts[0] ?? '', nT: parts[1] ?? '' }]);
    setMagInput('');
  };

  // ── Field log ───────────────────────────────────────────────────────────
  const appendLog = () => {
    if (!logText.trim()) return;
    setLogEntries(prev => [...prev, { time: now(), subjective: logText.trim() }]);
    setLogText('');
  };

  const downloadCSV = () => {
    const header = 'time,subjective\n';
    const rows = logEntries.map(e => `"${e.time}","${e.subjective.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vaultbreaker-fieldlog.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Kp gauge ─────────────────────────────────────────────────────────────
  const kpVal = parseFloat(kp.data?.kp ?? '0');
  const kpLevel = Math.max(0, Math.min(9, Math.round(kpVal)));

  // ── Clock ────────────────────────────────────────────────────────────────
  const [clock, setClock] = useState(now());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    clockRef.current = setInterval(() => setClock(now()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="solar-dashboard">
      {/* Header */}
      <div className="solar-header">
        <div className="solar-title-group">
          <h2 className="solar-title">☀ VAULTBREAKER — Solar Field Tracker</h2>
          <span className="solar-clock">{clock}</span>
        </div>
        <div className="solar-live-badge">
          <span className="solar-dot dot-ok pulse" />
          LIVE SWPC
        </div>
      </div>

      <div className="solar-grid">
        {/* ── Solar Wind ─────────────────────────────────────────────────── */}
        <div className="solar-panel">
          <PanelHeader
            icon={<Wind size={16} />}
            title="Solar Wind (DSCOVR/ACE)"
            loading={plasma.loading}
            error={plasma.error}
            onRefresh={fetchPlasma}
          />
          {plasma.error && (
            <div className="solar-error">
              <AlertTriangle size={14} /> {plasma.error}
            </div>
          )}
          {plasma.data && (
            <div className="solar-data-grid">
              <div className="solar-metric">
                <span className="solar-label">Speed</span>
                <span className="solar-value cyan">{parseFloat(plasma.data.speed).toFixed(0)} <small>km/s</small></span>
              </div>
              <div className="solar-metric">
                <span className="solar-label">Density</span>
                <span className="solar-value cyan">{parseFloat(plasma.data.density).toFixed(2)} <small>p/cm³</small></span>
              </div>
              <div className="solar-metric">
                <span className="solar-label">Temp</span>
                <span className="solar-value cyan">{(parseFloat(plasma.data.temp) / 1e6).toFixed(2)} <small>MK</small></span>
              </div>
              <div className="solar-metric full">
                <span className="solar-label">Updated</span>
                <span className="solar-value-small">{plasma.data.time} UTC</span>
              </div>
            </div>
          )}
          {!plasma.data && !plasma.error && !plasma.loading && (
            <p className="solar-hint">Awaiting fetch…</p>
          )}
        </div>

        {/* ── IMF ──────────────────────────────────────────────────────────── */}
        <div className="solar-panel">
          <PanelHeader
            icon={<Magnet size={16} />}
            title="Interplanetary Magnetic Field"
            loading={mag.loading}
            error={mag.error}
            onRefresh={fetchMag}
          />
          {mag.error && (
            <div className="solar-error">
              <AlertTriangle size={14} /> {mag.error}
            </div>
          )}
          {mag.data && (
            <div className="solar-data-grid">
              <div className="solar-metric">
                <span className="solar-label">Bz</span>
                <span className={`solar-value ${parseFloat(mag.data.bz) < 0 ? 'red' : 'green'}`}>
                  {parseFloat(mag.data.bz).toFixed(2)} <small>nT</small>
                </span>
              </div>
              <div className="solar-metric">
                <span className="solar-label">Bt</span>
                <span className="solar-value cyan">{parseFloat(mag.data.bt).toFixed(2)} <small>nT</small></span>
              </div>
              <div className="solar-metric">
                <span className="solar-label">Bx</span>
                <span className="solar-value cyan">{parseFloat(mag.data.bx).toFixed(2)} <small>nT</small></span>
              </div>
              <div className="solar-metric">
                <span className="solar-label">By</span>
                <span className="solar-value cyan">{parseFloat(mag.data.by).toFixed(2)} <small>nT</small></span>
              </div>
              <div className="solar-metric full">
                <span className="solar-label">Updated</span>
                <span className="solar-value-small">{mag.data.time} UTC</span>
              </div>
            </div>
          )}
          {!mag.data && !mag.error && !mag.loading && (
            <p className="solar-hint">Awaiting fetch…</p>
          )}
        </div>

        {/* ── Kp Index ─────────────────────────────────────────────────────── */}
        <div className="solar-panel">
          <PanelHeader
            icon={<Activity size={16} />}
            title="Planetary Kp Index"
            loading={kp.loading}
            error={kp.error}
            onRefresh={fetchKp}
          />
          {kp.error && (
            <div className="solar-error">
              <AlertTriangle size={14} /> {kp.error}
            </div>
          )}
          {kp.data && (
            <div className="solar-kp-display">
              <div className={`solar-kp-number solar-kp-number-${kpLevel}`}>{kpVal.toFixed(1)}</div>
              <div className={`solar-kp-label solar-kp-label-${kpLevel}`}>{kpLabel(kpVal)}</div>
              <div className="solar-kp-bar-bg">
                <div className={`solar-kp-bar-fill solar-kp-bar-fill-${kpLevel}`} />
              </div>
              <div className="solar-kp-scale">
                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                  <span key={n} className={`solar-kp-scale-step solar-kp-scale-step-${n} ${n <= Math.floor(kpVal) ? 'solar-kp-scale-step-on' : 'solar-kp-scale-step-off'}`}>{n}</span>
                ))}
              </div>
              <div className="solar-metric full solar-metric-top-gap">
                <span className="solar-label">Updated</span>
                <span className="solar-value-small">{kp.data.time} UTC</span>
              </div>
            </div>
          )}
          {!kp.data && !kp.error && !kp.loading && (
            <p className="solar-hint">Awaiting fetch…</p>
          )}
        </div>

        {/* ── Local Magnetometer ───────────────────────────────────────────── */}
        <div className="solar-panel">
          <PanelHeader
            icon={<Radio size={16} />}
            title="Local Magnetometer (manual)"
            loading={false}
            error={null}
            onRefresh={() => setMagEntries([])}
          />
          <p className="solar-hint solar-hint-tight">
            Format: <code>station, nT value</code>
          </p>
          <div className="solar-inline-row">
            <input
              className="solar-input"
              value={magInput}
              onChange={e => setMagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMagEntry()}
              placeholder="e.g. BOU, 52341"
            />
            <button className="solar-btn" onClick={addMagEntry}>Add</button>
          </div>
          {magEntries.length > 0 && (
            <table className="solar-table solar-table-top-gap-sm">
              <thead><tr><th>Station</th><th>nT</th></tr></thead>
              <tbody>
                {magEntries.map((e, i) => (
                  <tr key={i}><td>{e.station}</td><td>{e.nT}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Field Log ────────────────────────────────────────────────────── */}
        <div className="solar-panel solar-panel-wide">
          <PanelHeader
            icon={<FileDown size={16} />}
            title="Field Log — Quick Entry"
            loading={false}
            error={null}
            onRefresh={() => setLogEntries([])}
          />
          <div className="solar-log-row">
            <span className="solar-label">Time (local):</span>
            <span className="solar-value-small">{clock}</span>
          </div>
          <textarea
            className="solar-textarea"
            value={logText}
            onChange={e => setLogText(e.target.value)}
            placeholder="Subjective: grass glow, humming, dream intensity, compass deviation…"
            rows={3}
          />
          <div className="solar-action-row">
            <button className="solar-btn" onClick={appendLog}>Append to Log</button>
            <button className="solar-btn solar-btn-ghost" onClick={downloadCSV} disabled={logEntries.length === 0}>
              <FileDown size={14} /> Download CSV
            </button>
          </div>
          {logEntries.length > 0 && (
            <table className="solar-table solar-table-top-gap-md">
              <thead><tr><th>Time</th><th>Observation</th></tr></thead>
              <tbody>
                {logEntries.map((e, i) => (
                  <tr key={i}><td className="solar-nowrap">{e.time}</td><td>{e.subjective}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Quick Links ──────────────────────────────────────────────────── */}
        {/* ── Solar Radio Live Stream ──────────────────────────────────────── */}
        <div className="solar-panel solar-panel-wide">
          <div className="solar-panel-header">
            <div className="solar-panel-title">
              <Radio size={16} />
              <span>Solar Radio — Live Signal Feed</span>
              <span className="solar-dot dot-ok pulse" title="Live stream" />
            </div>
          </div>
          <div className="solar-embed-frame">
            <iframe
              src="https://www.youtube.com/embed/bnBiwoppxio?autoplay=1&mute=1"
              title="Listen to the Sun | Live Solar Radio Signals"
              className="solar-embed"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="solar-hint solar-hint-top-gap">
            Live radio emissions from the Sun — NASA/NOAA solar radio burst monitoring.
          </p>
        </div>

        {/* ── Quick Links ──────────────────────────────────────────────────── */}
        <div className="solar-panel solar-panel-links">
          <div className="solar-panel-header">
            <div className="solar-panel-title">
              <ExternalLink size={16} />
              <span>Quick Links &amp; Sources</span>
            </div>
          </div>
          <ul className="solar-links">
            {[
              ['NOAA SWPC Real-Time Solar Wind', 'https://www.swpc.noaa.gov/products/real-time-solar-wind'],
              ['NOAA Planetary K-index',          'https://www.swpc.noaa.gov/products/planetary-k-index'],
              ['SuperMAG Magnetometer Data',      'https://supermag.jhuapl.edu/'],
              ['SpaceWeatherLive Dashboards',     'https://www.spaceweatherlive.com/en/solar-activity.html'],
              ['NOAA DSCOVR L1 Data',             'https://www.ngdc.noaa.gov/dscovr/'],
              ['Helioviewer (solar imaging)',     'https://helioviewer.org/'],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={11} /> {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
