/**
 * Dungeon tile tipleri: 0=zemin, 1=duvar, 2=koridor
 * Oda/koridor layout — 15x15 grid
 */
export const DUNGEON_TILE = {
  FLOOR: 0,
  WALL: 1,
  CORRIDOR: 2,
};

export const DUNGEON_TILE_SIZE = 2;

export function isDungeonWalkable(tile) {
  return tile === DUNGEON_TILE.FLOOR || tile === DUNGEON_TILE.CORRIDOR;
}

/** Oda merkezleri — düşman spawn noktaları */
export const DUNGEON_SPAWN_POINTS = [
  { gx: 4, gz: 4 },
  { gx: 10, gz: 4 },
  { gx: 4, gz: 10 },
  { gx: 10, gz: 10 },
  { gx: 7, gz: 7 },
];

/** Portal pozisyonu (giriş/çıkış) */
export const DUNGEON_PORTAL = { gx: 1, gz: 1 };

/** Dungeon haritası — odalar ve koridorlar */
export const DUNGEON_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export function dungeonGridToWorld(gx, gz) {
  const cols = DUNGEON_MAP[0]?.length ?? 15;
  const rows = DUNGEON_MAP.length;
  const halfW = cols * DUNGEON_TILE_SIZE * 0.5;
  const halfH = rows * DUNGEON_TILE_SIZE * 0.5;
  return {
    x: gx * DUNGEON_TILE_SIZE - halfW + DUNGEON_TILE_SIZE * 0.5,
    z: gz * DUNGEON_TILE_SIZE - halfH + DUNGEON_TILE_SIZE * 0.5,
  };
}

export function dungeonWorldToGrid(x, z) {
  const cols = DUNGEON_MAP[0]?.length ?? 15;
  const rows = DUNGEON_MAP.length;
  const halfW = cols * DUNGEON_TILE_SIZE * 0.5;
  const halfH = rows * DUNGEON_TILE_SIZE * 0.5;
  return {
    gx: Math.floor((x + halfW) / DUNGEON_TILE_SIZE),
    gz: Math.floor((z + halfH) / DUNGEON_TILE_SIZE),
  };
}

export function getDungeonTile(gx, gz) {
  if (gz < 0 || gz >= DUNGEON_MAP.length) return DUNGEON_TILE.WALL;
  const row = DUNGEON_MAP[gz];
  if (gx < 0 || gx >= row.length) return DUNGEON_TILE.WALL;
  return row[gx];
}
