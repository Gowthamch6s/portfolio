// Drives every DOM element in the overlay: progress/objective panel,
// interact prompt, treasure/discovery toast, content reveal panel, and the
// quality/mute/back controls.
export class HUD {
  constructor({ totalNodes, onToggleMute, onQualityChange }) {
    this.totalNodes = totalNodes;
    this.visitedNodes = new Set();

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
    this._toastTimeout = null;

    this.muteBtn.addEventListener('click', () => {
      const muted = this.muteBtn.classList.toggle('muted');
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
      onToggleMute(muted);
    });
    this.qualitySelect.addEventListener('change', () => onQualityChange(this.qualitySelect.value));

    this._updateProgress();
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

  showPlanetIntro(planetData) {
    this.panelCard.innerHTML = `
      <div class="icon">🪐</div>
      <h2>${planetData.name}</h2>
      <div class="subtitle">${planetData.theme}</div>
      <p>Explore the surface and approach a glowing monument to see what's here.</p>
      <div class="actions">
        <button class="btn close" data-close>Land</button>
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
