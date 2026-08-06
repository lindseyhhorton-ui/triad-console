import { useState, useEffect, useRef, useCallback } from 'react';
import { Orbit, Play, Pause, SkipBack, SkipForward, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

// NASA's own Helioviewer deployment. It sends X-Frame-Options: sameorigin, so it cannot be
// embedded — the panel renders NOAA/NASA imagery directly and links out to the full tool.
const NASA_HELIOVIEWER_URL = 'https://gs671-suske.ndc.nasa.gov/';
const HELIOSPHERE_ENDPOINT = '/api/heliosphere';

const FRAME_MS = 180;
const PRELOAD_AHEAD = 6;

interface Frame {
  url: string;
  time: string | null;
  forecast: boolean;
}

interface View {
  id: string;
  label: string;
  description: string;
  credit: string;
  frames: Frame[];
  error: string | null;
}

function formatFrameTime(time: string | null): string {
  if (!time) return '—';
  return `${time.slice(0, 10)} ${time.slice(11, 16)} UTC`;
}

export default function HeliospherePanel() {
  const [views, setViews] = useState<View[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch(HELIOSPHERE_ENDPOINT, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error(`Imagery feed unavailable (HTTP ${res.status})`);
        const json: unknown = await res.json();
        const next = (json as { views?: View[] })?.views;
        if (!Array.isArray(next) || next.length === 0) {
          throw new Error('Imagery feed returned no views');
        }
        return next;
      })
      .then(next => {
        setViews(next);
        // Prefer a view that actually has frames, so a single failed product does not land
        // the panel on an empty tab.
        setActiveId(prev =>
          prev && next.some(v => v.id === prev && v.frames.length > 0)
            ? prev
            : (next.find(v => v.frames.length > 0)?.id ?? next[0].id),
        );
        setLoading(false);
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const active = views.find(v => v.id === activeId) ?? null;
  const frames = active?.frames ?? [];

  // Start each view on its most recent observation rather than the oldest frame.
  const lastObservedIndex = frames.reduce(
    (acc, frame, i) => (frame.forecast ? acc : i),
    frames.length > 0 ? 0 : -1,
  );

  useEffect(() => {
    setFrameIndex(lastObservedIndex >= 0 ? lastObservedIndex : 0);
    // Re-seek whenever the selected view changes or its frame list is refreshed.
  }, [activeId, frames.length, lastObservedIndex]);

  // Warm a sliding window ahead of the playhead. Preloading every frame would pull several
  // megabytes of JPEG on mount; this keeps playback smooth at a fraction of the transfer.
  // The ref tracks what has already been requested so a 180ms tick does not re-issue the
  // whole window each time.
  const preloaded = useRef(new Set<string>());
  useEffect(() => {
    if (frames.length === 0) return;
    for (let offset = 0; offset <= PRELOAD_AHEAD; offset++) {
      const { url } = frames[(frameIndex + offset) % frames.length];
      if (preloaded.current.has(url)) continue;
      preloaded.current.add(url);
      const img = new Image();
      img.src = url;
    }
  }, [frames, frameIndex]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    timerRef.current = setInterval(() => {
      setFrameIndex(i => (i + 1) % frames.length);
    }, FRAME_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, frames.length]);

  const step = (delta: number) => {
    setPlaying(false);
    setFrameIndex(i => (i + delta + frames.length) % frames.length);
  };

  const current = frames[Math.min(frameIndex, Math.max(frames.length - 1, 0))] ?? null;
  const panelError = loadError ?? active?.error ?? null;

  return (
    <div className="solar-panel solar-panel-wide">
      <div className="solar-panel-header">
        <div className="solar-panel-title">
          <Orbit size={16} />
          <span>Heliosphere</span>
          {loading
            ? <span className="solar-dot dot-loading" title="Loading imagery…" />
            : panelError
              ? <span className="solar-dot dot-error" title={panelError} />
              : <span className="solar-dot dot-ok" title="Live imagery" />}
        </div>
        <button className="solar-icon-btn" onClick={load} title="Reload imagery">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="helio-tabs">
        {views.map(view => (
          <button
            key={view.id}
            className={`helio-tab ${view.id === activeId ? 'helio-tab-on' : ''}`}
            onClick={() => setActiveId(view.id)}
            disabled={view.frames.length === 0 && view.error !== null}
            title={view.error ?? view.label}
          >
            {view.label}
          </button>
        ))}
      </div>

      {panelError && (
        <div className="solar-error">
          <AlertTriangle size={14} /> {panelError}
        </div>
      )}

      {current && (
        <>
          <div className="helio-stage">
            <img
              className="helio-frame"
              src={current.url}
              alt={`${active?.label ?? 'Heliosphere'} at ${formatFrameTime(current.time)}`}
              decoding="async"
            />
            {current.forecast && <span className="helio-badge">FORECAST</span>}
          </div>

          <div className="helio-controls">
            <button className="solar-icon-btn" onClick={() => step(-1)} title="Previous frame">
              <SkipBack size={14} />
            </button>
            <button
              className="solar-icon-btn"
              onClick={() => setPlaying(p => !p)}
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button className="solar-icon-btn" onClick={() => step(1)} title="Next frame">
              <SkipForward size={14} />
            </button>
            <input
              className="helio-scrub"
              type="range"
              min={0}
              max={Math.max(frames.length - 1, 0)}
              value={Math.min(frameIndex, Math.max(frames.length - 1, 0))}
              onChange={e => { setPlaying(false); setFrameIndex(Number(e.target.value)); }}
              aria-label="Scrub frames"
            />
            <span className="solar-value-small helio-timestamp">{formatFrameTime(current.time)}</span>
          </div>

          <p className="solar-hint helio-caption">{active?.description}</p>
          <div className="helio-footer">
            <span className="solar-value-small">
              {active?.credit} · frame {Math.min(frameIndex + 1, frames.length)}/{frames.length}
            </span>
            <a
              className="solar-embed-link"
              href={NASA_HELIOVIEWER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={11} /> NASA Helioviewer
            </a>
          </div>
        </>
      )}

      {!current && !panelError && (
        <p className="solar-hint">Loading heliosphere imagery…</p>
      )}
    </div>
  );
}
