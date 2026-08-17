// Drives every DOM element in the console overlay: the top-down route map,
// the compass, the speed readout, the physical Day/Night toggle, the
// interact prompt, and the project/treasure reveal panel. Kept as one class
// so main.js has a single place to push state into each frame.
export class ConsoleUI {
  constructor({ islands, treasures, whirlpoolPosition, whirlpoolRadius, onToggleDayNight }) {
    this.islands = islands;
    this.treasures = treasures;
    this.whirlpoolPosition = whirlpoolPosition;
    this.whirlpoolRadius = whirlpoolRadius;

    this.mapCanvas = document.getElementById('console-map');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this.compassCanvas = document.getElementById('console-compass');
    this.compassCtx = this.compassCanvas.getContext('2d');
    this.speedEl = document.getElementById('speed-readout');
    this.headingEl = document.getElementById('heading-readout');
    this.promptEl = document.getElementById('interact-prompt');
    this.toastEl = document.getElementById('treasure-toast');

    this.toggleEl = document.getElementById('daynight-toggle');
    this.toggleEl.addEventListener('click', () => onToggleDayNight());

    this.panelOverlay = document.getElementById('panel-overlay');
    this.panelCard = document.getElementById('panel-card');
    this._toastTimeout = null;

    this._resizeCanvases();
    window.addEventListener('resize', () => this._resizeCanvases());
  }

  _resizeCanvases() {
    for (const canvas of [this.mapCanvas, this.compassCanvas]) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
    }
  }

  setDayNight(isNight) {
    this.toggleEl.classList.toggle('night', isNight);
  }

  showPrompt(text) {
    this.promptEl.textContent = text;
    this.promptEl.classList.add('visible');
  }

  hidePrompt() {
    this.promptEl.classList.remove('visible');
  }

  showToast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('visible');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => this.toastEl.classList.remove('visible'), 2600);
  }

  showProjectPanel(island) {
    this.panelCard.innerHTML = `
      <div class="icon">🏝️</div>
      <h2>${island.title}</h2>
      <div class="subtitle">${island.subtitle} — ${island.tech}</div>
      <p>Docked at ${island.title}. Take a look at the project.</p>
      <div class="actions">
        <a class="btn" href="${island.link}" target="_blank" rel="noreferrer">${island.linkLabel} →</a>
        <button class="btn close" data-close>Keep Exploring</button>
      </div>
    `;
    this._openPanel();
  }

  showTreasurePanel(treasure) {
    const actionHtml =
      treasure.action === 'download'
        ? `<a class="btn" href="${treasure.href}" download>${treasure.actionLabel}</a>`
        : `<a class="btn" href="${treasure.href}" target="_blank" rel="noreferrer">${treasure.actionLabel}</a>`;
    this.panelCard.innerHTML = `
      <div class="icon">${treasure.icon}</div>
      <h2>${treasure.title}</h2>
      <div class="subtitle">Treasure Discovered</div>
      <p>${treasure.detail}</p>
      <div class="actions">
        ${actionHtml}
        <button class="btn close" data-close>Keep Exploring</button>
      </div>
    `;
    this._openPanel();
  }

  _openPanel() {
    this.panelOverlay.classList.add('visible');
    const closeBtn = this.panelCard.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());
  }

  closePanel() {
    this.panelOverlay.classList.remove('visible');
  }

  get isPanelOpen() {
    return this.panelOverlay.classList.contains('visible');
  }

  updateReadouts(speed, headingDeg) {
    this.speedEl.textContent = `${Math.round(Math.abs(speed) * 3.2)} kn`;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((headingDeg % 360) + 360) % 360 / 45) % 8;
    this.headingEl.textContent = dirs[idx];
  }

  updateCompass(headingRad) {
    const ctx = this.compassCtx;
    const w = this.compassCanvas.width;
    const h = this.compassCanvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 6;

    ctx.strokeStyle = 'rgba(100,230,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-headingRad);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = `${Math.round(r * 0.28)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const marks = [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]];
    for (const [label, angle] of marks) {
      const x = Math.sin(angle) * r * 0.72;
      const y = -Math.cos(angle) * r * 0.72;
      ctx.fillStyle = label === 'N' ? '#ff6b6b' : '#8fd6ec';
      ctx.fillText(label, x, y);
    }
    ctx.restore();

    // fixed boat-pointer triangle (boat always "faces up")
    ctx.fillStyle = '#1fd7e8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.4);
    ctx.lineTo(cx + r * 0.14, cy + r * 0.2);
    ctx.lineTo(cx - r * 0.14, cy + r * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  updateMap(boatPosition, boatHeading) {
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // world -> map: centered on the boat, north-up, fixed zoom
    const scale = w / 420;
    const toMap = (wx, wz) => [w / 2 + (wx - boatPosition.x) * scale, h / 2 + (wz - boatPosition.z) * scale];

    // whirlpool danger ring
    const [wx, wy] = toMap(this.whirlpoolPosition.x, this.whirlpoolPosition.z);
    ctx.strokeStyle = 'rgba(255,90,90,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, wy, this.whirlpoolRadius * scale, 0, Math.PI * 2);
    ctx.stroke();

    for (const island of this.islands) {
      const [ix, iy] = toMap(island.position.x, island.position.z);
      if (ix < -20 || ix > w + 20 || iy < -20 || iy > h + 20) continue;
      ctx.fillStyle = `#${island.accent.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(ix, iy, Math.max(3, island.radius * scale * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    for (const treasure of this.treasures) {
      const [tx, ty] = toMap(treasure.position.x, treasure.position.z);
      if (tx < -20 || tx > w + 20 || ty < -20 || ty > h + 20) continue;
      ctx.fillStyle = treasure.opened ? 'rgba(255,215,107,0.35)' : '#ffd76b';
      ctx.font = `${Math.round(14 * scale * 3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', tx, ty);
    }

    // boat marker, fixed at center, pointing with heading
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(boatHeading);
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
