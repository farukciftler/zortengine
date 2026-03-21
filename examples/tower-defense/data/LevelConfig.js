export const Levels = [
    {
        id: 1,
        name: "Valley of Beginnings",
        cols: 16,
        rows: 12,
        paths: [
            [
                { c: -1, r: 2 },
                { c: 3, r: 2 },
                { c: 3, r: 9 },
                { c: 9, r: 9 },
                { c: 9, r: 4 },
                { c: 15, r: 4 }
            ]
        ],
        baseNodes: [{ c: 15, r: 4 }]
    },
    {
        id: 2,
        name: "Twin Rivers",
        cols: 18,
        rows: 16,
        paths: [
            [
                { c: -1, r: 3 },
                { c: 8, r: 3 },
                { c: 8, r: 7 },
                { c: 17, r: 7 }
            ],
            [
                { c: -1, r: 13 },
                { c: 4, r: 13 },
                { c: 4, r: 7 }, // Joins middle
                { c: 17, r: 7 }
            ]
        ],
        baseNodes: [{ c: 17, r: 7 }]
    },
    {
        id: 3,
        name: "Crossroads of Doom",
        cols: 18,
        rows: 18,
        paths: [
            [
                { c: 4, r: -1 }, // Top
                { c: 4, r: 14 },
                { c: 18, r: 14 } // Unites at Exit right
            ],
            [
                { c: 14, r: -1 }, // Top right
                { c: 14, r: 8 },
                { c: -1, r: 8 }  // Exit left
            ]
        ],
        baseNodes: [{ c: 18, r: 14 }, { c: -1, r: 8 }]
    }
];

export const tileSize = 2;

export function buildGrid(level) {
    let grid = Array.from({length: level.rows}, () => Array(level.cols).fill(true));
    
    // Mark path as unbuildable
    for (let path of level.paths) {
        for (let i = 0; i < path.length - 1; i++) {
            let p1 = path[i];
            let p2 = path[i+1];
            
            let minC = Math.max(0, Math.min(p1.c, p2.c));
            let maxC = Math.min(level.cols - 1, Math.max(p1.c, p2.c));
            let minR = Math.max(0, Math.min(p1.r, p2.r));
            let maxR = Math.min(level.rows - 1, Math.max(p1.r, p2.r));

            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    grid[r][c] = false;
                }
            }
        }
    }
    return grid;
}
