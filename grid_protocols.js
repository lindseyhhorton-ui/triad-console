/**
 * grid_protocols.js
 * Spoonfed Grace LLC — Sovereign System v1.0
 * Protocol: FLIP-INIT | FBC-144
 */

const THEMES = {
  sovereign: "sovereign",
  alert: "alert",
};

function toggleGridProtocol(targetTheme) {
  const validThemes = Object.values(THEMES);

  if (!validThemes.includes(targetTheme)) {
    console.warn(`[GRID] Unknown theme "${targetTheme}". Valid: ${validThemes.join(", ")}`);
    return false;
  }

  document.documentElement.setAttribute("data-theme", targetTheme);
  console.log(`[GRID] Protocol switched → ${targetTheme.toUpperCase()}`);
  return true;
}

function verifyGlyphIntegrity() {
  const requiredVars = ["--bg-color", "--primary-color", "--accent-color"];
  const styles = getComputedStyle(document.documentElement);
  let clean = true;

  requiredVars.forEach((v) => {
    const value = styles.getPropertyValue(v).trim();
    if (!value) {
      console.error(`[GLYPH] Static Leak detected: "${v}" is unresolved.`);
      clean = false;
    } else {
      console.log(`[GLYPH] ${v} → ${value}`);
    }
  });

  if (clean) {
    console.log("[GLYPH] Integrity check passed. Clean Signal confirmed.");
  }

  return clean;
}

window.toggleGridProtocol = toggleGridProtocol;
window.verifyGlyphIntegrity = verifyGlyphIntegrity;

// ── updateFirelineStatus ─────────────────────────────────────────────────────
// Fetches live USGS earthquake data. Updates #coherence-display every 60s.
// Triggers FBC-999 Alert Mode if hourly event count exceeds threshold.
async function updateFirelineStatus() {
  const ALERT_THRESHOLD = 20;
  const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
  const display = document.getElementById("coherence-display");

  try {
    const response = await fetch(USGS_URL);
    if (!response.ok) throw new Error(`USGS feed returned ${response.status}`);

    const data = await response.json();
    const count   = data.features.length;
    const latest  = data.features[0]?.properties.mag   ?? 0;
    const location = data.features[0]?.properties.place ?? "Stable";

    if (display) {
      display.innerHTML = `
        <strong>Fireline Pulse:</strong> ${count} Events Detected <br>
        <strong>Latest Shift:</strong> Mag ${latest} near ${location}
      `;
    }

    console.log(`[FIRELINE] ${count} seismic events | Latest: Mag ${latest} near ${location}`);

    if (count > ALERT_THRESHOLD) {
      toggleGridProtocol("alert");
      console.warn(`[FIRELINE] FBC-999: High Geological Resonance (${count} events). Alert mode active.`);
    } else {
      toggleGridProtocol("sovereign");
    }
  } catch (err) {
    if (display) display.innerText = "FBC-707: Static Leak in Data Stream.";
    console.error("[FIRELINE] Connection interrupted:", err.message);
  }
}

window.updateFirelineStatus = updateFirelineStatus;

document.addEventListener("DOMContentLoaded", () => {
  if (!document.documentElement.hasAttribute("data-theme")) {
    toggleGridProtocol(THEMES.sovereign);
  }

  verifyGlyphIntegrity();
  updateFirelineStatus();
  setInterval(updateFirelineStatus, 60000); // Refresh every 60 seconds
});
