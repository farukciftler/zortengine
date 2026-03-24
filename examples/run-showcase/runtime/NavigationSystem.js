import * as THREE from 'three';
import { STREET_OBSTACLES, NPC_BUILDING_EXCLUSIONS } from '../buildings/StreetLayout.js';

/**
 * A simple A* pathfinding system for the sidewalk environment.
 */
export class NavigationSystem {
    constructor(bounds) {
        this.bounds = bounds; // { xMin, xMax, zMin, zMax }
        this.cellSize = 0.5;
        this.cols = Math.ceil((bounds.xMax - bounds.xMin) / this.cellSize);
        this.rows = Math.ceil((bounds.zMax - bounds.zMin) / this.cellSize);
        
        this.grid = new Uint8Array(this.cols * this.rows); // 0=free, 1=blocked
        this._buildGrid();
    }

    _buildGrid() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.bounds.xMin + c * this.cellSize + this.cellSize / 2;
                const z = this.bounds.zMin + r * this.cellSize + this.cellSize / 2;

                // Check buildings
                let blocked = NPC_BUILDING_EXCLUSIONS.some(b => 
                    x >= b.xMin - 0.4 && x <= b.xMax + 0.4 && 
                    z >= b.zMin - 0.4 && z <= b.zMax + 0.4
                );

                // Check props
                if (!blocked) {
                    blocked = STREET_OBSTACLES.some(obs => {
                        const dx = x - obs.x;
                        const dz = z - obs.z;
                        return (dx * dx + dz * dz) < (obs.radius + 0.4) ** 2;
                    });
                }

                if (blocked) {
                    this.grid[r * this.cols + c] = 1;
                }
            }
        }
    }

    findPath(startPos, endPos) {
        const start = this._posToGrid(startPos);
        const end = this._posToGrid(endPos);
        
        if (!this._isValid(start.c, start.r)) return null;
        if (!this._isValid(end.c, end.r)) return null;

        const queue = [{ c: start.c, r: start.r, path: [] }];
        const visited = new Set();
        visited.add(`${start.c},${start.r}`);

        // Simple BFS for pathfinding (A* would be better but BFS is fine for this small grid)
        // Wait, for 14k cells BFS is okay but A* is much faster.
        // Let's use A*.
        
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${start.c},${start.r}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this._heuristic(start, end));

        while (openSet.length > 0) {
            // Get node with lowest fScore
            openSet.sort((a, b) => fScore.get(`${a.c},${a.r}`) - fScore.get(`${b.c},${b.r}`));
            const current = openSet.shift();
            const currentKey = `${current.c},${current.r}`;

            if (current.c === end.c && current.r === end.r) {
                return this._reconstructPath(cameFrom, current);
            }

            const neighbors = this._getNeighbors(current.c, current.r);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.c},${neighbor.r}`;
                const tentativeG = gScore.get(currentKey) + 1;
                
                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this._heuristic(neighbor, end));
                    if (!openSet.some(n => n.c === neighbor.c && n.r === neighbor.r)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null;
    }

    _heuristic(p1, p2) {
        return Math.abs(p1.c - p2.c) + Math.abs(p1.r - p2.r);
    }

    _getNeighbors(c, r) {
        const neighbors = [];
        const dirs = [
            { c: 0, r: 1 }, { c: 0, r: -1 }, { c: 1, r: 0 }, { c: -1, r: 0 },
            { c: 1, r: 1 }, { c: 1, r: -1 }, { c: -1, r: 1 }, { c: -1, r: -1 }
        ];
        for (const d of dirs) {
            const nc = c + d.c;
            const nr = r + d.r;
            if (this._isValid(nc, nr) && this.grid[nr * this.cols + nc] === 0) {
                neighbors.push({ c: nc, r: nr });
            }
        }
        return neighbors;
    }

    _posToGrid(pos) {
        return {
            c: Math.floor((pos.x - this.bounds.xMin) / this.cellSize),
            r: Math.floor((pos.z - this.bounds.zMin) / this.cellSize)
        };
    }

    _gridToPos(c, r) {
        return new THREE.Vector3(
            this.bounds.xMin + c * this.cellSize + this.cellSize / 2,
            0,
            this.bounds.zMin + r * this.cellSize + this.cellSize / 2
        );
    }

    _isValid(c, r) {
        return c >= 0 && c < this.cols && r >= 0 && r < this.rows;
    }

    _reconstructPath(cameFrom, current) {
        const path = [];
        let curr = current;
        while (curr) {
            path.push(this._gridToPos(curr.c, curr.r));
            curr = cameFrom.get(`${curr.c},${curr.r}`);
        }
        return path.reverse();
    }
}
