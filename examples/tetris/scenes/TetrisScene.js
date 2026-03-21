import * as THREE from 'three';
import { GameScene } from 'zortengine';

const COLS = 10;
const ROWS = 20;

const COLORS = [
    0x000000,
    0x0ff0fc, // I
    0x39ff14, // S
    0xff073a, // Z
    0xffaa00, // L
    0xfc0fc0, // J
    0xffff00, // O
    0xa200ff  // T
];

const PIECES = [
    null,
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[0,2,2],[2,2,0],[0,0,0]], // S
    [[3,3,0],[0,3,3],[0,0,0]], // Z
    [[0,0,4],[4,4,4],[0,0,0]], // L
    [[5,0,0],[5,5,5],[0,0,0]], // J
    [[6,6],[6,6]], // O
    [[0,7,0],[7,7,7],[0,0,0]]  // T
];

export class TetrisScene extends GameScene {
    constructor() {
        super({ name: 'tetris' });
    }

    setup() {
        this.board = Array.from({length: ROWS}, () => Array(COLS).fill(null));
        this.score = 0;
        this.lines = 0;
        
        // Mükemmel uzay karanlığı arka planı
        this.threeScene.background = new THREE.Color(0x050510);
        
        // Kamera Ayarları
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
        camera.position.set(COLS/2 - 0.5, ROWS/2 - 0.5, 25);
        this.setCamera(camera);

        // Işıklar
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.threeScene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 30);
        this.threeScene.add(dirLight);

        // Oyun tahtası sınırı (Grid benzeri efekt)
        const boardGeo = new THREE.BoxGeometry(COLS, ROWS, 1);
        const boardMat = new THREE.MeshBasicMaterial({ color: 0x334466, wireframe: true, transparent: true, opacity: 0.1 });
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.position.set(COLS/2 - 0.5, ROWS/2 - 0.5, -0.5);
        this.threeScene.add(boardMesh);

        // Geometri ve materyallerin önbelleğe alınması
        this.blockGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        this.materials = COLORS.map(color => new THREE.MeshStandardMaterial({
            color: color, 
            roughness: 0.2, 
            metalness: 0.3, 
            emissive: color, 
            emissiveIntensity: 0.4
        }));

        this.player = { pos: {x:0, y:0}, matrix: null };
        this.dropCounter = 0;
        this.dropInterval = 0.8; 
        
        this.activeMeshes = [];
        this.animations = [];
        this.isAnimating = false;

        this.scoreEl = document.getElementById('score');
        this.linesEl = document.getElementById('lines');

        this.resetPlayer();

        // Klavye Event Bind
        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    createBlockMesh(id, x, y) {
        const mesh = new THREE.Mesh(this.blockGeo, this.materials[id]);
        mesh.position.set(x, ROWS - 1 - y, 0);
        this.threeScene.add(mesh);
        return mesh;
    }

    collide(board, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const by = y + o.y;
                    const bx = x + o.x;
                    if (bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const bx = x + player.pos.x;
                    const by = y + player.pos.y;
                    if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
                        const mesh = this.createBlockMesh(value, bx, by);
                        mesh.userData = { targetY: mesh.position.y }; // Animasyon için default
                        board[by][bx] = mesh;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesToClear = [];
        for (let y = ROWS - 1; y >= 0; --y) {
            let full = true;
            for (let x = 0; x < COLS; ++x) {
                if (this.board[y][x] === null) {
                    full = false;
                    break;
                }
            }
            if (full) linesToClear.push(y);
        }

        if (linesToClear.length > 0) {
            this.isAnimating = true;

            // Animasyon objesi ekle
            this.animations.push({
                time: 0,
                duration: 0.3, // Silinme animasyonu süresi
                lines: linesToClear,
                onComplete: () => {
                    // Ekranda yok et
                    for(let y of linesToClear) {
                        for(let x=0; x<COLS; x++) {
                            this.threeScene.remove(this.board[y][x]);
                            this.board[y][x] = null;
                        }
                    }
                    
                    // Yukarıdaki blokları aşağı kaydır
                    let shift = 0;
                    for(let y = ROWS - 1; y >= 0; --y) {
                        if (linesToClear.includes(y)) {
                            shift++;
                        } else if (shift > 0) {
                            for(let x=0; x<COLS; x++) {
                                this.board[y+shift][x] = this.board[y][x];
                                this.board[y][x] = null;
                            }
                        }
                    }
                    
                    // Kalan bloklara aşağı düşme animasyonu (fluid render) ekle
                    for (let y=0; y<ROWS; ++y) {
                        for(let x=0; x<COLS; x++) {
                            if (this.board[y][x]) {
                                const targetY = ROWS - 1 - y;
                                const mesh = this.board[y][x];
                                if (mesh.position.y !== targetY) {
                                    mesh.userData.startY = mesh.position.y;
                                    mesh.userData.targetY = targetY;
                                    mesh.userData.time = 0;
                                    mesh.userData.duration = 0.2; // 200ms kayma süresi
                                }
                            }
                        }
                    }

                    this.lines += linesToClear.length;
                    const scores = [0, 40, 100, 300, 1200];
                    this.score += scores[linesToClear.length];
                    if(this.scoreEl) this.scoreEl.innerText = this.score;
                    if(this.linesEl) this.linesEl.innerText = this.lines;
                    this.dropInterval = Math.max(0.1, 0.8 - Math.floor(this.lines / 10) * 0.1);

                    this.isAnimating = false;
                    this.resetPlayer();
                }
            });
        } else {
            this.resetPlayer();
        }
    }

    resetPlayer() {
        // Objeleri GC zorlamamak için tekrar kullan
        this.activeMeshes.forEach(mesh => this.threeScene.remove(mesh));
        this.activeMeshes = [];

        const id = Math.floor(Math.random() * (PIECES.length - 1)) + 1;
        this.player.matrix = PIECES[id].map(row => [...row]);
        this.player.pos.y = 0;
        this.player.pos.x = Math.floor(COLS / 2) - Math.floor(this.player.matrix[0].length / 2);

        if (this.collide(this.board, this.player)) {
            // Game Over
            this.board.forEach(row => row.forEach(mesh => {
                if (mesh) this.threeScene.remove(mesh);
            }));
            this.board = Array.from({length: ROWS}, () => Array(COLS).fill(null));
            this.score = 0;
            this.lines = 0;
            if(this.scoreEl) this.scoreEl.innerText = this.score;
            if(this.linesEl) this.linesEl.innerText = this.lines;
            this.dropInterval = 0.8;
            this.dropCounter = 0;
        }
    }

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    playerRotate(dir) {
        if (this.isAnimating) return;
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, dir);
        while (this.collide(this.board, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
        // Snap movement visually
        this.updatePlayerMeshes(true);
    }

    playerMove(offset) {
        if (this.isAnimating) return;
        this.player.pos.x += offset;
        if (this.collide(this.board, this.player)) {
            this.player.pos.x -= offset;
        } else {
            // Snap movement visually for instant feedback
            this.updatePlayerMeshes(true);
        }
    }

    playerDrop() {
        if (this.isAnimating) return;
        this.player.pos.y++;
        if (this.collide(this.board, this.player)) {
            this.player.pos.y--;
            this.merge(this.board, this.player);
            this.clearLines();
        }
        this.dropCounter = 0;
    }

    playerHardDrop() {
        if (this.isAnimating) return;
        while(!this.collide(this.board, this.player)) {
            this.player.pos.y++;
        }
        this.player.pos.y--;
        this.merge(this.board, this.player);
        this.clearLines();
        this.dropCounter = 0;
    }

    handleKeyDown(event) {
        if (this.isAnimating) return;
        switch (event.code) {
            case 'ArrowLeft': 
                this.playerMove(-1); 
                break;
            case 'ArrowRight': 
                this.playerMove(1); 
                break;
            case 'ArrowDown': 
                this.playerDrop(); 
                break;
            case 'ArrowUp': 
                this.playerRotate(1); 
                break;
            case 'Space': 
                this.playerHardDrop(); 
                break;
        }
    }

    updatePlayerMeshes(snap = false) {
        // Interpolate falling for fluidity
        let smoothY = this.player.pos.y;
        if (!snap) {
            smoothY += Math.min(this.dropCounter, this.dropInterval) / this.dropInterval;
        }

        let meshIdx = 0;
        this.player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const bx = x + this.player.pos.x;
                    const by = y + smoothY;
                    
                    if (meshIdx < this.activeMeshes.length) {
                        const mesh = this.activeMeshes[meshIdx];
                        mesh.position.set(bx, ROWS - 1 - by, 0);
                        mesh.material = this.materials[value]; 
                    } else {
                        const mesh = this.createBlockMesh(value, bx, by);
                        this.activeMeshes.push(mesh);
                    }
                    meshIdx++;
                }
            });
        });
        
        while(this.activeMeshes.length > meshIdx) {
            const mesh = this.activeMeshes.pop();
            this.threeScene.remove(mesh);
        }
    }

    onUpdate(delta, time) {
        // Row destroying animations
        for (let i = this.animations.length - 1; i >= 0; --i) {
            const anim = this.animations[i];
            anim.time += delta;
            const progress = Math.min(1, anim.time / anim.duration);
            
            for(let y of anim.lines) {
                for(let x=0; x<COLS; x++) {
                    if (this.board[y][x]) {
                        // Küçül ve dön (Fluid animation)
                        this.board[y][x].scale.setScalar(1 - Math.pow(progress, 2));
                        this.board[y][x].rotation.x += delta * 15;
                        this.board[y][x].rotation.y += delta * 15;
                    }
                }
            }
            
            if (progress >= 1) {
                anim.onComplete();
                this.animations.splice(i, 1);
            }
        }
        
        // Row falling animations (Interpolation for remaining blocks after clear)
        for (let y = 0; y < ROWS; ++y) {
            for (let x = 0; x < COLS; ++x) {
                const mesh = this.board[y][x];
                if (mesh && mesh.userData && mesh.userData.duration > 0) {
                    mesh.userData.time += delta;
                    const progress = Math.min(1, mesh.userData.time / mesh.userData.duration);
                    
                    const targetY = mesh.userData.targetY;
                    const startY = mesh.userData.startY;
                    // EaseOutQuint
                    const easeOut = 1 - Math.pow(1 - progress, 5);
                    mesh.position.y = startY + (targetY - startY) * easeOut;
                    
                    if (progress >= 1) {
                        mesh.position.y = targetY; // Ensure exact finish position
                        mesh.userData.duration = 0; 
                    }
                }
            }
        }

        if (!this.isAnimating) {
            this.dropCounter += delta;
            if (this.dropCounter > this.dropInterval) {
                this.playerDrop();
            }
            this.updatePlayerMeshes();
        }
    }

    onExit() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
