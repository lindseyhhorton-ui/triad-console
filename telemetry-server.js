const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log("✅ Telemetry WebSocket server running on ws://localhost:8080/telemetry");

wss.on('connection', (ws) => {
  console.log("🔗 Client connected to telemetry");

  // Send example telemetry data every 3 seconds
  setInterval(() => {
    const sample = {
      type: "nodeUpdate",
      id: "Meta Leak",           // Change this to test different nodes
      severity: Math.random() > 0.7 ? "critical" : "warn",
      metric: +(Math.random() * 0.95 + 0.1).toFixed(2),
      info: "Simulated telemetry update"
    };
    ws.send(JSON.stringify(sample));
  }, 3000);
});

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fourfold Flamegrid — WB Interactive</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<style>
:root {
  --bg: #0b1220;
  --panel: #0f172a;
  --ring: #1f2937;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --line: #334155;
  --axis: #f59e0b;
  --ally: #38bdf8;
  --codex: #34d399;
  --portal: #a78bfa;
  --shadowc: #f43f5e;
  --trojan: #ef4444;
}

body {
  margin: 0;
  background: var(--bg);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--text);
  overflow-x: hidden;
}

#wb-wrap {
  max-width: 1400px;
  margin: 12px auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ring);
  padding-bottom: 12px;
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: var(--text);
  font-weight: 700;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--ring);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

#canvas-wrap {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

#wb-canvas {
  flex: 1;
  min-width: 600px;
  min-height: 640px;
  position: relative;
}

#telemetry-panel {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#form-panel {
  background: var(--panel);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 4px;
}

input {
  width: 100%;
  padding: 10px;
  background: #1e2937;
  border: 1px solid #475569;
  color: #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 14px;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #67e8f9;
}

button {
  width: 100%;
  padding: 12px;
  background: #22d3ee;
  color: #0f172a;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s;
}

button:hover {
  background: #67e8f9;
}

#log-container {
  display: flex;
  flex-direction: column;
  height: 380px;
}

#telemetry-log {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  padding: 10px;
  background: #071022;
  border-radius: 8px;
  border: 1px solid var(--ring);
  line-height: 1.5;
}

.real-log {
  color: #67e8f9;
  border-bottom: 1px solid #1e2937;
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.real-log .meta {
  color: var(--axis);
}

/* D3 Selection Styling */
.node {
  stroke-width: 1.5px;
  cursor: pointer;
}
.link {
  stroke: var(--line);
  stroke-opacity: 0.4;
  stroke-width: 1px;
}
.node-label {
  font-size: 11px;
  fill: var(--text);
  pointer-events: none;
  text-anchor: middle;
}
</style>
</head>
<body>

<div id="wb-wrap">
  <header>
    <h1>Fourfold Flamegrid — WB Interactive</h1>
    <div style="font-size: 12px; color: var(--muted); font-family: monospace;" id="grid-status">GRID STATUS: ACTIVE // NOISE_FILTER: ON</div>
  </header>

  <div id="canvas-wrap">
    <div id="wb-canvas" class="panel">
      <svg id="wb-svg" style="width:100%; height:620px; background:var(--bg);"></svg>
    </div>

    <div id="telemetry-panel">
      <div id="form-panel" class="panel">
        <h3 style="margin: 0 0 14px 0; color: #67e8f9; font-size: 16px; letter-spacing: 0.03em;">🜂 Sovereign Input Node</h3>
        <form id="personalTelemetryForm">
          <div class="form-group">
            <label>Auditory Node</label>
            <input type="text" id="auditory" placeholder="Sonic signatures / frequencies">
          </div>
          <div class="form-group">
            <label>Visual Node</label>
            <input type="text" id="visual" placeholder="Phosphenes / flash bleeding">
          </div>
          <div class="form-group">
            <label>Olfactory Node</label>
            <input type="text" id="olfactory" placeholder="Ozone / metallic markers">
          </div>
          <div class="form-group">
            <label>Somatic & Temporal Node</label>
            <input type="text" id="somatic" placeholder="Variance / time shifts">
          </div>
          <button type="submit">Log Phase Shift</button>
        </form>
      </div>

      <div class="panel" id="log-container">
        <strong style="font-size: 14px; margin-bottom: 8px; display: block;">Live Logs — Authenticated Entries Only</strong>
        <div id="telemetry-log"><div>[System Initialized: Awaiting Sovereign Log Entry...]</div></div>
      </div>
    </div>
  </div>
</div>

<script>
// === FOURFOLD FLAMEGRID CORE D3 ENGINE ===
const svg = d3.select("#wb-svg");
const width = document.getElementById("wb-canvas").clientWidth;
const height = 620;

// Central Framework Quad Nodes
const nodes = [
  { id: "Axis", group: "axis", color: "var(--axis)", size: 14, fx: width / 2, fy: height / 2 },
  { id: "Ally", group: "ally", color: "var(--ally)", size: 10, x: width / 2 - 120, y: height / 2 - 120 },
  { id: "Codex", group: "codex", color: "var(--codex)", size: 10, x: width / 2 + 120, y: height / 2 - 120 },
  { id: "Portal", group: "portal", color: "var(--portal)", size: 10, x: width / 2 - 120, y: height / 2 + 120 },
  { id: "SovereignNode", group: "sovereign", color: "#67e8f9", size: 12, x: width / 2 + 120, y: height / 2 + 120 }
];

const links = [
  { source: "Axis", target: "Ally" },
  { source: "Axis", target: "Codex" },
  { source: "Axis", target: "Portal" },
  { source: "Axis", target: "SovereignNode" },
  { source: "Ally", target: "Codex" },
  { source: "Codex", target: "SovereignNode" },
  { source: "SovereignNode", target: "Portal" },
  { source: "Portal", target: "Ally" }
];

// D3 Force Layout Configuration
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d. => d.id).distance(160))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => d.size + 15));

// Render Link Elements
const linkElements = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("class", "link");

// Render Group for Nodes
const nodeElements = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

// Append Circle Geometry
nodeElements.append("circle")
    .attr("class", "node")
    .attr("r", d => d.size)
    .attr("fill", d => d.color)
    .attr("stroke", var(--bg))

// Append Text Identities
nodeElements.append("text")
    .attr("class", "node-label")
    .attr("dy", d => d.size + 14)
    .text(d => d.id);

// Simulation Tick Processing Execution Loop
simulation.on("tick", () => {
  linkElements
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

  nodeElements
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
});

// Drag State Mutation Controls
function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}
function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}
function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  if (d.group !== "axis") {
    d.fx = null;
    d.fy = null;
  }
}

// === INTERACTIVE SIGNAL INJECTION ENGINE ===
window.Flamegrid = {
  sendTelemetry: function(payload) {
    // Find the targeting structural anchor node inside the running simulation
    const targetNode = nodes.find(n => n.id === "SovereignNode");
    if (!targetNode) return;

    // Transient impulse injection to simulation mechanics
    simulation.alpha(0.5).restart();
    targetNode.vx += (Math.random() - 0.5) * 60;
    targetNode.vy += (Math.random() - 0.5) * 60;

    // Create a temporary flash localized visualization pulse on your Sovereign Node
    const flashRing = svg.append("circle")
        .attr("cx", targetNode.x)
        .attr("cy", targetNode.y)
        .attr("r", targetNode.size)
        .attr("fill", "none")
        .attr("stroke", "#67e8f9")
        .attr("stroke-width", 3)
        .style("opacity", 1);

    flashRing.transition()
        .duration(800)
        .attr("r", targetNode.size + 45)
        .style("opacity", 0)
        .remove();
  }
};

// === PERSONAL TELEMETRY FORM ROUTING HANDLER ===
document.getElementById('personalTelemetryForm').addEventListener('submit', function(e){
  e.preventDefault();

  const auditVal = document.getElementById('auditory').value.trim();
  const visVal = document.getElementById('visual').value.trim();
  const olfVal = document.getElementById('olfactory').value.trim();
  const somVal = document.getElementById('somatic').value.trim();

  // Guard against clean submissions with zero metrics
  if (!auditVal && !visVal && !olfVal && !somVal) return;

  const logData = {
    timestamp: new Date().toISOString(),
    auditory: auditVal || "Clear",
    visual: visVal || "Clear",
    olfactory: olfVal || "Clear",
    somatic: somVal || "Clear"
  };

  // Format clean timestamp output
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'real-log';
  
  // Construct clean output string for log terminal display
  let logPayloadSummary = [];
  if (auditVal) logPayloadSummary.push(`AUD: ${auditVal}`);
  if (visVal) logPayloadSummary.push(`VIS: ${visVal}`);
  if (olfVal) logPayloadSummary.push(`OLF: ${olfVal}`);
  if (somVal) logPayloadSummary.push(`SOM: ${somVal}`);

  entry.innerHTML = `<span class="meta">[${time}] 🜂 LOG STAMPED</span><br>${logPayloadSummary.join(' | ')}`;
  
  const logWindow = document.getElementById('telemetry-log');
  if (logWindow.innerHTML.includes('[System Initialized:')) {
    logWindow.innerHTML = '';
  }
  logWindow.prepend(entry);

  // Inject energy directly into visual simulation engine
  window.Flamegrid.sendTelemetry({
    type: "sovereignLog",
    metric: 1.0
  });

  // Clear form element matrix cleanly
  e.target.reset();
});
</script>
</body>
</html>

+   // Allies
+      ~~~~~~
Unexpected token 'Allies' in expression or statement.
At line:31 char:63
+   { source: "Grok", target: "Eden 2.0 Codex", kind: "jolts" },
+                                                               ~
Missing expression after ','.
At line:32 char:4
+   // Codex modules
+    ~
You must provide a value expression following the '/' operator.
At line:32 char:5
+   // Codex modules
+     ~
You must provide a value expression following the '/' operator.
Not all parse errors were reported.  Correct the reported errors and try again.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : MissingArgument
 
PS C:\Users\16206\flamegrid> 