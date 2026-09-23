/**
 * OceanSight 3D — HUD & UI Controller
 * Live Thermocline Profile Chart, Arabian Sea Radar Minimap,
 * Floating Probe Badge, Vertical Temperature Needle, and Forecast Timeline
 */

export class HUDController {
  constructor(app) {
    this.app = app;

    // Canvas References
    this.thermoCanvas = document.getElementById('thermocline-canvas');
    this.thermoCtx = this.thermoCanvas.getContext('2d');
    this.thermoCanvas.width = 310;
    this.thermoCanvas.height = 220;

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.minimapCanvas.width = 220;
    this.minimapCanvas.height = 100;

    // HUD Elements
    this.probeBadge = document.getElementById('floating-probe-badge');
    this.probeTempDisplay = document.getElementById('probe-temp-display');
    this.probeDepthDisplay = document.getElementById('probe-depth-display');

    this.needle = document.getElementById('colorbar-needle');

    this.initEventListeners();
  }

  initEventListeners() {
    // Quick-jump depth buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alt = parseFloat(e.target.getAttribute('data-alt'));
        this.app.setTargetAltitude(alt);
      });
    });

    // Altitude depth slider
    const depthSlider = document.getElementById('depth-slider');
    if (depthSlider) {
      depthSlider.addEventListener('input', (e) => {
        this.app.setTargetAltitude(parseFloat(e.target.value));
      });
    }

    // Forecast time scrubber
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        this.app.timeIndex = parseInt(e.target.value);
        this.updateTimeForecastUI();
      });
    }

    // Play/Pause Forecast timeline button
    const playBtn = document.getElementById('time-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.app.toggleTimePlay();
      });
    }

    // Camera mode toggle buttons
    const modeBtnSlider = document.getElementById('mode-slider');
    const modeBtnFps = document.getElementById('mode-fps');
    if (modeBtnSlider && modeBtnFps) {
      modeBtnSlider.addEventListener('click', () => this.app.switchMode('SLIDER'));
      modeBtnFps.addEventListener('click', () => this.app.switchMode('FPS'));
    }

    // Layer toggles
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const layerKey = e.currentTarget.getAttribute('data-layer');
        const active = this.app.toggleLayer(layerKey);
        const indicator = e.currentTarget.querySelector('.indicator-dot');
        if (indicator) {
          indicator.style.background = active ? 'var(--primary)' : '#475569';
          indicator.style.boxShadow = active ? '0 0 8px var(--primary)' : 'none';
        }
      });
    });

    // Modal Close
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        document.getElementById('inspect-modal').style.display = 'none';
      });
    }

    // Drag-and-drop NetCDF Ingestion
    const dropZone = document.getElementById('netcdf-dropzone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          this.app.handleNetCDFFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  update(telemetry) {
    // 1. Update Top Floating In-Situ Probe Badge
    if (this.probeTempDisplay && this.probeDepthDisplay) {
      const isWater = telemetry.altitude <= 0;
      const depthStr = isWater ? `${telemetry.depthMeters} m` : `+${telemetry.altitude} m (AIR)`;
      this.probeDepthDisplay.innerText = depthStr;
      this.probeTempDisplay.innerText = `${telemetry.temperature.toFixed(2)} °C`;

      // Color badge by temperature
      let badgeCol = '#00e5ff';
      if (telemetry.temperature > 24.0) badgeCol = '#ff3366';
      else if (telemetry.temperature > 16.0) badgeCol = '#ffb700';
      else if (telemetry.temperature > 9.0) badgeCol = '#00ff99';
      this.probeTempDisplay.style.color = badgeCol;
    }

    // 2. Update Vertical Temperature Colorbar Needle
    if (this.needle) {
      // 0°C (bottom: 100%) to 30°C (top: 0%)
      const norm = Math.max(0.0, Math.min(1.0, (telemetry.temperature - 0.0) / 30.0));
      const needleTopPct = (1.0 - norm) * 100.0;
      this.needle.style.top = `${needleTopPct.toFixed(1)}%`;
    }

    // 3. Redraw Thermocline Profile Chart
    this.drawThermoclineChart(telemetry);

    // 4. Redraw Arabian Sea Radar Minimap
    this.drawMinimap();
  }

  drawThermoclineChart(telemetry) {
    const ctx = this.thermoCtx;
    const w = this.thermoCanvas.width;
    const h = this.thermoCanvas.height;

    ctx.fillStyle = '#040d1a';
    ctx.fillRect(0, 0, w, h);

    const padL = 36, padR = 10, padT = 12, padB = 26;
    const cW = w - padL - padR;
    const cH = h - padT - padB;

    // ── Ocean Zone Bands ──
    const yZ0 = padT + (0 / 500) * cH;
    const yZ50 = padT + (50 / 500) * cH;
    const yZ140 = padT + (140 / 500) * cH;
    const yZ500 = padT + (500 / 500) * cH;

    // Surface Mixed Layer: 0-50m
    const gradSurf = ctx.createLinearGradient(0, yZ0, 0, yZ50);
    gradSurf.addColorStop(0, 'rgba(255, 90, 20, 0.16)');
    gradSurf.addColorStop(1, 'rgba(255, 183, 0, 0.08)');
    ctx.fillStyle = gradSurf;
    ctx.fillRect(padL, yZ0, cW, yZ50 - yZ0);

    // Thermocline Layer (Sonar Shadow): 50-140m
    const gradThermo = ctx.createLinearGradient(0, yZ50, 0, yZ140);
    gradThermo.addColorStop(0, 'rgba(255, 183, 0, 0.16)');
    gradThermo.addColorStop(1, 'rgba(0, 200, 200, 0.08)');
    ctx.fillStyle = gradThermo;
    ctx.fillRect(padL, yZ50, cW, yZ140 - yZ50);

    // Abyssal Zone: 140-500m
    const gradDeep = ctx.createLinearGradient(0, yZ140, 0, yZ500);
    gradDeep.addColorStop(0, 'rgba(0, 80, 180, 0.08)');
    gradDeep.addColorStop(1, 'rgba(10, 0, 80, 0.22)');
    ctx.fillStyle = gradDeep;
    ctx.fillRect(padL, yZ140, cW, yZ500 - yZ140);

    // Zone Labels
    ctx.font = "bold 7px 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(255, 120, 40, 0.85)';
    ctx.fillText('SURFACE MIXED', padL + 4, yZ0 + 12);
    ctx.fillStyle = 'rgba(255, 200, 0, 0.85)';
    ctx.fillText('THERMOCLINE ▲ SONAR SHADOW', padL + 4, yZ50 + 13);
    ctx.fillStyle = 'rgba(80, 160, 255, 0.75)';
    ctx.fillText('DEEP / ABYSS', padL + 4, yZ140 + 13);

    // Depth Axis Gridlines
    ctx.lineWidth = 1;
    ctx.font = "8px 'JetBrains Mono', monospace";
    [0, 50, 100, 200, 350, 500].forEach(d => {
      const y = padT + (d / 500) * cH;
      ctx.strokeStyle = d === 50 || d === 140 ? 'rgba(255, 183, 0, 0.35)' : 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash(d === 50 ? [3, 3] : []);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(139, 168, 200, 0.85)';
      ctx.fillText(`${d}m`, 2, y + 3.5);
    });

    // Temperature Axis Labels at Bottom
    ctx.fillStyle = 'rgba(139, 168, 200, 0.85)';
    [4, 10, 18, 26, 30].forEach(t => {
      const x = padL + ((t - 4) / 26) * cW;
      ctx.fillText(`${t}°`, x - 5, h - 6);
    });

    // Sigmoid Thermocline Curve
    for (let d = 0; d <= 495; d += 5) {
      const therm1 = 1.0 / (1.0 + Math.exp((d - 95.0) / 32.0));
      const therm2 = 1.0 / (1.0 + Math.exp(((d + 5) - 95.0) / 32.0));
      const t1 = 5.5 + 24.0 * therm1;
      const t2 = 5.5 + 24.0 * therm2;
      const x1 = padL + ((t1 - 4) / 26) * cW;
      const y1 = padT + (d / 500) * cH;
      const x2 = padL + ((t2 - 4) / 26) * cW;
      const y2 = padT + ((d + 5) / 500) * cH;

      let cr, cg, cb;
      if (therm1 > 0.7) { cr = 255; cg = 120 + (therm1 - 0.7) * 200; cb = 20; }
      else if (therm1 > 0.35) { const u = (therm1 - 0.35) / 0.35; cr = Math.round(u * 200); cg = 210; cb = Math.round(255 - u * 235); }
      else { cr = 40; cg = Math.round(80 + therm1 * 300); cb = 255; }

      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.95)`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Current Depth/Temp Crosshair Dot with Readout
    const currentDepth = Math.max(0, -this.app.cameraAltitude);
    const currTherm = 1.0 / (1.0 + Math.exp((currentDepth - 95.0) / 32.0));
    const currTemp = 5.5 + 24.0 * currTherm;
    const dotX = padL + ((currTemp - 4) / 26) * cW;
    const dotY = padT + (Math.min(500, currentDepth) / 500) * cH;

    // Crosshairs
    ctx.strokeStyle = 'rgba(255, 0, 80, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(padL, dotY); ctx.lineTo(dotX, dotY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dotX, padT); ctx.lineTo(dotX, dotY); ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Dot
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#ff4488';
    ctx.font = "bold 8px 'JetBrains Mono', monospace";
    const label = `${currTemp.toFixed(1)}°C`;
    const lx = dotX + 8 > w - padR - 35 ? dotX - 38 : dotX + 8;
    ctx.fillText(label, lx, dotY + 4);
  }

  drawMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#06111e';
    ctx.fillRect(0, 0, w, h);

    // Arabian Sea Coastline approximation
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.75, 0);
    ctx.bezierCurveTo(w * 0.7, h * 0.3, w * 0.8, h * 0.6, w * 0.85, h);
    ctx.stroke();

    // Landmass fill
    ctx.fillStyle = 'rgba(0, 80, 120, 0.25)';
    ctx.lineTo(w, h);
    ctx.lineTo(w, 0);
    ctx.fill();

    // Radar Range Rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w * 0.4, h * 0.5, 25, 0, Math.PI * 2);
    ctx.arc(w * 0.4, h * 0.5, 48, 0, Math.PI * 2);
    ctx.stroke();

    // ARGO Float positions
    this.app.netcdfEngine.activeDataset.argoFloats.forEach(b => {
      const bx = w * 0.4 + (b.worldX / 160) * 35;
      const bz = h * 0.5 + (b.worldZ / 160) * 35;
      ctx.fillStyle = b.status === "OPTIMAL" ? '#00ffaa' : '#ffb700';
      ctx.beginPath();
      ctx.arc(bx, bz, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vessel / Camera Position Icon
    const camX = w * 0.4 + (this.app.camera.position.x / 160) * 35;
    const camZ = h * 0.5 + (this.app.camera.position.z / 160) * 35;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(camX, camZ, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  updateTimeForecastUI() {
    const playBtn = document.getElementById('time-play-btn');
    const timeDisplay = document.getElementById('time-display');
    if (playBtn) playBtn.innerText = this.app.isPlaying ? '⏸ PAUSE' : '▶ PLAY';
    if (timeDisplay) timeDisplay.innerText = `DAY +${this.app.timeIndex} (00:00 UTC)`;
    const slider = document.getElementById('time-slider');
    if (slider) slider.value = this.app.timeIndex;
  }

  showBuoyInspectionModal(buoyData) {
    const modal = document.getElementById('inspect-modal');
    if (!modal) return;
    document.getElementById('modal-buoy-name').innerText = buoyData.name;
    document.getElementById('modal-id').innerText = buoyData.id;
    document.getElementById('modal-coords').innerText = `${buoyData.lat}, ${buoyData.lon}`;
    document.getElementById('modal-depth').innerText = `${buoyData.depthMeters} m`;
    document.getElementById('modal-temp').innerText = buoyData.temp;
    document.getElementById('modal-salinity').innerText = buoyData.salinity;
    document.getElementById('modal-battery').innerText = buoyData.battery;
    document.getElementById('modal-status').innerText = buoyData.status;
    document.getElementById('modal-cycle').innerText = `#${buoyData.cycle}`;
    document.getElementById('modal-sensors').innerText = buoyData.sensors || 'CTD Sensor';
    modal.style.display = 'block';
  }
}
