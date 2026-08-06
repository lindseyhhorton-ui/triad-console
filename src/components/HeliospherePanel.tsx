import React, { useEffect, useState, useRef } from 'react';

type Frame = { url: string; timestamp: string; isForecast?: boolean };

const VENDOR_ENDPOINT = '/.netlify/functions/heliosphere';

export function HeliospherePanel(): JSX.Element {
  const [view, setView] = useState<'enlil' | 'c3' | 'c2'>('enlil');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`${VENDOR_ENDPOINT}?view=${view}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json || !json.frames) {
          setError('No frames returned');
          return;
        }
        setFrames(json.frames);
        setIndex(Math.max(0, json.frames.length - 1));
        setError(null);
      })
      .catch((err) => setError(String(err)));
  }, [view]);

  useEffect(() => {
    if (playing && frames.length) {
      intervalRef.current = window.setInterval(() => {
        setIndex((i) => Math.min(frames.length - 1, i + 1));
      }, 600);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, frames]);

  useEffect(() => {
    // stop at last frame
    if (index >= frames.length - 1) setPlaying(false);
  }, [index, frames.length]);

  const step = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(frames.length - 1, i + delta)));
  };

  const current = frames[index];

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Heliosphere</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm">View</label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="bg-stone-100 px-2 py-1 rounded"
          >
            <option value="enlil">WSA-Enlil Heliosphere</option>
            <option value="c3">LASCO C3</option>
            <option value="c2">LASCO C2</option>
          </select>
        </div>
      </div>

      <div className="h-64 md:h-80 bg-black rounded-md flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-red-400 p-4">{error}</div>
        ) : current ? (
          <img src={current.url} alt={current.timestamp} style={{maxHeight: '100%', width: 'auto'}} />
        ) : (
          <div className="text-stone-400">Loading frames…</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => { setPlaying(!playing); }} className="px-3 py-1 bg-sky-500 text-white rounded">
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => step(-1)} className="px-2 py-1 border rounded">◀</button>
        <button onClick={() => step(1)} className="px-2 py-1 border rounded">▶</button>

        <div className="flex-1 mx-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="text-xs text-stone-500 text-right w-48">
          {current ? (
            <>
              <div>{new Date(current.timestamp).toUTCString()}</div>
              <div className="text-amber-500">{current.isForecast ? 'FORECAST' : 'OBSERVATION'}</div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 text-sm text-stone-500">
        <a href="https://helioviewer.org" target="_blank" rel="noreferrer" className="underline">Open in Helioviewer</a>
      </div>
    </div>
  );
}

export default HeliospherePanel;
