// Drives every DOM element in the overlay: progress/objective panel,
// node-graph minimap, interact prompt, discovery toast, content reveal
// panel, and the quality/mute controls.
export class HUD {
  constructor({ totalNodes, districts, onToggleMute, onQualityChange }) {
    this.totalNodes = totalNodes;
    this.visitedNodes = new Set();
    this.districts = districts;

    this.progressBar = document.getElementById('progress-bar');
    this.progressLabel = document.getElementById('progress-label');
    this.progressPct = document.getElementById('progress-pct');
    this.objectiveEl = document.getElementById('objective-text');
    this.promptEl = document.getElementById('interact-prompt');
    this.toastEl = document.getElementById('discovery-toast');
    this.panelOverlay = document.getElementById('panel-overlay');
    this.panelCard = document.getElementById('panel-card');
    this.muteBtn = document.getElementById('mute-toggle');
    this.qualitySelect = document.getElementById('quality-select');
    this.mapCanvas = document.getElementById('node-map');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this._toastTimeout = null;

    this.muteBtn.addEventListener('click', () => {
      const muted = this.muteBtn.classList.toggle('muted');
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
      onToggleMute(muted);
    });
    this.qualitySelect.addEventListener('change', () => onQualityChange(this.qualitySelect.value));

    this._resizeMap();
    window.addEventListener('resize', () => this._resizeMap());
    this._updateProgress();
  }

  _resizeMap() {
    const rect = this.mapCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.mapCanvas.width = Math.max(1, rect.width * dpr);
    this.mapCanvas.height = Math.max(1, rect.height * dpr);
  }

  // A small node-graph — spawn hub in the middle, one node per district
  // connected back to it, player position as a moving dot — echoing the
  // reference game's minimap widget instead of a literal terrain render.
  updateMap(spawnPos, playerPosition) {
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min(w, h) / 340;
    const toMap = (x, z) => [w / 2 + (x - spawnPos.x) * scale, h / 2 + (z - spawnPos.z) * scale];

    const [hx, hy] = toMap(spawnPos.x, spawnPos.z);
    ctx.strokeStyle = 'rgba(139,92,246,0.4)';
    ctx.lineWidth = 1.5;
    for (const d of this.districts) {
      const [dx, dy] = toMap(d.position.x, d.position.z);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffe8b0';
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();

    for (const d of this.districts) {
      const [dx, dy] = toMap(d.position.x, d.position.z);
      ctx.fillStyle = `#${d.color.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const [px, py] = toMap(playerPosition.x, playerPosition.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  setObjective(text) {
    this.objectiveEl.textContent = text;
  }

  markVisited(nodeId) {
    if (this.visitedNodes.has(nodeId)) return;
    this.visitedNodes.add(nodeId);
    this._updateProgress();
  }

  _updateProgress() {
    const n = this.visitedNodes.size;
    const pct = Math.round((n / this.totalNodes) * 100);
    this.progressBar.style.width = `${pct}%`;
    this.progressLabel.textContent = `${n}/${this.totalNodes} discovered`;
    this.progressPct.textContent = `${pct}%`;
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

  showNodePanel(node, nodeId) {
    this.markVisited(nodeId);
    const linkHtml = node.link
      ? `<a class="btn" href="${node.link}" ${node.download ? 'download' : 'target="_blank" rel="noreferrer"'}>${node.linkLabel || 'Open'} →</a>`
      : '';
    this.panelCard.innerHTML = `
      <div class="icon">✦</div>
      <h2>${node.title}</h2>
      ${node.subtitle ? `<div class="subtitle">${node.subtitle}</div>` : ''}
      <p>${node.detail}</p>
      <div class="actions">
        ${linkHtml}
        <button class="btn close" data-close>Keep Exploring</button>
      </div>
    `;
    this.panelOverlay.classList.add('visible');
    const closeBtn = this.panelCard.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());
  }

  showDistrictIntro(districtData) {
    this.panelCard.innerHTML = `
      <div class="icon">📍</div>
      <h2>${districtData.name}</h2>
      <div class="subtitle">${districtData.theme}</div>
      <p>A new district is coming online. Approach a glowing monument and press E.</p>
      <div class="actions">
        <button class="btn close" data-close>Explore</button>
      </div>
    `;
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
}
