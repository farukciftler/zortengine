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
        baseNodes: [{ c: 15, r: 4 }],
        buffZones: [
            { r: 3, c: 2, type: 'range', bonus: 0.25 },
            { r: 8, c: 4, type: 'damage', bonus: 0.3 },
            { r: 5, c: 8, type: 'range', bonus: 0.2 },
        ]
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
                { c: 4, r: 7 },
                { c: 17, r: 7 }
            ]
        ],
        baseNodes: [{ c: 17, r: 7 }],
        buffZones: [
            { r: 4, c: 7, type: 'range', bonus: 0.2 },
            { r: 12, c: 3, type: 'damage', bonus: 0.25 },
            { r: 6, c: 10, type: 'range', bonus: 0.3 },
            { r: 8, c: 15, type: 'damage', bonus: 0.2 },
        ]
    },
    {
        id: 3,
        name: "Crossroads of Doom",
        cols: 18,
        rows: 18,
        paths: [
            [
                { c: 4, r: -1 },
                { c: 4, r: 14 },
                { c: 18, r: 14 }
            ],
            [
                { c: 14, r: -1 },
                { c: 14, r: 8 },
                { c: -1, r: 8 }
            ]
        ],
        baseNodes: [{ c: 18, r: 14 }, { c: -1, r: 8 }],
        buffZones: [
            { r: 3, c: 5, type: 'damage', bonus: 0.3 },
            { r: 13, c: 3, type: 'range', bonus: 0.25 },
            { r: 7, c: 13, type: 'damage', bonus: 0.2 },
            { r: 15, c: 16, type: 'range', bonus: 0.3 },
        ]
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
