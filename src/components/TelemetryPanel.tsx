import { useState } from 'react';

interface TelemetryLog {
  node: string;
  value: number;
  unit: string;
  status: 'nominal' | 'monitor' | 'alert';
  note: string;
}

interface TelemetryPanelProps {
  onLogSubmit?: (log: TelemetryLog) => void;
}

export default function TelemetryPanel({ onLogSubmit }: TelemetryPanelProps) {
  const [node, setNode] = useState('Temporal Drift');
  const [value, setValue] = useState('0');
  const [unit, setUnit] = useState('ratio');
  const [status, setStatus] = useState<'nominal' | 'monitor' | 'alert'>('nominal');
  const [note, setNote] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const submit = () => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return;

    const log = { node: node.trim(), value: parsed, unit: unit.trim(), status, note: note.trim() };
    onLogSubmit?.(log);
    setLastSaved(new Date().toLocaleString('en-US', { hour12: false }));
    setNote('');
  };

  return (
    <div className="solar-panel solar-panel-wide">
      <div className="solar-panel-header">
        <div className="solar-panel-title">
          <span>Telemetry Node Input</span>
        </div>
      </div>

      <div className="solar-data-grid" style={{ marginBottom: 12 }}>
        <label className="solar-metric">
          <span className="solar-label">Node</span>
          <input className="solar-input" value={node} onChange={e => setNode(e.target.value)} placeholder="Telemetry node name" />
        </label>

        <label className="solar-metric">
          <span className="solar-label">Value</span>
          <input
            className="solar-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        </label>

        <label className="solar-metric">
          <span className="solar-label">Unit</span>
          <input className="solar-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="ratio" />
        </label>

        <label className="solar-metric">
          <span className="solar-label">Status</span>
          <select className="solar-input" value={status} onChange={e => setStatus(e.target.value as 'nominal' | 'monitor' | 'alert')}>
            <option value="nominal">nominal</option>
            <option value="monitor">monitor</option>
            <option value="alert">alert</option>
          </select>
        </label>
      </div>

      <textarea
        className="solar-textarea"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional context for this telemetry event"
        rows={2}
      />

      <div className="solar-action-row">
        <button className="solar-btn" onClick={submit}>Save Telemetry</button>
        <span className="solar-value-small">{lastSaved ? `Last saved: ${lastSaved}` : 'No telemetry saved yet'}</span>
      </div>
    </div>
  );
}
