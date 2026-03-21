// Grid is based on [row][col], where row is Z and col is X visually.
export const LevelConfig = {
    tileSize: 2,
    cols: 16,
    rows: 12,
    // Waypoints in (col, row)
    waypoints: [
        { c: -1, r: 2 }, // Spawn slightly off map
        { c: 3, r: 2 },
        { c: 3, r: 9 },
        { c: 9, r: 9 },
        { c: 9, r: 4 },
        { c: 15, r: 4 }  // Base
    ]
};

// Generate buildable grid
export function buildGrid() {
    let grid = Array.from({length: LevelConfig.rows}, () => Array(LevelConfig.cols).fill(true));
    
    // Mark path as unbuildable
    const w = LevelConfig.waypoints;
    for (let i = 0; i < w.length - 1; i++) {
        let p1 = w[i];
        let p2 = w[i+1];
        
        let minC = Math.max(0, Math.min(p1.c, p2.c));
        let maxC = Math.min(LevelConfig.cols - 1, Math.max(p1.c, p2.c));
        let minR = Math.max(0, Math.min(p1.r, p2.r));
        let maxR = Math.min(LevelConfig.rows - 1, Math.max(p1.r, p2.r));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                grid[r][c] = false;
            }
        }
    }
    // Base is unbuildable
    grid[4][15] = false; 

    return grid;
}
