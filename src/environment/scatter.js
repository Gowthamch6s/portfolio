// Shared by every instanced-object scatterer (trees, rocks, ...) — random points within
// bounds, keeping a central corridor clear so decorations never block the direct ski line
// or spawn inside the shop.
const EXCLUSION_HALF_WIDTH = 26;

export function scatterPositions(count, { minX, maxX, minZ, maxZ }) {
  const positions = [];
  let attempts = 0;
  while (positions.length < count && attempts < count * 20) {
    attempts++;
    const x = minX + Math.random() * (maxX - minX);
    if (Math.abs(x) < EXCLUSION_HALF_WIDTH) continue;
    const z = minZ + Math.random() * (maxZ - minZ);
    positions.push({ x, z });
  }
  return positions;
}
