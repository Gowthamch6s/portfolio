const CATEGORY_COLORS = {
  education: '#e8b23a',
  experience: '#5cc26a',
  arch: '#ffb347',
  project: '#64e6ff',
};

// A simple top-down schematic (not a literal terrain render) covering the walk-up area and
// the full ski run: fixed/north-up, with waypoint dots colored by category and a rotating
// arrow for the player's live position + heading.
export class Minimap {
  constructor(waypoints, { worldMinZ = -420, worldMaxZ = 65, worldHalfWidth = 40 } = {}) {
    this.waypoints = waypoints;
    this.worldMinZ = worldMinZ;
    this.worldMaxZ = worldMaxZ;
    this.worldHalfWidth = worldHalfWidth;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap';
    this.canvas.width = 168;
    this.canvas.height = 200;
    document.getElementById('app').appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _worldToMap(x, z) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const px = w / 2 + (x / this.worldHalfWidth) * (w / 2 - 12);
    const py = 12 + ((this.worldMaxZ - z) / (this.worldMaxZ - this.worldMinZ)) * (h - 24);
    return [px, py];
  }

  update(player) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // The run corridor, as a simple tapering strip rather than the actual noisy terrain.
    ctx.fillStyle = 'rgba(180, 210, 235, 0.18)';
    const [topL] = [this._worldToMap(-this.worldHalfWidth * 0.5, this.worldMaxZ)];
    ctx.beginPath();
    const p1 = this._worldToMap(-14, this.worldMaxZ);
    const p2 = this._worldToMap(14, this.worldMaxZ);
    const p3 = this._worldToMap(24, this.worldMinZ);
    const p4 = this._worldToMap(-24, this.worldMinZ);
    ctx.moveTo(...p1);
    ctx.lineTo(...p2);
    ctx.lineTo(...p3);
    ctx.lineTo(...p4);
    ctx.closePath();
    ctx.fill();

    for (const wp of this.waypoints) {
      const [px, py] = this._worldToMap(wp.x, wp.z);
      ctx.fillStyle = CATEGORY_COLORS[wp.category] ?? '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const [ppx, ppy] = this._worldToMap(player.position.x, player.position.z);
    ctx.save();
    ctx.translate(ppx, ppy);
    ctx.rotate(player.heading);
    ctx.fillStyle = '#ff5a4a';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
