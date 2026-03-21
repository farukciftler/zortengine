import * as THREE from 'three';
import { GameScene as ZortGameScene } from 'zortengine';
import { CameraManager, InputManager } from 'zortengine/browser';

import { Levels, tileSize, buildGrid } from '../data/LevelConfig.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { BaseEntity } from '../actors/Base.js';
import { createFinishLine } from '../utils/FinishLineBuilder.js';
import { LaserTower } from '../towers/LaserTower.js';
import { CannonTower } from '../towers/CannonTower.js';
import { SlowTower } from '../towers/SlowTower.js';

export class GameScene extends ZortGameScene {
    constructor() {
        super({ name: 'game' });
        this.enemies = [];
        this.towers = [];
        this.tiles = [];
        this.gold = 500;
        this.playerHp = 100;
        
        this.levelIndex = 0; // 0=Level 1, 1=Level 2, 2=Level 3...
        this.currentLevel = null;
        this.baseEntities = [];
        this.particles = [];
        this.floatingTexts = [];
        
        this.selectedTowerType = 'laser';
        this.hoverMesh = null;
        this.selectedTile = null; // for upgrades
        
        this.isGameOver = false;
    }

    setup() {
        if (this.engine.renderer) {
            this.engine.renderer.shadowMap.enabled = true;
            this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        this.currentLevel = Levels[this.levelIndex];

        // Format world positions
        this.worldPaths = this.currentLevel.paths.map(path => {
            return path.map(wp => new THREE.Vector3(
                (wp.c - this.currentLevel.cols/2 + 0.5) * tileSize, 
                0, 
                (wp.r - this.currentLevel.rows/2 + 0.5) * tileSize
            ));
        });
        
        this.worldBaseNodes = this.currentLevel.baseNodes.map(wp => new THREE.Vector3(
            (wp.c - this.currentLevel.cols/2 + 0.5) * tileSize, 
            2.5, 
            (wp.r - this.currentLevel.rows/2 + 0.5) * tileSize
        ));

        this.cameraManager = this.registerSystem('camera', new CameraManager(this.getRenderScene()), { priority: 10 });
        this.setCamera(this.cameraManager);
        this.cameraManager.setPreset('2.5d');
        
        this.inputManager = this.registerSystem('input', new InputManager({
            platform: this.engine.platform,
            domElement: this.engine.renderer.domElement,
            autoAttach: true
        }), { priority: 20 });
        this.inputManager.isFpsMode = false;
        
        this._setupLighting();
        this._buildWorld();
        this._bindUI();

        this.waveSystem = new WaveSystem(this, this.worldPaths);
        this.baseEntities = [];
        
        for (let basePos of this.worldBaseNodes) {
            let baseExt = new BaseEntity(this, 100);
            
            // Generate Detailed Racing-style Finish Line
            const finishVisuals = createFinishLine();
            
            baseExt.group.add(finishVisuals.group);
            baseExt.group.position.copy(basePos);
            this.add(baseExt);
            
            baseExt.core = finishVisuals.core;
            baseExt.ring = finishVisuals.ring;
            baseExt.flag = finishVisuals.flag; // New animated flag
            this.baseEntities.push(baseExt);
        }

        // Hover Highlight
        const hGeo = new THREE.PlaneGeometry(tileSize, tileSize);
        hGeo.rotateX(-Math.PI/2);
        this.hoverMesh = new THREE.Mesh(hGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
        this.hoverMesh.visible = false;
        this.threeScene.add(this.hoverMesh);

        // Range Blueprint Circle
        this.rangeCircle = new THREE.Mesh(
            new THREE.RingGeometry(0.95, 1.0, 64),
            new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false })
        );
        this.rangeCircle.rotation.x = -Math.PI / 2;
        this.rangeCircle.visible = false;
        this.threeScene.add(this.rangeCircle);

        // Events
        this.events.on('enemy:killed', (enemy) => {
            this.gold += enemy.reward;
            this.updateHUD();
            this.removeEnemy(enemy);
        });
        
        this.events.on('enemy:reached_base', (enemy) => {
            this.playerHp -= enemy.damage;
            if (this.playerHp <= 0) this.events.emit('base:destroyed');
            else this.events.emit('base:dmg');
            this.removeEnemy(enemy);
        });

        this.events.on('base:dmg', () => this.updateHUD());
        this.events.on('base:destroyed', () => {
            this.updateHUD();
            this.gameOver();
        });
        
        this.inputManager.on('attack', () => this.handlePointClick());
    }

    _setupLighting() {
        this.threeScene.fog = new THREE.FogExp2(0x111520, 0.015);
        this.threeScene.background = new THREE.Color(0x111520);
        
        // Atmosphere soft light
        const hemi = new THREE.HemisphereLight(0x2d3436, 0x090a0f, 2.5);
        this.threeScene.add(hemi);

        const dir = new THREE.DirectionalLight(0xfdcbcb, 2.5);
        dir.position.set(30, 50, 30);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 150;
        dir.shadow.camera.left = -30;
        dir.shadow.camera.right = 30;
        dir.shadow.camera.top = 30;
        dir.shadow.camera.bottom = -30;
        dir.shadow.bias = -0.0005;
        this.threeScene.add(dir);
    }
    
    _buildWorld() {
        const { cols, rows } = this.currentLevel;
        this.gridLogic = buildGrid(this.currentLevel);
        
        // Create meshes
        this.groundGroup = new THREE.Group();
        
        const basePlateGeo = new THREE.BoxGeometry(cols * tileSize + 4, 8, rows * tileSize + 4);
        const basePlateMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.9 });
        const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
        basePlate.position.set(0, -4.5, 0); // Under the map
        basePlate.receiveShadow = true;
        this.groundGroup.add(basePlate);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isPath = !this.gridLogic[r][c];
                
                const height = isPath ? 0.2 : 1.6;
                const centerY = isPath ? -0.1 : -0.4;
                
                const geo = new THREE.BoxGeometry(tileSize * 0.96, height, tileSize * 0.96);
                const colorHex = isPath ? 0x2d3436 : ( ((r+c)%2===0) ? 0x34495e : 0x2c3e50 );
                const mat = new THREE.MeshStandardMaterial({ 
                    color: colorHex,
                    roughness: 0.8,
                    metalness: isPath ? 0.2 : 0.1
                });
                
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((c - cols/2 + 0.5) * tileSize, centerY, (r - rows/2 + 0.5) * tileSize);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                if (!isPath) {
                    const edges = new THREE.LineSegments(
                        new THREE.EdgesGeometry(geo),
                        new THREE.LineBasicMaterial({ color: 0x55efc4, transparent: true, opacity: 0.15 })
                    );
                    mesh.add(edges);
                }

                // Invisible hit plane exactly exactly on top of block for raycasting
                const hitGeo = new THREE.PlaneGeometry(tileSize, tileSize);
                hitGeo.rotateX(-Math.PI/2);
                const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({visible: false}));
                hitMesh.position.set(mesh.position.x, centerY + height/2, mesh.position.z);
                hitMesh.userData = { r, c, buildable: this.gridLogic[r][c], tower: null };
                
                this.groundGroup.add(mesh);
                this.groundGroup.add(hitMesh);
                this.tiles.push(hitMesh);
            }
        }
        this.threeScene.add(this.groundGroup);
    }

    _bindUI() {
        this.hudUI = document.getElementById('hud');
        this.waveUI = document.getElementById('wave-status');
        this.buildUI = document.getElementById('build-menu');
        this.upgradeUI = document.getElementById('upgrade-panel');
        
        this.btnNextWave = document.getElementById('btn-next-wave');
        this.btnNextWave.addEventListener('click', () => {
            if(!this.waveSystem.spawning) {
                this.showWaveBanner(this.waveSystem.wave);
                this.waveSystem.startWave();
                this.btnNextWave.classList.add('hidden');
                this.updateHUD();
            }
        });

        const btns = document.querySelectorAll('.build-btn');
        btns.forEach(b => {
            b.addEventListener('click', (e) => {
                btns.forEach(btn => btn.classList.remove('selected'));
                b.classList.add('selected');
                this.selectedTowerType = b.dataset.type;
                this.hideUpgradePanel();
            });
        });
        
        document.getElementById('btn-upgrade').addEventListener('click', () => {
            if (this.selectedTile && this.selectedTile.userData.tower) {
                let twr = this.selectedTile.userData.tower;
                if (this.gold >= twr.upgradeCost) {
                    this.gold -= twr.upgradeCost;
                    twr.upgrade();
                    this.showUpgradePanel(this.selectedTile);
                    this.updateHUD();
                }
            }
        });
        
        document.getElementById('btn-sell').addEventListener('click', () => {
            if (this.selectedTile && this.selectedTile.userData.tower) {
                let twr = this.selectedTile.userData.tower;
                this.gold += twr.sellValue;
                this.remove(twr);
                
                // Cleanup 3D
                this.threeScene.remove(twr.group);
                this.towers = this.towers.filter(t => t !== twr);
                this.selectedTile.userData.tower = null;
                
                this.hideUpgradePanel();
                this.updateHUD();
            }
        });

        // Next Level button
        const btnNextLvl = document.getElementById('btn-next-level');
        if (btnNextLvl) {
            btnNextLvl.addEventListener('click', () => {
                location.reload(); // Quick reset for now
            });
        }

        // initial build selection
        document.querySelector('[data-type="laser"]').classList.add('selected');
    }

    showWaveBanner(wave) {
        const banner = document.getElementById('wave-banner');
        const text = document.getElementById('banner-text');
        if (!banner || !text) return;
        
        text.innerText = `WAVE ${wave}`;
        banner.classList.remove('hidden');
        text.style.opacity = '1';
        text.style.transform = 'scale(1)';
        
        setTimeout(() => {
            text.style.opacity = '0';
            text.style.transform = 'scale(1.2)';
            setTimeout(() => {
                banner.classList.add('hidden');
                text.style.transform = 'scale(0.8)';
            }, 500);
        }, 2000);
    }

    onWaveEnded() {
        if (this.waveSystem.wave >= 10) { 
            this.victory();
        } else {
            this.btnNextWave.classList.remove('hidden');
        }
    }

    victory() {
        this.isGameOver = true;
        document.getElementById('victory-screen').classList.remove('hidden');
        this.createExplosion(new THREE.Vector3(0, 10, 0), 0xffff00);
        this.createExplosion(new THREE.Vector3(5, 8, -5), 0x00ff00);
        this.createExplosion(new THREE.Vector3(-5, 8, 5), 0x00ffff);
    }

    onResize(width, height, aspect) {
        if (this.cameraManager) {
            this.cameraManager.onResize(aspect);
        }
    }

    onEnter() {
        if(this.hudUI) {
            this.hudUI.classList.remove('hidden');
            this.waveUI.classList.remove('hidden');
            this.buildUI.classList.remove('hidden');
        }
        this.updateHUD();
        
        // Position camera to look at the board
        this.cameraManager.updateFollow(new THREE.Vector3(0,0,0), 0, 0, {
            orthoOffset: new THREE.Vector3(25, 25, 25),
            lookOffset: new THREE.Vector3(0, 0, 0)
        });
    }

    onExit() {
        if(this.hudUI) {
            this.hudUI.classList.add('hidden');
            this.waveUI.classList.add('hidden');
            this.buildUI.classList.add('hidden');
            this.upgradeUI.classList.add('hidden');
        }
    }

    updateHUD() {
        document.getElementById('val-hp').innerText = this.playerHp;
        document.getElementById('val-gold').innerText = this.gold;
        document.getElementById('val-wave').innerText = this.waveSystem.wave;
    }

    spawnEnemy(enemy) {
        this.add(enemy);
        this.enemies.push(enemy);
    }

    removeEnemy(enemy) {
        if (enemy.hp <= 0) {
            const pos = enemy.group.position.clone();
            pos.y += 1;
            this.createExplosion(pos, 0x4facfe);
            this.createFloatingText(pos, `+$${enemy.reward}`, 0x00f2fe);
        }
        
        enemy.isDead = true;
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.remove(enemy);
        if (enemy.group) this.threeScene.remove(enemy.group);
    }

    createExplosion(pos, color) {
        for (let i = 0; i < 8; i++) {
            const size = 0.2 + Math.random() * 0.3;
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
            );
            p.position.copy(pos);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 6
            );
            this.particles.push({ mesh: p, vel, life: 1.0 });
            this.threeScene.add(p);
        }
    }

    createFloatingText(pos, text, color) {
        const p = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.35),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.0 })
        );
        p.position.copy(pos);
        p.position.y += 1.0;
        this.threeScene.add(p);
        this.particles.push({ mesh: p, vel: new THREE.Vector3(0, 3, 0), life: 1.2, isFloatingText: true });
    }

    gameOver() {
        this.isGameOver = true;
        alert("GAME OVER! Wave " + this.waveSystem.wave);
        location.reload(); 
    }

    handlePointClick() {
        if (this.isGameOver) return;
        
        const intersects = this.inputManager.getRaycastIntersection(this.cameraManager.getThreeCamera(), this.tiles);
        if (intersects.length > 0) {
            const tile = intersects[0].object;
            const data = tile.userData;
            
            if (data.tower) {
                // Select existing tower
                this.showUpgradePanel(tile);
            } else if (data.buildable) {
                // Build a new tower
                this.hideUpgradePanel();
                this.buildTower(tile);
            } else {
                this.hideUpgradePanel();
            }
        } else {
            this.hideUpgradePanel();
        }
    }

    buildTower(tile) {
        let TowerClass = LaserTower;
        let pTile = tile.position;
        
        let tempTwr = new LaserTower(this); // Just to get cost, will optimize later
        let cost = 100;
        if(this.selectedTowerType === 'cannon') { TowerClass = CannonTower; cost=200; }
        else if(this.selectedTowerType === 'slow') { TowerClass = SlowTower; cost=150; }
        
        if (this.gold >= cost) {
            this.gold -= cost;
            const twr = new TowerClass(this);
            twr.group.position.copy(pTile);
            this.add(twr);
            this.towers.push(twr);
            tile.userData.tower = twr;
            this.updateHUD();
            console.log(`[GameArea] Built ${twr.id} at [X:${Math.round(pTile.x)}, Z:${Math.round(pTile.z)}]. Gold left: ${this.gold}`);
        } else {
            console.log(`[GameArea] Could not build ${this.selectedTowerType}. Need ${cost} gold, but have ${this.gold}.`);
        }
    }

    showUpgradePanel(tile) {
        this.selectedTile = tile;
        let twr = tile.userData.tower;
        document.getElementById('upg-title').innerText = twr.type.toUpperCase() + ' TOWER';
        document.getElementById('upg-lvl').innerText = twr.level;
        document.getElementById('upg-dmg').innerText = twr.damage.toFixed(0);
        document.getElementById('upg-cost').innerText = twr.upgradeCost;
        this.upgradeUI.classList.remove('hidden');
    }

    hideUpgradePanel() {
        this.selectedTile = null;
        this.upgradeUI.classList.add('hidden');
    }

    onUpdate(delta, time) {
        if (this.isGameOver) return;
        
        let showingRange = false;
        
        // Show range of currently selected tower
        if (this.selectedTile && this.selectedTile.userData.tower) {
            const twr = this.selectedTile.userData.tower;
            this.rangeCircle.position.set(twr.group.position.x, twr.group.position.y + 0.1, twr.group.position.z);
            this.rangeCircle.scale.setScalar(twr.range);
            this.rangeCircle.material.color.setHex(0x00f2fe);
            this.rangeCircle.visible = true;
            showingRange = true;
        }
        
        if (this.inputManager && this.tiles.length > 0) {
            const intersects = this.inputManager.getRaycastIntersection(this.cameraManager.getThreeCamera(), this.tiles);
            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const data = hitMesh.userData;
                this.hoverMesh.position.x = hitMesh.position.x;
                this.hoverMesh.position.y = hitMesh.position.y + 0.02; // Always visible on top of correct block
                this.hoverMesh.position.z = hitMesh.position.z;
                this.hoverMesh.visible = true;
                
                if(data.tower) {
                    this.hoverMesh.material.color.setHex(0x00a8ff);
                    if (!showingRange) {
                        const twr = data.tower;
                        this.rangeCircle.position.set(twr.group.position.x, twr.group.position.y + 0.1, twr.group.position.z);
                        this.rangeCircle.scale.setScalar(twr.range);
                        this.rangeCircle.material.color.setHex(0xffffff);
                        this.rangeCircle.visible = true;
                        showingRange = true;
                    }
                } else if(data.buildable) {
                    this.hoverMesh.material.color.setHex(0xffffff);
                    if (!showingRange) {
                        let r = 12;
                        if(this.selectedTowerType === 'cannon') r = 8;
                        else if(this.selectedTowerType === 'slow') r = 10;
                        
                        this.rangeCircle.position.set(hitMesh.position.x, hitMesh.position.y + 0.1, hitMesh.position.z);
                        this.rangeCircle.scale.setScalar(r);
                        this.rangeCircle.material.color.setHex(0x00f2fe);
                        this.rangeCircle.visible = true;
                        showingRange = true;
                    }
                } else {
                    this.hoverMesh.material.color.setHex(0xe84118);
                }
            } else {
                this.hoverMesh.visible = false;
            }
        }
        if (!showingRange) {
            this.rangeCircle.visible = false;
        }

        // Animate particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.threeScene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.mesh.position.add(p.vel.clone().multiplyScalar(delta));
            if (!p.isFloatingText) {
                p.vel.y -= delta * 15; // Gravity
                p.mesh.scale.setScalar(p.life);
                p.mesh.rotation.x += delta * 5;
            } else {
                p.mesh.rotation.y += delta * 3;
                p.mesh.scale.setScalar(0.8 + Math.sin(time * 10) * 0.2);
            }
            if (p.mesh.material.opacity) p.mesh.material.opacity = p.life;
        }

        this.cameraManager.updateFollow(new THREE.Vector3(0,0,0), 0, delta, {
            orthoOffset: new THREE.Vector3(25, 25, 25),
            lookOffset: new THREE.Vector3(0, 0, 0)
        });

        this.waveSystem.update(delta);
        
        for (let b of this.baseEntities) {
            if (b.flag) {
                b.flag.children.forEach(piece => {
                    // Waving on the X axis since flag is spanning Z
                    const wave = Math.sin(time * 3 + piece.userData.phase) * 0.15;
                    piece.position.x = piece.userData.origX + wave;
                    piece.position.y = piece.userData.origY + Math.cos(time * 2 + piece.userData.phase) * 0.05;
                });
            }
        }

        // ZortEngine scenes require explicit ticks for custom behavior unless using System/Component
        for (let enemy of this.enemies) {
            if (!enemy.isDead) enemy.onUpdate(delta, time);
        }
        for (let tower of this.towers) {
            tower.onUpdate(delta, time);
        }
    }
}
