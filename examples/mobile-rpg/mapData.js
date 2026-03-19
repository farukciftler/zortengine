/**
 * Tile tipleri: 0=çim, 1=yol, 2=su, 3=duvar
 * Grid: map[z][x] — Z satır (yukarı/aşağı), X sütun (sol/sağ)
 */
export const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  WALL: 3,
};

export const TILE_SIZE = 2; // world unit per tile

/** Geçilebilir mi (yürünebilir) */
export function isWalkable(tile) {
  return tile === TILE.GRASS || tile === TILE.PATH;
}

/** Dünya haritası — 20x20 grid */
export const WORLD_MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/** Grid indeksinden world pozisyonu */
export function gridToWorld(gx, gz) {
  const half = (WORLD_MAP[0]?.length ?? 0) * TILE_SIZE * 0.5;
  return {
    x: gx * TILE_SIZE - half + TILE_SIZE * 0.5,
    z: gz * TILE_SIZE - half + TILE_SIZE * 0.5,
  };
}

/** World pozisyonundan grid indeksi */
export function worldToGrid(x, z) {
  const cols = WORLD_MAP[0]?.length ?? 0;
  const rows = WORLD_MAP.length;
  const halfW = cols * TILE_SIZE * 0.5;
  const halfH = rows * TILE_SIZE * 0.5;
  const gx = Math.floor((x + halfW) / TILE_SIZE);
  const gz = Math.floor((z + halfH) / TILE_SIZE);
  return { gx, gz };
}

/** Tile değeri al (bounds dışı = duvar) */
export function getTile(gx, gz) {
  if (gz < 0 || gz >= WORLD_MAP.length) return TILE.WALL;
  const row = WORLD_MAP[gz];
  if (gx < 0 || gx >= row.length) return TILE.WALL;
  return row[gx];
}
