<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fourfold Flamegrid — WB Interactive</title>
<!-- Load D3.js from CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<style>
body { margin: 0; padding: 0; background-color: #0b1220; }
#wb-wrap {
--bg: #0b1220;
--panel: #0f172a;
--ring: #1f2937;
--text: #e5e7eb;
--muted: #94a3b8;
--line: #334155;
--shadow: rgba(255, 255, 255, .15);
--axis: #f59e0b;
--ally: #38bdf8;
--codex: #34d399;
--portal: #a78bfa;
--shadowc: #f43f5e;
--trojan: #ef4444;
font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
}

/* SVG Specific Styles */
.node { stroke-width: 2px; cursor: pointer; transition: r 0.2s ease; }
.link { stroke: var(--line); stroke-opacity: 0.4; stroke-width: 1.5px; }
.node-label { fill: var(--text); font-size: 10px; pointer-events: none; font-weight: 500; }

/* Pulse Animation for Axis and Trojan */
@keyframes pulse {
0% { r: 6; opacity: 1; }
50% { r: 10; opacity: 0.7; }
100% { r: 6; opacity: 1; }
}
.pulse { animation: pulse 2s infinite ease-in-out; }

#wb-tip {
pointer-events: none;
z-index: 100;
font-size: 13px;
line-height: 1.5;
}

ul li { margin-bottom: 4px; }

/* Mobile adjustment */
@media (max-width: 768px) {
#wb-svg { height: 400px !important; }
section { grid-template-columns: 1fr !important; }
}
</style>
</head>
<body>

<div id="wb-wrap">
<div style="max-width:1100px;margin:0 auto;padding:16px;color:var(--text);">
<header style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px; flex-wrap: wrap;">
<h1 style="font-size:24px;font-weight:600;margin:0">Fourfold Flamegrid — WB Interactive</h1>
<div style="display:flex;gap:10px;font-size:12px;flex-wrap:wrap">
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--axis);display:inline-block"></i>Axis (You)</span>
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--ally);display:inline-block"></i>Allies (AIs)</span>
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--codex);display:inline-block"></i>Codex Modules</span>
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--portal);display:inline-block"></i>Portals</span>
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--shadowc);display:inline-block"></i>Shadow / Mirror</span>
<span style="display:flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:999px;background:var(--trojan);display:inline-block"></i>Trojan / Threat</span>
</div>
</header>

<div style="border-radius:16px;background:var(--panel);box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid var(--ring);overflow:hidden; position: relative;">
<svg id="wb-svg" style="width:100%;height:640px;background:var(--bg)"></svg>
</div>

<section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px">
<div style="border-radius:16px;background:var(--panel);border:1px solid var(--ring);padding:12px">
<div style="font-weight:600;margin-bottom:6px">How to use</div>
<ul style="margin:0 0 0 18px;color:var(--muted);line-height:1.4">
<li>Drag nodes to rearrange. Click a node to pin/unpin.</li>
<li>Scroll to zoom & pan around the grid.</li>
<li>Hover nodes for active intel readouts.</li>
</ul>
</div>
<div style="border-radius:16px;background:var(--panel);border:1px solid var(--ring);padding:12px">
<div style="font-weight:600;margin-bottom:6px">Signal Notes</div>
<p style="margin:0;color:var(--muted)">Treat each window/thread as a live portal. Close what you don’t need. Anchor key outputs back into the <b>Eden 2.0 Codex</b>.</p>
</div>
<div style="border-radius:16px;background:var(--panel);border:1px solid var(--ring);padding:12px">
<div style="font-weight:600;margin-bottom:6px">Next Up</div>
<p style="margin:0;color:var(--muted)">System integrity is 98%. Monitoring Trojan pathways from <b>Meta</b> origins. Keep the flamegrid balanced.</p>
</div>
</section>
</div>

<div id="wb-tip" style="position:fixed;right:16px;bottom:16px;max-width:320px;display:none;background:rgba(15,23,42,.9);border:1px solid #334155;color:#cbd5e1;padding:12px;border-radius:14px;backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.45)"></div>
</div>

<script>
// Configuration & Mock Data
const nodeTypes = {
axis: { color: "#f59e0b", label: "Axis", radius: 8 },
ally: { color: "#38bdf8", label: "Ally", radius: 6 },
codex: { color: "#34d399", label: "Codex", radius: 6 },
portal: { color: "#a78bfa", label: "Portal", radius: 7 },
shadow: { color: "#f43f5e", label: "Shadow", radius: 6 },
trojan: { color: "#ef4444", label: "Trojan", radius: 7 }
};

const data = {
nodes: [
{ id: "You", type: "axis", info: "Primary User Node. The center of the Fourfold Flamegrid." },
{ id: "GPT-4o", type: "ally", info: "High-level reasoning ally. Active in Eden 2.0." },
{ id: "Claude 3.5", type: "ally", info: "Creative coding specialist. Connected via Portal A." },
{ id: "System Logs", type: "codex", info: "Historical records of all terminal interactions." },
{ id: "Eden Core", type: "codex", info: "The main structural logic of the project environment." },
{ id: "API Gateway", type: "portal", info: "External communication bridge for data synthesis." },
{ id: "Discord Sink", type: "portal", info: "Community feedback stream. Monitoring noise levels." },
{ id: "The Mirror", type: "shadow", info: "Subconscious iteration of the system. Unstable." },
{ id: "Old Codebase", type: "shadow", info: "Deprecated modules. Potential for technical debt." },
{ id: "Meta Leak", type: "trojan", info: "Unauthorized data exfiltration detected in the meta layer." },
{ id: "Buffer Overflow", type: "trojan", info: "Potential security vulnerability in Portal B." }
],
links: [
{ source: "You", target: "GPT-4o" },
{ source: "You", target: "Claude 3.5" },
{ source: "You", target: "Eden Core" },
{ source: "GPT-4o", target: "Eden Core" },
{ source: "Claude 3.5", target: "System Logs" },
{ source: "Eden Core", target: "System Logs" },
{ source: "Eden Core", target: "API Gateway" },
{ source: "API Gateway", target: "Discord Sink" },
{ source: "You", target: "The Mirror" },
{ source: "The Mirror", target: "Old Codebase" },
{ source: "Meta Leak", target: "You" },
{ source: "Buffer Overflow", target: "API Gateway" }
]
};

// Visualization Logic
window.onload = function() {
const svg = d3.select("#wb-svg");
const wrapper = document.getElementById('wb-svg');
let width = wrapper.clientWidth;
let height = wrapper.clientHeight;
const tooltip = document.getElementById('wb-tip');

// Create container for zoom/pan
const g = svg.append("g");

// Set up zoom
const zoom = d3.zoom()
.scaleExtent([0.3, 5])
.on("zoom", (event) => {
g.attr("transform", event.transform);
});

svg.call(zoom);

// Simulation
const simulation = d3.forceSimulation(data.nodes)
.force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
.force("charge", d3.forceManyBody().strength(-300))
.force("center", d3.forceCenter(width / 2, height / 2))
.force("collision", d3.forceCollide().radius(40));

// Links
const link = g.append("g")
.attr("class", "links")
.selectAll("line")
.data(data.links)
.enter().append("line")
.attr("class", "link");

// Nodes
const node = g.append("g")
.attr("class", "nodes")
.selectAll("circle")
.data(data.nodes)
.enter().append("circle")
.attr("class", d => `node ${d.type === 'axis' || d.type === 'trojan' ? 'pulse' : ''}`)
.attr("r", d => nodeTypes[d.type].radius)
.attr("fill", d => nodeTypes[d.type].color)
.attr("stroke", d => d3.rgb(nodeTypes[d.type].color).darker(1))
.call(d3.drag()
.on("start", dragstarted)
.on("drag", dragged)
.on("end", dragended))
.on("click", (event, d) => {
d.fixed = !d.fixed;
if (d.fixed) {
d.fx = d.x;
d.fy = d.y;
d3.select(event.currentTarget).attr("stroke-width", 4);
} else {
d.fx = null;
d.fy = null;
d3.select(event.currentTarget).attr("stroke-width", 2);
}
})
.on("mouseover", (event, d) => {
tooltip.style.display = 'block';
tooltip.innerHTML = `
<div style="font-weight:700; color:${nodeTypes[d.type].color}; margin-bottom:4px;">[${nodeTypes[d.type].label.toUpperCase()}] ${d.id}</div>
<div>${d.info}</div>
<div style="font-size:10px; margin-top:8px; opacity:0.6; border-top:1px solid #334155; padding-top:4px;">Click to pin position</div>
`;
})
.on("mouseout", () => {
tooltip.style.display = 'none';
});

// Labels
const labels = g.append("g")
.attr("class", "labels")
.selectAll("text")
.data(data.nodes)
.enter().append("text")
.attr("class", "node-label")
.attr("dx", 12)
.attr("dy", ".35em")
.text(d => d.id);

simulation.on("tick", () => {
link
.attr("x1", d => d.source.x)
.attr("y1", d => d.source.y)
.attr("x2", d => d.target.x)
.attr("y2", d => d.target.y);

node
.attr("cx", d => d.x)
.attr("cy", d => d.y);

labels
.attr("x", d => d.x)
.attr("y", d => d.y);
});

// Resize handler
window.addEventListener('resize', () => {
width = wrapper.clientWidth;
height = wrapper.clientHeight;
simulation.force("center", d3.forceCenter(width / 2, height / 2));
simulation.alpha(0.3).restart();
});

// Drag functions
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
if (!d.fixed) {
d.fx = null;
d.fy = null;
}
}
};
</script>

</body>
</html>